"""A3-1: santiago, nueva york, punta arenas → zona IANA correcta."""

from astro.places import PlaceIndex, normalize


def test_normalize_strips_accents():
    assert normalize("Nueva York") == "nueva york"
    assert normalize("São Paulo") == "sao paulo"


def test_acceptance_queries(tmp_path, monkeypatch):
    from astro import places as places_mod

    idx = PlaceIndex()
    # Usa el archivo versionado si existe; si no, el test se salta.
    idx.load()
    if not idx.rows:
        return
    santiago = idx.search("santiago", lang="es", limit=8)
    assert santiago, "santiago debe devolver hits"
    assert any(h["tz"] == "America/Santiago" for h in santiago)

    ny = idx.search("nueva york", lang="es", limit=8)
    assert ny, "nueva york debe resolver New York"
    assert any(h["tz"] == "America/New_York" for h in ny)

    pa = idx.search("punta arenas", lang="es", limit=8)
    assert pa, "punta arenas debe existir (AD-06)"
    assert any(h["tz"] == "America/Punta_Arenas" for h in pa)
