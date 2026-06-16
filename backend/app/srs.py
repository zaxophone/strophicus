"""Custom SM-2 spaced-repetition scheduler.

Implements the classic SuperMemo-2 algorithm. The caller passes the current
SM-2 state plus a recall quality grade in 0..5 and gets back the updated state.

Grade convention (self-report):
    5 - perfect recall
    4 - correct, after hesitation
    3 - correct, with serious difficulty
    2 - incorrect; remembered once shown
    1 - incorrect; familiar
    0 - total blackout

Grades < 3 reset the repetition streak (the card is "lapsed").
"""
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone

MIN_EASE_FACTOR = 1.3


@dataclass
class SrsState:
    repetitions: int
    ease_factor: float
    interval_days: int


def review(state: SrsState, grade: int, now: datetime | None = None) -> tuple[SrsState, datetime]:
    """Apply one SM-2 review and return (new_state, next_due_datetime)."""
    if not 0 <= grade <= 5:
        raise ValueError("grade must be in 0..5")
    now = now or datetime.now(timezone.utc)

    if grade < 3:
        # Lapse: restart the learning steps but keep (reduced) ease factor.
        repetitions = 0
        interval = 1
    else:
        repetitions = state.repetitions + 1
        if repetitions == 1:
            interval = 1
        elif repetitions == 2:
            interval = 6
        else:
            interval = round(state.interval_days * state.ease_factor)

    # Update ease factor (SM-2 formula), floored at 1.3.
    ease = state.ease_factor + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02))
    ease = max(MIN_EASE_FACTOR, ease)

    new_state = SrsState(
        repetitions=repetitions,
        ease_factor=round(ease, 4),
        interval_days=interval,
    )
    next_due = now + timedelta(days=interval)
    return new_state, next_due
