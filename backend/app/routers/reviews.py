"""SRS deck + review endpoints (the core loop, now card-type aware).

A card is a (chant_id, card_type) pair with its own SM-2 state.
"""
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import distinct, func, select
from sqlalchemy.orm import Session

from app import cards
from app.constants import (
    CARD_TYPE_LABELS,
    CARD_TYPES,
    office_label,
)
from app.db import get_db
from app.models import Chant, ReviewState, chant_tags
from app.schemas import (
    BulkAddIn,
    BulkAddResult,
    ChantDetail,
    ClozePayload,
    ContinuationPayload,
    DeckAddIn,
    DeckCardCount,
    DeckStats,
    DueCard,
    GradeIn,
    ReviewStateOut,
)
from app.srs import SrsState, review as sm2_review

router = APIRouter(prefix="/api/reviews", tags=["reviews"])


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _state_out(rs: ReviewState) -> ReviewStateOut:
    return ReviewStateOut(
        chant_id=rs.chant_id,
        card_type=rs.card_type,
        repetitions=rs.repetitions,
        ease_factor=rs.ease_factor,
        interval_days=rs.interval_days,
        due_at=rs.due_at,
        last_reviewed_at=rs.last_reviewed_at,
    )


def _detail(c: Chant) -> ChantDetail:
    return ChantDetail(
        id=c.id,
        incipit=c.incipit,
        mode=c.mode,
        office_part=c.office_part,
        office_label=office_label(c.office_part),
        in_deck=True,
        cantusid=c.cantusid,
        transcriber=c.transcriber,
        commentary=c.commentary or None,
        gabc=c.gabc,
    )


def _due_card(rs: ReviewState) -> DueCard:
    chant = rs.chant
    payload = cards.build_card_payload(chant.id, chant.gabc or "", rs.card_type)
    card = DueCard(
        card_type=rs.card_type,
        card_type_label=CARD_TYPE_LABELS.get(rs.card_type, rs.card_type),
        chant=_detail(chant),
        review=_state_out(rs),
    )
    if rs.card_type == "cloze" and payload:
        card.cloze = ClozePayload(**payload)
    elif rs.card_type == "continuation" and payload:
        card.continuation = ContinuationPayload(**payload)
    return card


@router.post("/deck/{chant_id}", response_model=DeckCardCount, status_code=201)
def add_to_deck(
    chant_id: int, body: DeckAddIn | None = None, db: Session = Depends(get_db)
):
    """Add a chant's cards to the deck (due immediately).

    Without a body, all applicable card types are created.
    """
    chant = db.get(Chant, chant_id)
    if not chant:
        raise HTTPException(404, "Chant not found")

    applicable = cards.applicable_card_types(chant_id, chant.gabc or "")
    requested = (body.card_types if body and body.card_types else applicable)
    to_add = [t for t in requested if t in applicable]

    now = _now()
    existing = {
        rs.card_type
        for rs in db.scalars(
            select(ReviewState).where(ReviewState.chant_id == chant_id)
        )
    }
    for ct in to_add:
        if ct not in existing:
            db.add(ReviewState(chant_id=chant_id, card_type=ct, due_at=now))
    db.commit()

    have = sorted(
        db.scalars(
            select(ReviewState.card_type).where(ReviewState.chant_id == chant_id)
        ).all()
    )
    return DeckCardCount(chant_id=chant_id, card_types=have)


@router.post("/bulk-add", response_model=BulkAddResult, status_code=201)
def bulk_add_to_deck(body: BulkAddIn, db: Session = Depends(get_db)):
    """Add every chant matching a collection filter to the deck."""
    stmt = select(Chant)
    if body.search:
        stmt = stmt.where(Chant.incipit.ilike(f"%{body.search}%"))
    if body.mode:
        stmt = stmt.where(Chant.mode == body.mode)
    if body.office:
        stmt = stmt.where(Chant.office_part == body.office)
    if body.tag_id is not None:
        stmt = stmt.where(
            Chant.id.in_(
                select(chant_tags.c.chant_id).where(
                    chant_tags.c.tag_id == body.tag_id
                )
            )
        )
    chants = db.scalars(stmt.limit(body.limit)).all()

    now = _now()
    chants_added = cards_added = 0
    for chant in chants:
        applicable = cards.applicable_card_types(chant.id, chant.gabc or "")
        requested = [t for t in (body.card_types or applicable) if t in applicable]
        existing = {
            rs.card_type
            for rs in db.scalars(
                select(ReviewState).where(ReviewState.chant_id == chant.id)
            )
        }
        added_here = 0
        for ct in requested:
            if ct not in existing:
                db.add(ReviewState(chant_id=chant.id, card_type=ct, due_at=now))
                added_here += 1
        if added_here:
            chants_added += 1
            cards_added += added_here
    db.commit()
    return BulkAddResult(chants_added=chants_added, cards_added=cards_added)


@router.delete("/deck/{chant_id}", status_code=204)
def remove_from_deck(chant_id: int, db: Session = Depends(get_db)):
    """Remove all of a chant's cards from the deck."""
    db.query(ReviewState).filter(ReviewState.chant_id == chant_id).delete()
    db.commit()


@router.get("/due", response_model=list[DueCard])
def due_cards(db: Session = Depends(get_db), limit: int = Query(20, ge=1, le=100)):
    rows = db.scalars(
        select(ReviewState)
        .where(ReviewState.due_at <= _now())
        .order_by(ReviewState.due_at)
        .limit(limit)
    ).all()
    return [_due_card(rs) for rs in rows]


@router.post("/{chant_id}/{card_type}/grade", response_model=ReviewStateOut)
def grade_card(
    chant_id: int, card_type: str, body: GradeIn, db: Session = Depends(get_db)
):
    """Apply an SM-2 review to one card. Auto-adds the card if absent."""
    if card_type not in CARD_TYPES:
        raise HTTPException(400, f"Unknown card type: {card_type}")
    chant = db.get(Chant, chant_id)
    if not chant:
        raise HTTPException(404, "Chant not found")

    rs = db.get(ReviewState, (chant_id, card_type))
    if rs is None:
        rs = ReviewState(chant_id=chant_id, card_type=card_type)
        db.add(rs)

    now = _now()
    new_state, next_due = sm2_review(
        SrsState(rs.repetitions, rs.ease_factor, rs.interval_days),
        body.grade,
        now=now,
    )
    rs.repetitions = new_state.repetitions
    rs.ease_factor = new_state.ease_factor
    rs.interval_days = new_state.interval_days
    rs.due_at = next_due
    rs.last_reviewed_at = now
    db.commit()
    db.refresh(rs)
    return _state_out(rs)


@router.get("/stats", response_model=DeckStats)
def deck_stats(db: Session = Depends(get_db)):
    now = _now()
    day_ago = now - timedelta(days=1)
    deck_size = db.scalar(select(func.count()).select_from(ReviewState)) or 0
    chants_in_deck = (
        db.scalar(select(func.count(distinct(ReviewState.chant_id)))) or 0
    )
    due_now = db.scalar(
        select(func.count()).select_from(ReviewState).where(ReviewState.due_at <= now)
    ) or 0
    reviewed_today = db.scalar(
        select(func.count())
        .select_from(ReviewState)
        .where(ReviewState.last_reviewed_at >= day_ago)
    ) or 0
    return DeckStats(
        deck_size=deck_size,
        due_now=due_now,
        reviewed_today=reviewed_today,
        chants_in_deck=chants_in_deck,
    )
