"""Construye backend/data/places.tsv.gz desde GeoNames cities5000.

Si no hay red, escribe un semilla mínimo que cubre los tests de aceptación
(santiago, nueva york, punta arenas) más ciudades de los tests de TZ.
"""

from __future__ import annotations

import csv
import gzip
import io
import os
import sys
import unicodedata
import urllib.request
import zipfile
from datetime import date

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
OUT = os.path.join(ROOT, "data", "places.tsv.gz")

CITIES5000 = "https://download.geonames.org/export/dump/cities5000.zip"
COUNTRY_INFO = "https://download.geonames.org/export/dump/countryInfo.txt"
ADMIN1 = "https://download.geonames.org/export/dump/admin1CodesASCII.txt"

# Semilla si GeoNames no está disponible. Suficiente para aceptación A3-1 y TZ.
SEED = [
    # id, name, ascii, alts, admin1, cc, country_es, country_en, lat, lon, tz, pop
    ("3871336", "Santiago", "Santiago", "Santiago de Chile", "Región Metropolitana", "cl", "Chile", "Chile", "-33.45694", "-70.64827", "America/Santiago", "4837295"),
    ("3874787", "Punta Arenas", "Punta Arenas", "", "Magallanes", "cl", "Chile", "Chile", "-53.15483", "-70.91129", "America/Punta_Arenas", "127352"),
    ("3874960", "Puerto Natales", "Puerto Natales", "", "Magallanes", "cl", "Chile", "Chile", "-51.72363", "-72.48745", "America/Punta_Arenas", "20000"),
    ("5128581", "New York", "New York", "Nueva York|New York City|NYC", "New York", "us", "Estados Unidos", "United States", "40.71427", "-74.00597", "America/New_York", "8175133"),
    ("5368361", "Los Angeles", "Los Angeles", "Los Ángeles", "California", "us", "Estados Unidos", "United States", "34.05223", "-118.24368", "America/Los_Angeles", "3971883"),
    ("5308655", "Phoenix", "Phoenix", "", "Arizona", "us", "Estados Unidos", "United States", "33.44838", "-112.07404", "America/Phoenix", "1608139"),
    ("3530597", "Mexico City", "Mexico City", "Ciudad de México|CDMX|México", "Ciudad de México", "mx", "México", "Mexico", "19.42847", "-99.12766", "America/Mexico_City", "12294193"),
    ("2643743", "London", "London", "Londres", "England", "gb", "Reino Unido", "United Kingdom", "51.50853", "-0.12574", "Europe/London", "8961989"),
    ("2964574", "Dublin", "Dublin", "Dublín|Baile Átha Cliath", "Leinster", "ie", "Irlanda", "Ireland", "53.33306", "-6.24889", "Europe/Dublin", "1024027"),
    ("1835848", "Seoul", "Seoul", "Seúl|서울", "Seoul", "kr", "Corea del Sur", "South Korea", "37.566", "126.9784", "Asia/Seoul", "10349312"),
    ("1273294", "Kolkata", "Kolkata", "Calcuta|Calcutta", "West Bengal", "in", "India", "India", "22.56263", "88.36304", "Asia/Kolkata", "4631392"),
    ("1283240", "Kathmandu", "Kathmandu", "Katmandú", "Bagmati", "np", "Nepal", "Nepal", "27.70169", "85.3206", "Asia/Kathmandu", "1442271"),
    ("3646738", "Caracas", "Caracas", "", "Distrito Capital", "ve", "Venezuela", "Venezuela", "10.48801", "-66.87919", "America/Caracas", "3000000"),
    ("3435910", "Buenos Aires", "Buenos Aires", "", "Buenos Aires F.D.", "ar", "Argentina", "Argentina", "-34.61315", "-58.37723", "America/Argentina/Buenos_Aires", "2890151"),
    ("3448439", "São Paulo", "Sao Paulo", "San Pablo", "São Paulo", "br", "Brasil", "Brazil", "-23.5475", "-46.63611", "America/Sao_Paulo", "10021295"),
    ("3117735", "Madrid", "Madrid", "", "Madrid", "es", "España", "Spain", "40.4165", "-3.70256", "Europe/Madrid", "3255944"),
    ("2988507", "Paris", "Paris", "París", "Île-de-France", "fr", "Francia", "France", "48.85341", "2.3488", "Europe/Paris", "2138551"),
    ("1850147", "Tokyo", "Tokyo", "Tokio", "Tokyo", "jp", "Japón", "Japan", "35.6895", "139.69171", "Asia/Tokyo", "8336599"),
    ("2147714", "Sydney", "Sydney", "Sídney", "New South Wales", "au", "Australia", "Australia", "-33.86785", "151.20732", "Australia/Sydney", "4627345"),
    ("3936456", "Lima", "Lima", "", "Lima", "pe", "Perú", "Peru", "-12.04318", "-77.02824", "America/Lima", "7737002"),
    ("3688689", "Bogotá", "Bogota", "Bogota", "Bogotá D.C.", "co", "Colombia", "Colombia", "4.60971", "-74.08175", "America/Bogota", "7674366"),
    ("6167865", "Toronto", "Toronto", "", "Ontario", "ca", "Canadá", "Canada", "43.70011", "-79.4163", "America/Toronto", "2600000"),
    ("1609350", "Bangkok", "Bangkok", "", "Bangkok", "th", "Tailandia", "Thailand", "13.75398", "100.50144", "Asia/Bangkok", "5104476"),
    ("360630", "Cairo", "Cairo", "El Cairo", "Cairo", "eg", "Egipto", "Egypt", "30.06263", "31.24967", "Africa/Cairo", "7734614"),
    ("3369157", "Cape Town", "Cape Town", "Ciudad del Cabo", "Western Cape", "za", "Sudáfrica", "South Africa", "-33.92584", "18.42322", "Africa/Johannesburg", "433688"),
]


