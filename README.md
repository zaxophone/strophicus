# Gregorian Chant SRS Trainer

A spaced-repetition tool for memorizing Gregorian chant repertoire. Chant data
from [GregoBase](https://gregobase.selapa.net) (CC0), square-note notation
rendered with [Exsurge.js](https://github.com/bbloomf/exsurge), scheduling via a
custom SM-2 implementation.

This repository implements **Phase 0 (MVP)** plus part of **Phase 1** from the
project spec in [`CLAUDE.md`](./CLAUDE.md):

- **Phase 0** — browse/search ~18.7k chants, add them to a deck, self-reported
  recall loop (incipit → recall melody → reveal notation → grade 1–5 → next
  review scheduled by SM-2).
- **Phase 1 (card-type variety)** — SRS state is tracked per *card*, where a
  card is a `(chant, card_type)` pair. Three card types are generated from each
  chant's gabc:
  - **recall** — incipit → recall the melody → reveal notation.
  - **text cloze** — a Latin word is blanked in the text; recall it, then reveal.
  - **sing the continuation** — the opening notation is shown; sing/recall the
    rest, then reveal the full chant.

  (Card-type generation lives in `backend/app/cards.py`.)
- **Phase 1 (collections & deck management)** — browse the repertoire by mode,
  office, or liturgical season/feast (from the ingested GregoBase tags), and
  bulk-add an entire collection to the deck. Facets + tag filtering live in
  `backend/app/routers/collections.py`; bulk add is `POST /api/reviews/bulk-add`.

  (Remaining Phase 1 work, deselected for now: mode-identification &
  name-recognition card types.)
- **Phase 2 (audio playback)** — each chant's pitch sequence is derived from its
  gabc on demand (`backend/app/audio.py`, served at
  `GET /api/chants/{id}/audio`) and played back with Tone.js. A **Play** button
  appears wherever full notation is shown (recall/continuation reveals, and
  Browse/Collections previews).

  Playback follows **Solesmes interpretation** (Gajard, *The Solesmes Method*)
  rather than treating notes equally. `backend/app/audio.py` derives, per note, a
  duration multiplier and a dynamic-line velocity:
  - **Duration** — punctum mora (dot) doubles a note, horizontal episema broadens
    it, the note before a quilisma is lengthened, liquescents are lighter, and
    initio debilis is light.
  - **Fused repeated notes** — a bistropha, tristropha, pressus, or fusion (a run
    of repeated same-pitch notes *within one neume*, e.g. `(jjj)`, and the pressus
    in `(ghhg)`) is **held as a single sustained note** (summed duration), not
    repercussed. Re-articulation happens only when a neume boundary (space, `/`,
    `,`) starts a new neume; `!` is a binder, not a boundary.
  - **Dynamic line** — velocity follows the melody: a crescendo on ascending
    lines ("effort, increasing life"), a decrescendo on descending lines
    ("relaxation"), reset each phrase.
  - **Ictus** (vertical episema) gets a subtle accent.
  - **Phrase endings** — a ritardando ramps the last notes into each divisio
    (stronger bar → more slowing), then a breath pause proportional to bar
    strength.

  Pitch is parsed directly from gabc (clef-aware, mirroring exsurge's model)
  rather than via the gregorio→LilyPond→MIDI pipeline — instant, and it yields a
  structured note sequence ready for Phase 3 comparison. Accidentals are
  currently ignored (minor; preserves the diatonic contour).
- **Phase 3 (sung-audio scoring — v1 started)** — a "🎤 Sing this chant" panel on
  the recall card records the singer (Web Audio + `pitchy` autocorrelation,
  `lib/pitch.js`), then scores the performance against the reference pitch
  sequence (`lib/score.js`):
  - transposition-free (chant is relative-pitch): a global offset is grid-searched
    for the best alignment;
  - **DTW** aligns the sung pitch frames to the reference notes (chant tempo is
    free, so a sustained note maps many frames to one note);
  - scores **contour** (up/same/down — most forgiving, weighted highest),
    **interval** accuracy, and **modal-final resolution** — the sung final is
    scored against the chant's modal finalis (I/II→re, III/IV→mi, V/VI→fa,
    VII/VIII→sol; `backend/app/audio.py`), falling back to the reference's last
    note when the mode is unknown;
  - returns **per-interval feedback** rendered as a contour strip in the Practice
    panel (green = your direction matched the chant, red = drifted, grey = not
    heard).

  All client-side per the spec's v1 plan. The scoring core is pure and
  unit-tested on synthetic traces (perfect→100%, transposed→100%,
  time-stretched→100%, monotone→20%; correct/wrong modal final → 100%/0%). Not
  yet done: server-side CREPE for higher pitch accuracy and per-neume feedback.

## Architecture

```
GregoBase SQL dump ──(ingest.py)──▶ SQLite (chants.db)
                                         ▲
                          FastAPI backend (app/) ──REST──▶ SvelteKit PWA (frontend/)
                          · SM-2 scheduler                  └─ Exsurge.js notation
                          · chant + review endpoints
```

### Data source note

The spec assumed a GregoBase REST API, but the live site's data endpoints were
gutted by a cleanup and return empty records. Instead we ingest the canonical
CC0 dump (`gregobase_online.sql`) from the GregoBase GitHub repo. See
`backend/ingest.py` for the parser (the `gabc` column is JSON-encoded, in two
different shapes, inside a MySQL dump).

### Exsurge note

The only `exsurge` on npm is a broken 2016 build (`0.0.0`) whose minifier
tree-shakes away neume classes, breaking ~30% of chants. We vendor a freshly
built copy of the maintained `bbloomf/exsurge` fork instead — see
`frontend/src/lib/vendor/README.md`.

## Setup & run

Prerequisites: Python 3.11+, Node 18+, and `yarn`.

### 1. Backend

```bash
cd backend
python3 -m venv .venv && . .venv/bin/activate
pip install -r requirements.txt

# One-time: download the GregoBase dump and ingest into SQLite
curl -L -o data/gregobase_online.sql \
  https://raw.githubusercontent.com/gregorio-project/GregoBase/master/gregobase_online.sql
python ingest.py

# Run the API (http://127.0.0.1:8000, docs at /docs)
uvicorn app.main:app --reload
```

### 2. Frontend

```bash
cd frontend
yarn install
yarn dev          # http://localhost:5173 (proxies /api to the backend)
```

Open http://localhost:5173, go to **Browse**, add a few chants to your deck,
then switch to **Study**.

## Layout

```
backend/
  app/
    main.py         FastAPI app + CORS + lifespan
    db.py           SQLAlchemy engine/session (SQLite)
    models.py       Chant + ReviewState (SM-2 state)
    srs.py          custom SM-2 scheduler
    schemas.py      Pydantic request/response models
    constants.py    GregoBase office-part code → label map
    routers/
      chants.py     browse/search/detail
      reviews.py    deck management + due cards + grading + stats
  ingest.py         GregoBase SQL dump → SQLite
  requirements.txt
frontend/
  src/
    routes/         +layout.svelte, +page.svelte (Study + Browse UI)
    lib/
      api.js        backend client
      Notation.svelte   Exsurge rendering component
      vendor/       vendored exsurge build (+ rebuild instructions)
```

## Next phases

See `CLAUDE.md` for Phases 1–3 (card-type variety, audio playback via
Gabc→MIDI + Tone.js, and SmartMusic-style sung-audio scoring with CREPE + DTW).
