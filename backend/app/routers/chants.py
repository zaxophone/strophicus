"""Chant browse/search endpoints."""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app import audio
from app.constants import office_label
from app.db import get_db
from app.models import Chant, ReviewState, chant_tags
from app.schemas import AudioSequence, ChantDetail, ChantList, ChantSummary

router = APIRouter(prefix="/api/chants", tags=["chants"])


def _summary(c: Chant, in_deck: bool) -> ChantSummary:
    return ChantSummary(
        id=c.id,
        incipit=c.incipit,
        mode=c.mode,
        office_part=c.office_part,
        office_label=office_label(c.office_part),
        in_deck=in_deck,
    )


@router.get("", response_model=ChantList)
def list_chants(
    db: Session = Depends(get_db),
    search: str | None = Query(None, description="Substring match on incipit"),
    mode: str | None = None,
    office: str | None = Query(None, description="GregoBase office-part code"),
    tag_id: int | None = Query(None, description="Filter to chants with this tag"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
):
    stmt = select(Chant)
    if search:
        stmt = stmt.where(Chant.incipit.ilike(f"%{search}%"))
    if mode:
        stmt = stmt.where(Chant.mode == mode)
    if office:
        stmt = stmt.where(Chant.office_part == office)
    if tag_id is not None:
        stmt = stmt.where(
            Chant.id.in_(
                select(chant_tags.c.chant_id).where(chant_tags.c.tag_id == tag_id)
            )
        )

    total = db.scalar(select(func.count()).select_from(stmt.subquery())) or 0
    rows = db.scalars(
        stmt.order_by(Chant.incipit.is_(None), Chant.incipit).offset(offset).limit(limit)
    ).all()
    deck_ids = set(db.scalars(select(ReviewState.chant_id)).all())
    return ChantList(
        total=total,
        items=[_summary(c, c.id in deck_ids) for c in rows],
    )


@router.get("/{chant_id}", response_model=ChantDetail)
def get_chant(chant_id: int, db: Session = Depends(get_db)):
    c = db.get(Chant, chant_id)
    if not c:
        raise HTTPException(404, "Chant not found")
    in_deck = (
        db.scalar(
            select(ReviewState.chant_id)
            .where(ReviewState.chant_id == chant_id)
            .limit(1)
        )
        is not None
    )
    return ChantDetail(
        **_summary(c, in_deck).model_dump(),
        cantusid=c.cantusid,
        transcriber=c.transcriber,
        commentary=c.commentary or None,
        gabc=c.gabc,
    )


@router.get("/{chant_id}/audio", response_model=AudioSequence)
def get_chant_audio(chant_id: int, db: Session = Depends(get_db)):
    """Playable pitch sequence derived from the chant's gabc notation."""
    c = db.get(Chant, chant_id)
    if not c:
        raise HTTPException(404, "Chant not found")
    seq = audio.extract_sequence(c.gabc or "")
    return AudioSequence(
        **seq,
        mode=c.mode,
        finalis_pitch_class=audio.mode_finalis_pitch_class(c.mode),
    )
