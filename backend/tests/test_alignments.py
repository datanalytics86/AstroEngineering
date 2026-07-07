"""Tests de `astro/mundane.py`: alineamientos multi-planeta (kind="alignment"),
post-proceso sobre las configs kind="aspect" ya detectadas. Ninguna fecha se
asume de memoria: cada aserción recomputa el cielo con las funciones del
propio módulo."""

from datetime import datetime, timedelta

from fastapi.testclient import TestClient

import main
from astro.mundane import (
    find_mundane_configurations,
    find_alignments,
    build_mundane_forecast,
)
from astro.chart import calc_planet_position, PLANET_IDS, to_julian_day
from astro.aspects import ASPECTS, angular_distance

client = TestClient(main.app)


def _recompute_orb(body_a: str, body_b: str, aspect_name: str, date_str: str) -> float:
    """Recalcula el orbe real de un par de cuerpos para un aspecto dado en una
    fecha (mediodía UT), directamente desde swisseph — no confía en el orb ya
    reportado por el motor."""
    y, m, d = map(int, date_str.split("-"))
    jd = to_julian_day(y, m, d, 12.0)
    pa = calc_planet_position(jd, PLANET_IDS[body_a])
    pb = calc_planet_position(jd, PLANET_IDS[body_b])
    assert pa is not None and pb is not None
    angle = angular_distance(pa["longitude"], pb["longitude"])
    aspect_angle = next(a["angle"] for a in ASPECTS if a["name"] == aspect_name)
    return abs(angle - aspect_angle)


def test_find_alignments_2026_includes_four_body_group():
    configs = find_mundane_configurations("2026-01-01", "2026-12-31")
    alignments = find_alignments(configs, "2026-01-01", "2026-12-31")

    big = [a for a in alignments if len(a["bodies"]) >= 4]
    assert len(big) >= 1

    target = next(
        (a for a in big if {"Júpiter", "Urano", "Neptuno", "Plutón"}.issubset(set(a["bodies"]))),
        None,
    )
    assert target is not None, [a["bodies"] for a in big]

    # Todos los pares componentes deben tener orbe <= 3.5° EN LA exact_date del
    # alineamiento, recomputado directamente (no leído del dict).
    for comp in target["components"]:
        body_a, body_b = comp["bodies"]
        recomputed_orb = _recompute_orb(body_a, body_b, comp["aspect"], target["exact_date"])
        assert recomputed_orb <= 3.5, (comp, recomputed_orb)


def test_alignment_graph_is_connected_and_window_contains_exact_date():
    configs = find_mundane_configurations("2026-01-01", "2026-12-31")
    alignments = find_alignments(configs, "2026-01-01", "2026-12-31")
    assert len(alignments) > 0

    for a in alignments:
        assert len(a["bodies"]) >= 3
        assert a["window_start"] <= a["exact_date"] <= a["window_end"]

        # Conectividad: unión de todos los pares componentes debe cubrir
        # exactamente el conjunto `bodies` en un único componente conexo.
        parent = {b: b for b in a["bodies"]}

        def find(x):
            while parent[x] != x:
                parent[x] = parent[parent[x]]
                x = parent[x]
            return x

        for comp in a["components"]:
            ra, rb = find(comp["bodies"][0]), find(comp["bodies"][1])
            if ra != rb:
                parent[ra] = rb

        roots = {find(b) for b in a["bodies"]}
        assert len(roots) == 1


def test_alignment_degree_within_tolerance_when_present():
    configs = find_mundane_configurations("2026-01-01", "2026-12-31")
    alignments = find_alignments(configs, "2026-01-01", "2026-12-31")
    assert len(alignments) > 0

    for a in alignments:
        if a["alignment_degree"] is None:
            continue
        y, m, d = map(int, a["exact_date"].split("-"))
        jd = to_julian_day(y, m, d, 12.0)
        for body in a["bodies"]:
            pos = calc_planet_position(jd, PLANET_IDS[body])
            assert pos is not None
            degree_in_sign = pos["longitude"] % 30
            assert abs(degree_in_sign - a["alignment_degree"]) <= 2.5


