"""LRU en proceso (AD-07). N workers = N caches; no hay Redis en v1."""

from __future__ import annotations

from collections import OrderedDict
from threading import Lock
from typing import Any, Hashable


class LRUCache:
    def __init__(self, maxsize: int = 64) -> None:
        self.maxsize = maxsize
        self._data: OrderedDict[Hashable, Any] = OrderedDict()
        self._lock = Lock()
        self.hits = 0
        self.misses = 0

    def get(self, key: Hashable) -> Any | None:
        with self._lock:
            if key not in self._data:
                self.misses += 1
                return None
            self._data.move_to_end(key)
            self.hits += 1
            return self._data[key]

    def set(self, key: Hashable, value: Any) -> None:
        with self._lock:
            if key in self._data:
                self._data.move_to_end(key)
            self._data[key] = value
            while len(self._data) > self.maxsize:
                self._data.popitem(last=False)

    def __len__(self) -> int:
        with self._lock:
            return len(self._data)


def transit_cache_key(
    natal_planets: list[dict],
    start_date: str,
    end_date: str,
    lat: float,
    lon: float,
) -> tuple:
    rounded = tuple(
        sorted((str(p.get("name", "")), round(float(p.get("longitude", 0.0)), 2)) for p in natal_planets)
    )
    return (rounded, start_date, end_date, round(lat, 2), round(lon, 2))


transit_lru = LRUCache(maxsize=64)
