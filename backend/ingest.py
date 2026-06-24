"""Ingest the GregoBase SQL dump into our local SQLite cache.

GregoBase has no usable public REST API (the live download endpoints were
gutted by a data cleanup), so we use the canonical CC0 dump committed to the
project's GitHub repo: gregobase_online.sql

The dump is a MySQL-style dump. We parse the `gregobase_chants` INSERT tuples
ourselves (no MySQL server needed). The `gabc` column is stored as JSON in one
of two shapes:

  1. a plain JSON string:        "(c4) AL(dc~)le(...) (::)"
  2. a JSON array of entries:    [["tex","\\grechangedim..."],["gabc","(c4)...",{}]]

We extract the gabc notation body from either shape.

Usage:
    python ingest.py [path/to/gregobase_online.sql]
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

from app.db import DATA_DIR, SessionLocal, engine, init_db
from app.models import Chant, Tag, chant_tags

DEFAULT_DUMP = DATA_DIR / "gregobase_online.sql"

# MySQL single-quoted-string escape sequences.
_SQL_ESCAPES = {
    "0": "\0", "b": "\b", "n": "\n", "r": "\r", "t": "\t",
    "Z": "\x1a", "\\": "\\", "'": "'", '"': '"',
}

# Column order in the dump's INSERT statement.
_COLS = [
    "id", "cantusid", "version", "incipit", "initial", "office-part",
    "mode", "mode_var", "transcriber", "commentary", "headers", "gabc",
    "gabc_verses", "tex_verses", "remarks", "copyrighted", "duplicateof",
]
_COL_IDX = {name: i for i, name in enumerate(_COLS)}

# Pulls the gabc entry out of the JSON-array shape, tolerating the tex entry
# (whose TeX backslashes are invalid JSON escapes, so we never json.loads it whole).
_GABC_ENTRY_RE = re.compile(r'"gabc"\s*,\s*"(.*?)"\s*,\s*\{', re.DOTALL)


def sql_unescape(s: str) -> str:
    """Reverse MySQL single-quoted-string escaping."""
    out: list[str] = []
    i, n = 0, len(s)
    while i < n:
        c = s[i]
        if c == "\\" and i + 1 < n:
            out.append(_SQL_ESCAPES.get(s[i + 1], s[i + 1]))
            i += 2
        else:
            out.append(c)
            i += 1
    return "".join(out)


def parse_tuples(values: str):
    """Yield field lists for each `( ... )` tuple in an INSERT VALUES section.

    Respects single-quoted strings (with backslash escapes). Non-string tokens
    (numbers, NULL) are returned verbatim and trimmed.
    """
    i, n = 0, len(values)
    while i < n:
        while i < n and values[i] in " \r\n\t,":
            i += 1
        if i >= n or values[i] != "(":
            break
        i += 1
        fields: list[str] = []
        cur: list[str] = []
        in_str = False
        is_str_field = False
        while i < n:
            c = values[i]
            if in_str:
                if c == "\\":
                    cur.append(values[i:i + 2])
                    i += 2
                    continue
                if c == "'":
                    in_str = False
                    i += 1
                    continue
                cur.append(c)
                i += 1
                continue
            if c == "'":
                in_str = True
                is_str_field = True
                i += 1
                continue
            if c == ",":
                fields.append(("S" if is_str_field else "R") + "".join(cur))
                cur = []
                is_str_field = False
                i += 1
                continue
            if c == ")":
                fields.append(("S" if is_str_field else "R") + "".join(cur))
                i += 1
                break
            if c in " \r\n\t":
                i += 1
                continue
            cur.append(c)
            i += 1
        yield fields


def _decode_str(tagged: str) -> str | None:
    """A field is prefixed with 'S' (was quoted) or 'R' (raw, e.g. NULL/number)."""
    kind, val = tagged[0], tagged[1:]
    if kind == "R":
        return None if val == "NULL" else val
    return sql_unescape(val)


def _json_unescape_body(body: str) -> str:
    """Decode JSON-level escapes (e.g. \\u00fa) in an extracted gabc body."""
    try:
        return json.loads('"' + body + '"')
    except json.JSONDecodeError:
        # Tolerate stray backslashes that aren't valid JSON escapes.
        return re.sub(
            r"\\u([0-9a-fA-F]{4})",
            lambda m: chr(int(m.group(1), 16)),
            body,
        )


def extract_gabc(col_value: str | None) -> str | None:
    """Extract the gabc notation body from the dump's `gabc` column value."""
    if not col_value:
        return None
    v = col_value.lstrip()
    if v.startswith("["):
        m = _GABC_ENTRY_RE.search(v)
        return _json_unescape_body(m.group(1)) if m else None
    if v.startswith('"'):
        try:
            return json.loads(v)
        except json.JSONDecodeError:
            return _json_unescape_body(v.strip('"'))
    return None


