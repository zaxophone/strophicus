"""Extract a playable pitch sequence from gabc notation.

Gabc encodes pitch directly: each note is a letter whose vertical staff
position, combined with the active clef, determines the pitch. We reproduce the
pitch model used by exsurge (the renderer), so audio matches the notation:

    staff position of a note letter = ord(letter) - ord('c')
    a `cN` (do) clef sits at staff position 2N-1, octave 2; `fN` (fa) clef the
    same but shifted +3 diatonic steps.
    diatonic offset -> semitone via [Do,Re,Mi,Fa,So,La,Ti] = [0,2,4,5,7,9,11]
    pitch integer = (octave + offset//7) * 12 + step

The integer is clef-relative (chant has no fixed concert pitch); we add a base
so a do-clef "do" lands on C4 (MIDI 60), giving a comfortable singing range.

Accidentals (flat/natural) are currently ignored — a minor inaccuracy that
mostly affects a flatted ti; the diatonic contour is preserved.
"""
from __future__ import annotations

import re

# diatonic offset (0..6) -> semitone within an octave
_STEP = [0, 2, 4, 5, 7, 9, 11]
# Map exsurge's clef-relative pitch integer onto MIDI (do-clef "do" -> C4=60).
_MIDI_BASE = 48

# The finalis (modal final note) per church mode, as a pitch CLASS in our
# representation where do = C = 0. Authentic/plagal pairs share a finalis:
#   I/II Dorian -> re (D=2), III/IV Phrygian -> mi (E=4),
#   V/VI Lydian -> fa (F=5), VII/VIII Mixolydian -> sol (G=7).
_MODE_FINALIS = {
    "1": 2, "2": 2, "3": 4, "4": 4,
    "5": 5, "6": 5, "7": 7, "8": 7,
}


def mode_finalis_pitch_class(mode: str | None) -> int | None:
    """Expected finalis pitch class (0..11, do=0) for a numeric church mode."""
    if not mode:
        return None
    # tolerate trailing punctuation/variants like "8." or "1*"
    key = mode.strip().rstrip(".*").strip()
    return _MODE_FINALIS.get(key)

_CLEF_RE = re.compile(r"^\s*([cf])b?([1-4])\s*$")
# Non-pitch directives that can contain stray letters; strip before scanning.
_DIRECTIVE_RE = re.compile(r"\[[^\]]*\]|\{[^}]*\}|<[^>]*>")
# Bars (divisiones), strongest first -> rest strength for playback pauses.
_BARS = {"::": 4, ":": 3, ";": 2, ",": 1}

# A pitch is a letter a-m (lowercase) or A-M (uppercase = punctum inclinatum).
_PITCH = set("abcdefghijklmABCDEFGHIJKLM")

# Solesmes duration multipliers applied to the basic (equal) note value.
_DOT_FACTOR = 2.0        # punctum mora: a dot doubles the note
_EPISEMA_FACTOR = 1.5    # horizontal episema: expressive broadening
_LIQUESCENT_FACTOR = 0.7 # liquescent: lighter, slightly quicker
_INITIO_DEBILIS_FACTOR = 0.8
_QUILISMA_PREP_FACTOR = 1.8  # the note BEFORE a quilisma is lengthened

# Neume-boundary characters inside a gabc group. A repeated pitch is only
# re-articulated when one of these separates it from the previous note; without
# one (or bound by "!"), repeated same-pitch notes — bistropha, tristropha,
# pressus, fusions — are held as a single sustained note, not repercussed.
_NEUME_BOUNDARY = set(" /,")

# Dynamic line (Gajard): a melodic ascent is sung with a crescendo ("effort,
# increasing life"), a descent with a decrescendo ("relaxation"). We render this
# as a per-note velocity that rises and falls with the melodic contour.
_VEL_BASE = 0.70
_VEL_MIN = 0.52
_VEL_MAX = 1.0
_VEL_UP = 0.07     # crescendo per ascending step
_VEL_DOWN = 0.05   # decrescendo per descending step
_VEL_DECAY = 0.02  # drift back toward base on repeated/level notes
_VEL_ICTUS = 0.10  # ictus (vertical episema) adds a touch of stress

# Phrase-end ritardando: notes leading into a divisio slow down, more so before
# a stronger bar. Multipliers for the last notes before a bar, by bar strength.
_RITARD = {
    1: [1.15],
    2: [1.1, 1.25],
    3: [1.12, 1.3],
    4: [1.1, 1.2, 1.4],
}


