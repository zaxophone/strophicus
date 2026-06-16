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

  (Card-type generation lives in `backend/app/cards.py`. Remaining Phase 1 work:
  mode-identification & name-recognition cards, and collections by liturgical
  season/feast — which needs ingesting the GregoBase tags tables.)

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
