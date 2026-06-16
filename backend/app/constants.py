"""Display helpers for GregoBase coded fields and card-type definitions."""

# SRS card types. "recall" is the original Phase 0 card (incipit -> melody).
CARD_RECALL = "recall"
CARD_CLOZE = "cloze"
CARD_CONTINUATION = "continuation"

CARD_TYPES = (CARD_RECALL, CARD_CLOZE, CARD_CONTINUATION)

CARD_TYPE_LABELS = {
    CARD_RECALL: "Recall melody",
    CARD_CLOZE: "Text cloze",
    CARD_CONTINUATION: "Sing the continuation",
}



# GregoBase `office-part` codes -> human-readable labels.
OFFICE_PART_LABELS = {
    "an": "Antiphon",
    "al": "Alleluia",
    "co": "Communion",
    "gr": "Gradual",
    "hy": "Hymn",
    "im": "Improperia",
    "in": "Introit",
    "ky": "Kyriale",
    "of": "Offertory",
    "or": "Ordinary",
    "pc": "Post-Communion",
    "ps": "Psalm",
    "re": "Responsory",
    "rh": "Rhythm",
    "se": "Sequence",
    "tr": "Tract",
    "va": "Various",
}


def office_label(code: str | None) -> str | None:
    if not code:
        return None
    return OFFICE_PART_LABELS.get(code, code)
