"""Collection facets: browse the repertoire by mode, office, or liturgical tag."""
from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.constants import office_label
from app.db import get_db
from app.models import Chant, Tag, chant_tags
from app.schemas import Collections, Facet, TagFacet

router = APIRouter(prefix="/api/collections", tags=["collections"])


@router.get("", response_model=Collections)
def list_collections(db: Session = Depends(get_db)):
    mode_rows = db.execute(
        select(Chant.mode, func.count())
        .where(Chant.mode.isnot(None), Chant.mode != "")
        .group_by(Chant.mode)
        .order_by(func.count().desc())
    ).all()
    modes = [
        Facet(key=m, label=f"Mode {m}", count=n)
        for m, n in mode_rows
    ]

    office_rows = db.execute(
        select(Chant.office_part, func.count())
        .where(Chant.office_part.isnot(None), Chant.office_part != "")
        .group_by(Chant.office_part)
        .order_by(func.count().desc())
    ).all()
    offices = [
        Facet(key=o, label=office_label(o), count=n) for o, n in office_rows
    ]

    tag_rows = db.execute(
        select(Tag.id, Tag.name, func.count(chant_tags.c.chant_id))
        .join(chant_tags, Tag.id == chant_tags.c.tag_id)
        .group_by(Tag.id)
        .order_by(func.count(chant_tags.c.chant_id).desc())
    ).all()
    tags = [TagFacet(id=tid, label=name, count=n) for tid, name, n in tag_rows]

    return Collections(modes=modes, offices=offices, tags=tags)