def _note_solesmes(mods: str, initio_debilis: bool) -> tuple[float, bool, bool]:
    """From a note's trailing modifier chars, return (duration, stress, quilisma)."""
    duration = 1.0
    dots = mods.count(".")
    if dots:
        duration *= 1.0 + dots  # one dot -> x2, two dots -> x3
    if "_" in mods:
        duration *= _EPISEMA_FACTOR
    if any(c in mods for c in "~<>"):
        duration *= _LIQUESCENT_FACTOR
    if initio_debilis:
        duration *= _INITIO_DEBILIS_FACTOR
    quilisma = "w" in mods or "W" in mods
    stress = "'" in mods  # ictus (vertical episema): a rhythmic touch
    return duration, stress, quilisma


def _clef_params(token: str) -> tuple[str, int, int]:
    """(type, staffPosition, octave) for a clef token like 'c4' or 'f3'."""
    m = _CLEF_RE.match(token)
    kind, n = m.group(1), int(m.group(2))
    return kind, 2 * n - 1, 2


def _staffpos_to_int(staffpos: int, clef: tuple[str, int, int]) -> int:
    kind, clef_pos, octave = clef
    offset = staffpos - clef_pos + (3 if kind == "f" else 0)
    octave_offset = offset // 7  # floor division (handles negatives)
    o = offset
    while o < 0:
        o += 7
    step = _STEP[o % 7]
    return (octave + octave_offset) * 12 + step


def _note_midi(letter: str, clef: tuple[str, int, int]) -> int:
    staffpos = ord(letter.lower()) - ord("c")
    return _staffpos_to_int(staffpos, clef) + _MIDI_BASE


def _last_note(events: list[dict]) -> dict | None:
    for e in reversed(events):
        if e["type"] == "note":
            return e
        if e["type"] == "bar":
            return None
    return None


def _tokenize_notes(cleaned: str, clef, events: list[dict], group: int) -> None:
    """Parse the notes in one gabc group, applying Solesmes durations in place.

    Each note is tagged with its `group` index so strophic detection can be
    confined to repeated notes within a single neume (a true strophicus), rather
    than unisons that merely span a syllable boundary.
    """
    i, n = 0, len(cleaned)
    initio_debilis = False
    boundary_pending = True  # the first note of a group always starts a neume
    while i < n:
        ch = cleaned[i]
        if ch == "-":  # initio debilis prefix applies to the next note
            initio_debilis = True
            i += 1
            continue
        if ch in _PITCH:
            letter = ch
            i += 1
            start = i
            # consume this note's trailing modifiers up to the next pitch/prefix
            while i < n and cleaned[i] not in _PITCH and cleaned[i] != "-":
                i += 1
            mods = cleaned[start:i]
            duration, stress, quilisma = _note_solesmes(mods, initio_debilis)
            initio_debilis = False
            # Solesmes: the note immediately before a quilisma is lengthened.
            if quilisma:
                prev = _last_note(events)
                if prev is not None:
                    prev["duration"] = round(prev["duration"] * _QUILISMA_PREP_FACTOR, 3)
            note = {
                "type": "note",
                "midi": _note_midi(letter, clef),
                "duration": round(duration, 3),
                "_g": group,
                "_nb": boundary_pending,
            }
            if stress:
                note["stress"] = True
            events.append(note)
            # a separator in this note's trailing chars opens a new neume
            boundary_pending = any(c in _NEUME_BOUNDARY for c in mods)
        else:
            i += 1


def _raw_events(gabc: str) -> list[dict]:
    """Tokenize gabc into per-glyph note/bar events (before fusion/expression).

    One note event per gabc pitch, so the note order is 1:1 with the note
    glyphs Exsurge renders — which lets per-note scoring colour the notation.
    """
    groups = re.findall(r"\(([^)]*)\)", gabc or "")
    clef: tuple[str, int, int] = ("c", 7, 2)  # default c4
    events: list[dict] = []
    for gi, raw in enumerate(groups):
        token = raw.strip()
        if _CLEF_RE.match(token):
            clef = _clef_params(token)
            continue
        cleaned = _DIRECTIVE_RE.sub("", raw)
        _tokenize_notes(cleaned, clef, events, gi)
        # Bars are usually their own group.
        for bar, strength in _BARS.items():
            if bar in cleaned:
                events.append({"type": "bar", "strength": strength})
                break
    return events


