"""Pydantic response/request schemas."""
from datetime import datetime

from pydantic import BaseModel, Field


class ChantSummary(BaseModel):
    id: int
    incipit: str | None = None
    mode: str | None = None
    office_part: str | None = None
    office_label: str | None = None
    in_deck: bool = False


class ChantDetail(ChantSummary):
    cantusid: str | None = None
    transcriber: str | None = None
    commentary: str | None = None
    gabc: str | None = None


class ChantList(BaseModel):
    total: int
    items: list[ChantSummary]


class ReviewStateOut(BaseModel):
    chant_id: int
    card_type: str
    repetitions: int
    ease_factor: float
    interval_days: int
    due_at: datetime
    last_reviewed_at: datetime | None = None


class ClozePayload(BaseModel):
    text_tokens: list[str]
    blank_index: int
    answer: str


class ContinuationPayload(BaseModel):
    opening_gabc: str


class DueCard(BaseModel):
    card_type: str
    card_type_label: str
    chant: ChantDetail
    review: ReviewStateOut
    cloze: ClozePayload | None = None
    continuation: ContinuationPayload | None = None


class GradeIn(BaseModel):
    grade: int = Field(..., ge=0, le=5, description="SM-2 recall quality, 0..5")


class DeckAddIn(BaseModel):
    card_types: list[str] | None = Field(
        None, description="Card types to add; defaults to all applicable types"
    )


class DeckCardCount(BaseModel):
    chant_id: int
    card_types: list[str]


class DeckStats(BaseModel):
    deck_size: int
    due_now: int
    reviewed_today: int
    chants_in_deck: int
