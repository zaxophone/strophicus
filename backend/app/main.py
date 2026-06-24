"""FastAPI application entrypoint for the Gregorian Chant SRS Trainer."""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.db import init_db
from app.routers import chants, collections, reviews


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(
    title="Gregorian Chant SRS Trainer",
    description="Phase 0 MVP: GregoBase chant cache + SM-2 spaced repetition.",
    version="0.1.0",
    lifespan=lifespan,
)

# Dev CORS: SvelteKit dev server runs on a different port.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chants.router)
app.include_router(collections.router)
app.include_router(reviews.router)


@app.get("/api/health")
def health():
    return {"status": "ok"}