def test_build_forecast_includes_alignment_sorted_with_rest():
    forecast = build_mundane_forecast("2026-01-01", "2026-12-31")
    kinds = {c["kind"] for c in forecast["configurations"]}
    assert "alignment" in kinds

    dates = [c["exact_date"] for c in forecast["configurations"]]
    assert dates == sorted(dates)

    alignment_configs = [c for c in forecast["configurations"] if c["kind"] == "alignment"]
    for ac in alignment_configs:
        assert ac["themes"] == []
        assert "2026-01-01" <= ac["exact_date"] <= "2026-12-31"
        assert ac["components"] is not None and len(ac["components"]) > 0

    # Las configs de par individuales que componen el alineamiento se conservan
    # como tarjetas propias (no se eliminan).
    aspect_configs = [c for c in forecast["configurations"] if c["kind"] == "aspect"]
    assert len(aspect_configs) > 0


def test_alignment_endpoint_returns_valid_response_and_country_mode():
    resp = client.post(
        "/api/mundane",
        json={"start_date": "2026-01-01", "end_date": "2026-12-31", "natal_planets": []},
    )
    assert resp.status_code == 200
    data = resp.json()
    kinds = {c["kind"] for c in data["configurations"]}
    assert "alignment" in kinds
    alignment = next(c for c in data["configurations"] if c["kind"] == "alignment")
    assert alignment["components"]
    assert len(alignment["bodies"]) >= 3

    resp_country = client.post(
        "/api/mundane",
        json={
            "start_date": "2026-01-01",
            "end_date": "2026-12-31",
            "natal_planets": [],
            "country": "chile",
        },
    )
    assert resp_country.status_code == 200
    data_country = resp_country.json()
    assert "national_impacts" in data_country
    for impact in data_country["national_impacts"]:
        assert impact["importance"] in {"crítica", "alta", "media", "baja"}


def test_narrow_range_around_compactness_date_keeps_full_alignment():
    """Regresión: un rango estrecho que contiene la fecha de compacidad pero
    NO todas las fechas exactas de los componentes debe devolver el
    alineamiento COMPLETO (el escaneo de alineamientos se amplía más allá del
    rango pedido), sin que las configs de par fuera de rango se cuelen en la
    respuesta."""
    full = build_mundane_forecast("2026-01-01", "2026-12-31")
    full_alignment = next(
        c for c in full["configurations"]
        if c["kind"] == "alignment" and len(c["bodies"]) >= 4
    )
    exact = full_alignment["exact_date"]  # derivada del motor, no de memoria

    # Rango de ±2 días alrededor de la compacidad: más corto que la ventana
    # del alineamiento (window_start→window_end), así que deja componentes fuera.
    center = datetime.fromisoformat(exact)
    start = (center - timedelta(days=2)).strftime("%Y-%m-%d")
    end = (center + timedelta(days=2)).strftime("%Y-%m-%d")
    assert full_alignment["window_start"] < start or full_alignment["window_end"] > end

    narrow = build_mundane_forecast(start, end)
    narrow_alignment = next(
        (c for c in narrow["configurations"]
         if c["kind"] == "alignment" and set(c["bodies"]) == set(full_alignment["bodies"])),
        None,
    )
    assert narrow_alignment is not None
    assert narrow_alignment["exact_date"] == exact
    assert len(narrow_alignment["components"]) == len(full_alignment["components"])

    # Las configs de par del escaneo ampliado NO deben filtrarse a la respuesta
    # si su fecha exacta cae fuera del rango pedido.
    for c in narrow["configurations"]:
        if c["kind"] != "alignment":
            assert start <= c["exact_date"] <= end, c["id"]


def test_full_suite_context_sanity():
    # Sanity check adicional: al menos una config kind="aspect" de julio 2026
    # participa como componente de un alineamiento (no solo configs de otros
    # meses agrupadas por casualidad).
    configs = find_mundane_configurations("2026-01-01", "2026-12-31")
    alignments = find_alignments(configs, "2026-01-01", "2026-12-31")
    july_aligned = [
        a for a in alignments
        if datetime.fromisoformat(a["exact_date"]).month == 7
        and len(a["bodies"]) >= 4
    ]
    assert len(july_aligned) >= 1
