"""Índice en memoria de GeoNames cities5000 (AD-06)."""

from __future__ import annotations

import gzip
import logging
import os
import unicodedata
from functools import lru_cache
from typing import Any

logger = logging.getLogger(__name__)

_DEFAULT_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "places.tsv.gz")

# TSV: id \t name \t ascii \t alts \t admin1 \t cc \t country_es \t country_en \t lat \t lon \t tz \t pop
# alts: pipe-separated latin/ascii alternates


def normalize(text: str) -> str:
    decomposed = unicodedata.normalize("NFKD", text or "")
    stripped = "".join(c for c in decomposed if not unicodedata.combining(c))
    return stripped.lower().strip()


def _is_latin(token: str) -> bool:
    if not token:
        return False
    for ch in token:
        if ch.isalpha() and unicodedata.name(ch, "").startswith("GREEK"):
            return False
        if ch.isalpha() and "CYRILLIC" in unicodedata.name(ch, ""):
            return False
        if ch.isalpha() and "ARABIC" in unicodedata.name(ch, ""):
            return False
        if ch.isalpha() and "CJK" in unicodedata.name(ch, ""):
            return False
        if ch.isalpha() and "HANGUL" in unicodedata.name(ch, ""):
            return False
        if ch.isalpha() and "HIRAGANA" in unicodedata.name(ch, ""):
            return False
        if ch.isalpha() and "KATAKANA" in unicodedata.name(ch, ""):
            return False
    return True


class PlaceIndex:
    def __init__(self, path: str | None = None) -> None:
        self.path = os.path.abspath(path or os.environ.get("PLACES_PATH") or _DEFAULT_PATH)
        self.rows: list[dict[str, Any]] = []
        self._prefix: dict[str, list[int]] = {}
        self._loaded = False

    def load(self) -> None:
        if self._loaded:
            return
        if not os.path.isfile(self.path):
            logger.warning("places file missing: %s", self.path)
            self._loaded = True
            return
        opener = gzip.open if self.path.endswith(".gz") else open
        with opener(self.path, "rt", encoding="utf-8") as fh:
            for line in fh:
                line = line.rstrip("\n")
                if not line or line.startswith("#"):
                    continue
                parts = line.split("\t")
                if len(parts) < 12:
                    continue
                try:
                    row = {
                        "id": parts[0],
                        "name": parts[1],
                        "ascii": parts[2],
                        "alts": [a for a in parts[3].split("|") if a],
                        "admin1": parts[4],
                        "country_code": parts[5].lower(),
                        "country_es": parts[6],
                        "country_en": parts[7],
                        "lat": float(parts[8]),
                        "lon": float(parts[9]),
                        "tz": parts[10],
                        "population": int(parts[11] or "0"),
                    }
                except (ValueError, IndexError):
                    continue
                idx = len(self.rows)
                self.rows.append(row)
                names = {row["name"], row["ascii"], *row["alts"]}
                for raw in names:
                    key = normalize(raw)
                    if len(key) < 2:
                        continue
                    # index by first 2 chars for prefix scan
                    bucket = key[:2]
                    self._prefix.setdefault(bucket, []).append(idx)
        self._loaded = True
        logger.info("places loaded n=%s path=%s", len(self.rows), self.path)

    def search(self, q: str, lang: str = "es", limit: int = 8) -> list[dict[str, Any]]:
        self.load()
        query = normalize(q)
        if len(query) < 2:
            return []
        limit = max(1, min(int(limit), 15))
        candidates: dict[int, str] = {}
        bucket = self._prefix.get(query[:2], [])
        for idx in bucket:
            row = self.rows[idx]
            names = [row["name"], row["ascii"], *row["alts"]]
            best = None
            for raw in names:
                n = normalize(raw)
                if n == query:
                    best = "exact"
                    break
                if n.startswith(query):
                    best = best or "prefix"
            if best:
                candidates[idx] = best

        def rank(item: tuple[int, str]) -> tuple:
            idx, kind = item
            row = self.rows[idx]
            kind_rank = 0 if kind == "exact" else 1
            return (kind_rank, -row["population"], row["name"])

        ranked = sorted(candidates.items(), key=rank)
        out: list[dict[str, Any]] = []
        for idx, _kind in ranked[:limit]:
            row = self.rows[idx]
            country_name = row["country_es"] if lang != "en" else row["country_en"]
            out.append({
                "id": row["id"],
                "name": row["name"],
                "admin1": row["admin1"],
                "country_code": row["country_code"],
                "country_name": country_name,
                "lat": row["lat"],
                "lon": row["lon"],
                "tz": row["tz"],
                "population": row["population"],
            })
        return out


_INDEX: PlaceIndex | None = None


def get_index() -> PlaceIndex:
    global _INDEX
    if _INDEX is None:
        _INDEX = PlaceIndex()
    return _INDEX


@lru_cache(maxsize=1)
def latin_ok() -> bool:
    return True
