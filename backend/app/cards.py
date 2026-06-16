"""Card content generation from a chant's gabc source.

Phase 1 card types beyond plain recall:

- cloze: extract the Latin text, blank out one content word, ask the learner to
  recall it.
- continuation: split the notation at the first musical phrase boundary; show
  the opening and ask the learner to sing/recall the rest.

These derive everything from the stored gabc, so no extra ingestion is needed.
"""
from __future__ import annotations

import re

from app.constants import CARD_CLOZE, CARD_CONTINUATION, CARD_RECALL

# A gabc body is a sequence of `syllable(notation)` pairs, e.g. "DE(g)us(gd)".
_NOTATION_GROUP = re.compile(r"\([^)]*\)")
_MARKUP_TAG = re.compile(r"<[^>]+>")
_LEADING_CLEF = re.compile(r"^\s*\([^)]*\)")
# Word must have at least this many alphabetic characters to be a cloze answer.
_MIN_CLOZE_LEN = 4
_ALPHA = re.compile(r"[^A-Za-zÀ-ÿ]")

# Phrase-ending bars, strongest first. We split continuation cards on these.
_BAR_PATTERNS = (r"\(::\)", r"\(:\)", r"\(;\)")


def gabc_text(gabc: str) -> str:
    """Extract the readable Latin text (lyrics) from a gabc body."""
    body = _LEADING_CLEF.sub("", gabc)
    text = _NOTATION_GROUP.sub("", body)
    text = _MARKUP_TAG.sub("", text)
    for ch in "{}*+":
        text = text.replace(ch, "")
    return re.sub(r"\s+", " ", text).strip()


def make_cloze(chant_id: int, gabc: str) -> dict | None:
    """Pick one content word to blank out. Deterministic per chant id."""
    tokens = gabc_text(gabc).split()
    candidates = [
        i for i, t in enumerate(tokens) if len(_ALPHA.sub("", t)) >= _MIN_CLOZE_LEN
    ]
    if not candidates:
        return None
    blank_index = candidates[chant_id % len(candidates)]
    return {
        "text_tokens": tokens,
        "blank_index": blank_index,
        "answer": tokens[blank_index],
    }


def make_continuation(gabc: str) -> dict | None:
    """Split the gabc into an opening and the rest at a phrase boundary."""
    n = len(gabc)
    for pattern in _BAR_PATTERNS:
        for m in re.finditer(pattern, gabc):
            # Want a meaningful opening that isn't almost the whole chant.
            if 0.15 * n < m.end() < 0.9 * n:
                return {"opening_gabc": gabc[: m.end()]}
    return None


def build_card_payload(chant_id: int, gabc: str, card_type: str) -> dict | None:
    """Return the type-specific payload for a card, or None if not applicable."""
    if card_type == CARD_RECALL:
        return {}
    if card_type == CARD_CLOZE:
        return make_cloze(chant_id, gabc)
    if card_type == CARD_CONTINUATION:
        return make_continuation(gabc)
    return None


def applicable_card_types(chant_id: int, gabc: str) -> list[str]:
    """Which card types can be generated for this chant."""
    types = [CARD_RECALL]
    if make_cloze(chant_id, gabc):
        types.append(CARD_CLOZE)
    if make_continuation(gabc):
        types.append(CARD_CONTINUATION)
    return types
