"""Descarga sepl_18.se1 / semo_18.se1 / seas_18.se1 y verifica SHA-256 (Anexo C).

Uso:
  python scripts/fetch_ephe.py
  EPHE_PATH=/tmp/ephe python scripts/fetch_ephe.py
"""

from __future__ import annotations

import hashlib
import os
import sys
import urllib.request

FILES = {
    "sepl_18.se1": {
        "sha256": "ca1393ceab3a44fbc895887cf789c68819ae6a1cbc9b22225872dbe4ccd99a66",
        "bytes": 484061,
    },
    "semo_18.se1": {
        "sha256": "1ca07bd67c24374d77226180c20a4f9996cba013697894810518e7eb582ca4f7",
        "bytes": 1304771,
    },
    "seas_18.se1": {
        "sha256": "a2cd8fc33807c78ca9a700c91c2e042258b12fc4796519e00781440b5ad8b2e2",
        "bytes": 223004,
    },
}

BASE = "https://raw.githubusercontent.com/aloistr/swisseph/master/ephe"


def _sha256(path: str) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def fetch_ephe(dest: str) -> None:
    os.makedirs(dest, exist_ok=True)
    for name, meta in FILES.items():
        path = os.path.join(dest, name)
        if os.path.isfile(path) and os.path.getsize(path) == meta["bytes"] and _sha256(path) == meta["sha256"]:
            print(f"ok cached {name}")
            continue
        url = f"{BASE}/{name}"
        print(f"downloading {url}")
        urllib.request.urlretrieve(url, path)
        digest = _sha256(path)
        size = os.path.getsize(path)
        if digest != meta["sha256"]:
            raise SystemExit(f"SHA-256 mismatch for {name}: {digest} (size={size})")
        if size != meta["bytes"]:
            raise SystemExit(f"size mismatch for {name}: {size} != {meta['bytes']}")
        print(f"ok {name} sha256={digest}")


def main() -> int:
    dest = os.environ.get("EPHE_PATH") or os.path.join(os.path.dirname(__file__), "..", "ephe")
    dest = os.path.abspath(dest)
    fetch_ephe(dest)
    print(f"EPHE_PATH={dest}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