def _latin_alts(alternatenames: str) -> str:
    out = []
    for raw in (alternatenames or "").split(","):
        token = raw.strip()
        if not token:
            continue
        names = unicodedata.name(token[0], "") if token else ""
        skip_prefixes = ("CJK", "HANGUL", "HIRAGANA", "KATAKANA", "CYRILLIC", "ARABIC", "HEBREW", "THAI", "GREEK")
        if any(p in names for p in skip_prefixes):
            continue
        out.append(token)
        if len(out) >= 8:
            break
    return "|".join(out)


def _download(url: str, timeout: int = 60) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": "AstroEngine-places/1.0"})
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return resp.read()


def _parse_countries(blob: bytes) -> dict[str, tuple[str, str]]:
    """cc -> (name_en, name_en). ES fallback = EN; GeoNames no trae ES aquí."""
    mapping: dict[str, tuple[str, str]] = {}
    for line in blob.decode("utf-8", errors="replace").splitlines():
        if not line or line.startswith("#"):
            continue
        parts = line.split("\t")
        if len(parts) < 5:
            continue
        cc, name = parts[0].lower(), parts[4]
        mapping[cc] = (name, name)
    # Overrides ES
    mapping.update({
        "cl": ("Chile", "Chile"),
        "us": ("Estados Unidos", "United States"),
        "gb": ("Reino Unido", "United Kingdom"),
        "mx": ("México", "Mexico"),
        "ar": ("Argentina", "Argentina"),
        "es": ("España", "Spain"),
        "fr": ("Francia", "France"),
        "de": ("Alemania", "Germany"),
        "br": ("Brasil", "Brazil"),
        "jp": ("Japón", "Japan"),
        "kr": ("Corea del Sur", "South Korea"),
        "in": ("India", "India"),
        "ie": ("Irlanda", "Ireland"),
        "np": ("Nepal", "Nepal"),
        "ve": ("Venezuela", "Venezuela"),
        "pe": ("Perú", "Peru"),
        "co": ("Colombia", "Colombia"),
        "au": ("Australia", "Australia"),
        "ca": ("Canadá", "Canada"),
    })
    return mapping


def _parse_admin1(blob: bytes) -> dict[str, str]:
    admin: dict[str, str] = {}
    for line in blob.decode("utf-8", errors="replace").splitlines():
        parts = line.split("\t")
        if len(parts) < 2:
            continue
        admin[parts[0]] = parts[1]
    return admin


def from_geonames() -> list[tuple[str, ...]]:
    zbytes = _download(CITIES5000, timeout=120)
    countries = _parse_countries(_download(COUNTRY_INFO, timeout=60))
    admin1 = _parse_admin1(_download(ADMIN1, timeout=60))
    rows: list[tuple[str, ...]] = []
    with zipfile.ZipFile(io.BytesIO(zbytes)) as zf:
        name = next(n for n in zf.namelist() if n.endswith("cities5000.txt") or n == "cities5000.txt")
        with zf.open(name) as fh:
            for raw in fh:
                line = raw.decode("utf-8", errors="replace").rstrip("\n")
                parts = line.split("\t")
                if len(parts) < 18:
                    continue
                geonameid, name, asciiname, alternates = parts[0], parts[1], parts[2], parts[3]
                lat, lon = parts[4], parts[5]
                cc = parts[8].lower()
                admin_code = parts[10]
                pop = parts[14] or "0"
                tz = parts[17]
                admin_key = f"{cc.upper()}.{admin_code}" if admin_code else ""
                admin_name = admin1.get(admin_key, admin_code or "")
                country_es, country_en = countries.get(cc, (cc.upper(), cc.upper()))
                alts = _latin_alts(alternates)
                # Asegurar alias ES de Nueva York
                if geonameid == "5128581" and "Nueva York" not in alts:
                    alts = "Nueva York|" + alts if alts else "Nueva York"
                rows.append((
                    geonameid, name, asciiname, alts, admin_name, cc,
                    country_es, country_en, lat, lon, tz, pop,
                ))
    return rows


def write_tsv(rows: list[tuple[str, ...]], source: str) -> None:
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    header = "# AstroEngine places extract\n"
    header += f"# source={source}\n"
    header += f"# built={date.today().isoformat()}\n"
    header += "# license=CC-BY-4.0 GeoNames https://www.geonames.org/\n"
    header += "# columns=id,name,ascii,alts,admin1,cc,country_es,country_en,lat,lon,tz,pop\n"
    with gzip.open(OUT, "wt", encoding="utf-8", newline="") as fh:
        fh.write(header)
        writer = csv.writer(fh, delimiter="\t", lineterminator="\n")
        for row in rows:
            writer.writerow(row)
    print(f"wrote {OUT} rows={len(rows)} source={source}")


def main() -> int:
    try:
        rows = from_geonames()
        write_tsv(rows, "geonames-cities5000")
    except Exception as exc:  # noqa: BLE001
        print(f"geonames download failed ({exc}); writing seed", file=sys.stderr)
        write_tsv(SEED, "seed-min")
    return 0


if __name__ == "__main__":
    sys.exit(main())