def extract_events(gabc: str) -> list[dict]:
    """Playback events: per-note Solesmes durations, fusion, and expression.

    Notes: {"type":"note","midi":N,"duration":mult,"velocity":v,
            (optional)"stress","fused"}
    Bars:  {"type":"bar","strength":S}  -> a breath pause in playback.
    """
    events = _raw_events(gabc)
    _apply_fusion(events)
    _apply_dynamic_line(events)
    _apply_phrase_ritardando(events)
    # round durations once, at the end (after all multiplicative passes), and
    # drop the internal tags.
    for e in events:
        if e["type"] == "note":
            e["duration"] = round(e["duration"], 3)
            e["velocity"] = round(e["velocity"], 3)
            e.pop("_g", None)
            e.pop("_nb", None)
    return events


def _apply_fusion(events: list[dict]) -> None:
    """Fuse repeated same-pitch notes within a neume into one held note.

    A bistropha, tristropha, pressus, or fusion is NOT repercussed: consecutive
    notes of the same pitch in the same neume (no boundary separator between
    them) are merged into a single sustained note whose duration is the sum.
    Re-articulation happens only when a new neume starts (the note carries a
    neume boundary, `_nb`).
    """
    out: list[dict] = []
    for e in events:
        prev = out[-1] if out else None
        if (
            e["type"] == "note"
            and prev is not None
            and prev.get("type") == "note"
            and prev["midi"] == e["midi"]
            and prev.get("_g") == e.get("_g")
            and not e.get("_nb")
        ):
            prev["duration"] += e["duration"]
            prev["fused"] = True
            if e.get("stress"):
                prev["stress"] = True
        else:
            out.append(e)
    events[:] = out


def _apply_dynamic_line(events: list[dict]) -> None:
    """Per-note velocity following the melodic contour (crescendo up / dim down).

    Intensity resets toward the base at each phrase (bar) and tracks the rise and
    fall of the line, so ascending passages gain energy and descents relax.
    """
    intensity = _VEL_BASE
    prev_midi = None
    for e in events:
        if e["type"] == "bar":
            intensity = _VEL_BASE
            prev_midi = None
            continue
        if e["type"] != "note":
            continue
        if prev_midi is None:
            intensity = _VEL_BASE
        elif e["midi"] > prev_midi:
            intensity += _VEL_UP
        elif e["midi"] < prev_midi:
            intensity -= _VEL_DOWN
        else:
            # repeated pitch (incl. strophae): drift gently back toward base
            intensity += (_VEL_BASE - intensity) * 0.5 + _VEL_DECAY
        intensity = max(_VEL_MIN, min(_VEL_MAX, intensity))
        vel = intensity + (_VEL_ICTUS if e.get("stress") else 0.0)
        e["velocity"] = max(_VEL_MIN, min(_VEL_MAX, vel))
        prev_midi = e["midi"]


def _apply_phrase_ritardando(events: list[dict]) -> None:
    """Slow into each divisio: lengthen the last few notes before a bar, more so
    before a stronger bar (Gajard: the melody 'moves gradually more slowly... and
    pauses for a last time before coming to rest')."""
    for idx, e in enumerate(events):
        if e["type"] != "bar":
            continue
        ramp = _RITARD.get(e["strength"], [])
        # collect the preceding note events (skip any non-notes)
        notes_before = []
        k = idx - 1
        while k >= 0 and len(notes_before) < len(ramp):
            if events[k]["type"] == "note":
                notes_before.append(events[k])
            elif events[k]["type"] == "bar":
                break
            k -= 1
        # ramp[-1] is the closest to the bar (largest); apply outward
        for note, factor in zip(notes_before, reversed(ramp)):
            note["duration"] *= factor


def extract_sequence(gabc: str) -> dict:
    """Full payload.

    - `events`: fused, expressive events for playback.
    - `notes`: the per-glyph pitch list (un-fused), 1:1 with Exsurge's rendered
      note glyphs — used for scoring and for colouring the notation per note.
    """
    events = extract_events(gabc)
    notes = [e["midi"] for e in _raw_events(gabc) if e["type"] == "note"]
    return {
        "events": events,
        "notes": notes,
        "note_count": len(notes),
        "low": min(notes) if notes else None,
        "high": max(notes) if notes else None,
    }
