# Gregorian Chant SRS Trainer — Project Spec

## Concept

A spaced-repetition learning tool for memorizing Gregorian chants, combining chant data from GregoBase with an SRS scheduling system and (in later phases) audio-based pitch scoring similar to SmartMusic's ear-training feedback.

## Target Users

Schola singers, seminarians, choir directors, and anyone learning Gregorian chant repertoire who needs structured memorization practice rather than just sheet music access.

## Core Value Proposition

No existing tool combines: chant-specific notation (square notation / neumes), spaced repetition tailored to melodic and modal memorization, and sung-audio feedback. GregoBase provides the data; this tool provides the learning loop.

## Data Source

**GregoBase** — REST API providing chant metadata (title, mode, liturgical office/feast, Gabc notation source). Gabc is the standard plaintext encoding for Gregorian chant notation.

## Feature Phases

### Phase 0 (MVP — build first, ship in days)
- Pull chants from GregoBase API, cache locally (SQLite)
- Render notation in-browser using **Exsurge.js** (parses Gabc, renders square notation)
- Basic SRS loop: show chant incipit/notation, self-report recall on a 1–5 scale, schedule next review via SM-2 algorithm (~50 lines to implement, no external library needed)
- No audio yet — proves out the core habit loop

### Phase 1 — Notation & Recall Variety
- Multiple card types: mode identification, incipit → name recognition, text cloze (missing Latin word), "sing the continuation" prompts (text-only, no audio scoring yet)
- Deck/collection management (e.g. organize by liturgical season, office, mode)

### Phase 2 — Audio Playback
- Convert Gabc → MIDI (via `gregorio` CLI: Gabc → LilyPond → MIDI) as a build/ingestion step
- Store the resulting pitch sequence alongside each chant for playback and later comparison
- Playback via **Tone.js**

### Phase 3 — Audio Scoring (SmartMusic-style feedback)
- Capture mic input via Web Audio API
- Pitch tracking: client-side WASM (e.g. pitchy/autocorrelation) for v1, or server-side **CREPE** (neural pitch tracker, Python) for better accuracy
- Align sung audio to reference pitch sequence using **Dynamic Time Warping** (DTW) — chant has no fixed tempo, so beat-grid alignment won't work
- Score based on:
  - Contour accuracy (did pitch go up/down/same correctly between notes) — easiest, most forgiving signal, good starting point
  - Interval accuracy (semitone-level correctness between successive notes)
  - Modal final resolution (did the phrase land on the correct final note for its mode)
- Explicitly out of scope / very hard to score reliably: neume ornaments (quilisma, oriscus), vocal tone quality, rhythm (chant rhythm is intentionally free — don't try to score it)

## Recommended Tech Stack

**Frontend**
- SvelteKit (lightweight, good PWA support for offline use at rehearsal)
- Exsurge.js — Gabc notation rendering
- Tone.js — audio playback/scheduling
- Web Audio API — mic capture

**Backend**
- FastAPI (Python) — API layer for chant data caching/proxying from GregoBase, and audio scoring endpoint in Phase 3
- SQLite + SQLAlchemy — chant cache, user progress, SRS state (sufficient at this scale, no need for Postgres)
- Custom SM-2 implementation for scheduling

**Audio/DSP (Phase 3)**
- CREPE (Python, neural pitch tracker) — best accuracy for solo singing voice
- librosa — onset detection, general audio analysis
- fastdtw or pyDTW — sequence alignment

**Hosting**
- Fly.io or Railway for FastAPI + SQLite
- Or fully static + serverless (Vercel for SvelteKit + a single serverless scoring function) to minimize ops

## Architecture (Phase 3, full vision)

```
GregoBase API
      ↓
  FastAPI backend  ←→  SQLite (chants, SRS state, users)
      ↓
  SvelteKit PWA
  ├── Exsurge.js (notation rendering)
  ├── Tone.js (playback)
  └── Web Audio API → pitch detector
                           ↓
                    scoring logic (client or server)
                           ↓
                    SM-2 scheduler → next review date
```

## Build Order Recommendation

1. Phase 0 MVP first — get the SRS loop shipping with no audio at all, self-reported recall only
2. Validate the core habit loop and data model before adding complexity
3. Add audio playback (Phase 2) once notation + SRS feel solid
4. Audio scoring (Phase 3) is the most technically ambitious piece — treat it as its own multi-week side project once the foundation is proven
