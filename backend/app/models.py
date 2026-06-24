"""ORM models: cached chants (from GregoBase) and local SRS review state."""
from datetime import datetime, timezone

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Table,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


# GregoBase many-to-many: a chant carries liturgical/feast/office tags.
chant_tags = Table(
    "chant_tags",
    Base.metadata,
    Column("chant_id", ForeignKey("chants.id"), primary_key=True),
    Column("tag_id", ForeignKey("tags.id"), primary_key=True),
)


class Chant(Base):
    """A chant cached from the GregoBase dump.

    Field names mirror the GregoBase schema where practical so the ingestion
    step is a straight mapping.
    """

    __tablename__ = "chants"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)  # GregoBase id
    cantusid: Mapped[str | None] = mapped_column(String, nullable=True)
    incipit: Mapped[str | None] = mapped_column(String, index=True, nullable=True)
    initial: Mapped[str | None] = mapped_column(String, nullable=True)
    office_part: Mapped[str | None] = mapped_column(String, index=True, nullable=True)
    mode: Mapped[str | None] = mapped_column(String, index=True, nullable=True)
    mode_var: Mapped[str | None] = mapped_column(String, nullable=True)
    transcriber: Mapped[str | None] = mapped_column(String, nullable=True)
    commentary: Mapped[str | None] = mapped_column(Text, nullable=True)
    gabc: Mapped[str | None] = mapped_column(Text, nullable=True)
    copyrighted: Mapped[bool] = mapped_column(Boolean, default=False)

    reviews: Mapped[list["ReviewState"]] = relationship(
        back_populates="chant", cascade="all, delete-orphan"
    )
    tags: Mapped[list["Tag"]] = relationship(
        secondary=chant_tags, back_populates="chants"
    )


class Tag(Base):
    """A GregoBase tag (liturgical season, feast, office, ordinary setting, …)."""

    __tablename__ = "tags"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String, index=True)

    chants: Mapped[list[Chant]] = relationship(
        secondary=chant_tags, back_populates="tags"
    )


class ReviewState(Base):
    """SM-2 scheduling state for a single card.

    A card is a (chant, card_type) pair, so one chant can carry several
    independently-scheduled cards (recall, cloze, continuation, ...).
    """

    __tablename__ = "review_states"

    chant_id: Mapped[int] = mapped_column(
        ForeignKey("chants.id"), primary_key=True
    )
    card_type: Mapped[str] = mapped_column(String, primary_key=True)
    # SM-2 parameters
    repetitions: Mapped[int] = mapped_column(Integer, default=0)
    ease_factor: Mapped[float] = mapped_column(Float, default=2.5)
    interval_days: Mapped[int] = mapped_column(Integer, default=0)

    due_at: Mapped[datetime] = mapped_column(DateTime, default=_utcnow, index=True)
    last_reviewed_at: Mapped[datetime | None] = mapped_column(
        DateTime, nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_utcnow)

    chant: Mapped[Chant] = relationship(back_populates="reviews")