def iter_value_blocks(text: str, table: str):
    """Yield the VALUES section text for each INSERT into `table`."""
    for m in re.finditer(rf"INSERT INTO `{table}`[^V]*VALUES", text):
        start = m.end()
        end = text.find("\nINSERT INTO", start)
        if end == -1:
            end = len(text)
        yield text[start:end].rstrip().rstrip(";")


def iter_chant_blocks(text: str):
    yield from iter_value_blocks(text, "gregobase_chants")


def ingest_tags(text: str, session) -> dict:
    """Load gregobase_tags and gregobase_chant_tags."""
    session.execute(chant_tags.delete())
    session.query(Tag).delete()
    session.commit()

    tags = 0
    for block in iter_value_blocks(text, "gregobase_tags"):
        objs = []
        for fields in parse_tuples(block):
            if len(fields) < 2:
                continue
            tid = _decode_str(fields[0])
            name = _decode_str(fields[1])
            if tid is None or name is None:
                continue
            objs.append(Tag(id=int(tid), name=name.strip()))
        session.bulk_save_objects(objs)
        tags += len(objs)
    session.commit()

    valid_tags = {t for (t,) in session.query(Tag.id).all()}
    valid_chants = {c for (c,) in session.query(Chant.id).all()}
    links = 0
    rows: list[dict] = []
    for block in iter_value_blocks(text, "gregobase_chant_tags"):
        for fields in parse_tuples(block):
            if len(fields) < 2:
                continue
            cid = _decode_str(fields[0])
            tid = _decode_str(fields[1])
            if cid is None or tid is None:
                continue
            cid, tid = int(cid), int(tid)
            # Skip links whose endpoints we didn't keep (e.g. chants without gabc).
            if cid in valid_chants and tid in valid_tags:
                rows.append({"chant_id": cid, "tag_id": tid})
            if len(rows) >= 5000:
                session.execute(chant_tags.insert(), rows)
                links += len(rows)
                rows.clear()
    if rows:
        session.execute(chant_tags.insert(), rows)
        links += len(rows)
    session.commit()
    return {"tags": tags, "links": links}


def ingest(dump_path: Path) -> dict:
    text = dump_path.read_text(encoding="utf-8", newline="")

    init_db()
    session = SessionLocal()
    # Fresh ingest: clear existing cached chants (review state cascades).
    session.query(Chant).delete()
    session.commit()

    total = inserted = skipped_no_gabc = 0
    batch: list[Chant] = []
    for block in iter_chant_blocks(text):
        for fields in parse_tuples(block):
            if len(fields) < len(_COLS):
                continue
            total += 1
            get = lambda name: _decode_str(fields[_COL_IDX[name]])
            gabc = extract_gabc(get("gabc"))
            if not gabc or "(" not in gabc:
                skipped_no_gabc += 1
                continue
            cid = get("id")
            batch.append(
                Chant(
                    id=int(cid),
                    cantusid=get("cantusid"),
                    incipit=get("incipit"),
                    initial=get("initial"),
                    office_part=get("office-part"),
                    mode=get("mode"),
                    mode_var=get("mode_var"),
                    transcriber=get("transcriber"),
                    commentary=get("commentary"),
                    gabc=gabc,
                    copyrighted=(get("copyrighted") == "1"),
                )
            )
            inserted += 1
            if len(batch) >= 2000:
                session.bulk_save_objects(batch)
                session.commit()
                batch.clear()
    if batch:
        session.bulk_save_objects(batch)
        session.commit()

    tag_stats = ingest_tags(text, session)
    session.close()
    return {
        "parsed": total,
        "inserted": inserted,
        "skipped_no_gabc": skipped_no_gabc,
        **tag_stats,
    }


if __name__ == "__main__":
    path = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_DUMP
    if not path.exists():
        sys.exit(f"Dump not found: {path}\nDownload gregobase_online.sql first.")
    print(f"Ingesting {path} ...")
    stats = ingest(path)
    print(f"Done. Parsed {stats['parsed']} rows, "
          f"inserted {stats['inserted']} chants, "
          f"skipped {stats['skipped_no_gabc']} without gabc.")
    print(f"Tags: {stats['tags']} tags, {stats['links']} chant-tag links.")
    print(f"SQLite cache: {engine.url}")
