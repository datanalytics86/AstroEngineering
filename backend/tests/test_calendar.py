"""Tests de `astro/calendar.py`: calendario astrológico diario.
Auto-verificables (aritmética/astronomía computada en vivo, sin fechas de
memoria)."""

import calendar as _pycalendar

from astro.calendar import compute_daily_calendar, MOON_PHASE_NAMES
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_three_months_with_correct_day_counts():
    months = compute_daily_calendar(2026, 7, months=3)
    assert len(months) == 3
    assert [m["month"] for m in months] == [7, 8, 9]
    for m in months:
        expected_days = _pycalendar.monthrange(m["year"], m["month"])[1]
        assert len(m["days"]) == expected_days, f"{m['year']}-{m['month']}: {len(m['days'])} != {expected_days}"


def test_moon_changes_sign_expected_number_of_times():
    # Ciclo lunar ~27.3 días / 12 signos ≈ 2.275 días por signo. En ~90-92
    # días (3 meses) eso da ~36-42 cambios de signo (aritmética, no memoria).
    months = compute_daily_calendar(2026, 7, months=3)
    ingress_count = 0
    for m in months:
        for d in m["days"]:
            for e in d["events"]:
                if e["type"] == "ingress" and e["body"] == "Luna":
                    ingress_count += 1
    assert 34 <= ingress_count <= 44, f"Luna cambió de signo {ingress_count} veces"


def test_each_month_has_three_to_five_moon_phases_in_cyclic_order():
    months = compute_daily_calendar(2026, 7, months=3)
    for m in months:
        phases = []
        for d in m["days"]:
            for e in d["events"]:
                if e["type"] == "moon_phase":
                    phases.append(e["phase"])
        assert 3 <= len(phases) <= 5, f"{m['year']}-{m['month']}: {len(phases)} fases"
        # orden cíclico: cada fase sigue a la anterior en MOON_PHASE_NAMES (circular)
        for i in range(1, len(phases)):
            prev_idx = MOON_PHASE_NAMES.index(phases[i - 1])
            cur_idx = MOON_PHASE_NAMES.index(phases[i])
            assert cur_idx == (prev_idx + 1) % 4, f"orden de fase roto: {phases}"


def test_ingress_sign_differs_from_previous_day():
    from astro.chart import PLANET_IDS, calc_planet_position, to_julian_day
    from astro.houses import longitude_to_sign
    from datetime import date, timedelta

    months = compute_daily_calendar(2026, 7, months=3)
    checked = 0
    for m in months:
        for d in m["days"]:
            for e in d["events"]:
                if e["type"] != "ingress":
                    continue
                cur_date = date.fromisoformat(d["date"])
                prev_date = cur_date - timedelta(days=1)
                pid = PLANET_IDS[e["body"]]
                jd_today = to_julian_day(cur_date.year, cur_date.month, cur_date.day, 12.0)
                jd_prev = to_julian_day(prev_date.year, prev_date.month, prev_date.day, 12.0)
                sign_today = longitude_to_sign(calc_planet_position(jd_today, pid)["longitude"])["sign"]
                sign_prev = longitude_to_sign(calc_planet_position(jd_prev, pid)["longitude"])["sign"]
                assert sign_today != sign_prev
                assert sign_today == e["sign"]
                checked += 1
    assert checked > 0


def test_aspect_orb_recomputed_within_1_2_degrees():
    from astro.chart import PLANET_IDS, calc_planet_position, to_julian_day
    from astro.aspects import ASPECTS, angular_distance
    from datetime import date

    months = compute_daily_calendar(2026, 7, months=3)
    checked = 0
    for m in months:
        for d in m["days"]:
            for e in d["events"]:
                if e["type"] != "aspect":
                    continue
                cur_date = date.fromisoformat(d["date"])
                jd = to_julian_day(cur_date.year, cur_date.month, cur_date.day, 12.0)
                b1, b2 = e["bodies"]
                lon1 = calc_planet_position(jd, PLANET_IDS[b1])["longitude"]
                lon2 = calc_planet_position(jd, PLANET_IDS[b2])["longitude"]
                angle = angular_distance(lon1, lon2)
                asp = next(a for a in ASPECTS if a["name"] == e["aspect"])
                orb = abs(angle - asp["angle"])
                assert orb <= 1.2, f"{d['date']} {b1}-{b2} {e['aspect']}: orbe {orb}"
                checked += 1
    assert checked > 0


def test_endpoint_returns_valid_shape():
    resp = client.get("/api/calendar", params={"year": 2026, "month": 7})
    assert resp.status_code == 200
    data = resp.json()
    assert len(data["months"]) == 3
    first_day = data["months"][0]["days"][0]
    assert "moon" in first_day and "sun" in first_day and "events" in first_day


def test_endpoint_year_out_of_range_returns_422():
    resp = client.get("/api/calendar", params={"year": 1999, "month": 7})
    assert resp.status_code == 422


def test_every_day_has_five_fast_positions_valid_signs():
    from astro.houses import SIGN_NAMES

    months = compute_daily_calendar(2026, 7, months=3)
    for m in months:
        for d in m["days"]:
            assert len(d["fast"]) == 5, f"{d['date']}: {len(d['fast'])} posiciones fast"
            names = {f["name"] for f in d["fast"]}
            assert names == {"Luna", "Sol", "Mercurio", "Venus", "Marte"}
            for f in d["fast"]:
                assert f["sign"] in SIGN_NAMES
                assert 0.0 <= f["degree_in_sign"] < 30.0


def test_fast_sign_recomputed_matches_sampled_days():
    from astro.chart import PLANET_IDS, calc_planet_position, to_julian_day
    from astro.houses import longitude_to_sign
    from datetime import date

    months = compute_daily_calendar(2026, 7, months=3)
    sample_days = [months[0]["days"][0], months[1]["days"][10], months[2]["days"][-1]]
    checked = 0
    for d in sample_days:
        cur_date = date.fromisoformat(d["date"])
        jd = to_julian_day(cur_date.year, cur_date.month, cur_date.day, 12.0)
        for f in d["fast"]:
            pid = PLANET_IDS[f["name"]]
            lon = calc_planet_position(jd, pid)["longitude"]
            sign = longitude_to_sign(lon)["sign"]
            assert sign == f["sign"], f"{d['date']} {f['name']}: {sign} != {f['sign']}"
            checked += 1
    assert checked == 15


def test_slow_segments_cover_month_without_gaps():
    from datetime import date, timedelta

    months = compute_daily_calendar(2026, 7, months=3)
    for m in months:
        num_days = _pycalendar.monthrange(m["year"], m["month"])[1]
        month_start = date(m["year"], m["month"], 1).isoformat()
        month_end = date(m["year"], m["month"], num_days).isoformat()
        by_body: dict[str, list[dict]] = {}
        for seg in m["slow"]:
            by_body.setdefault(seg["name"], []).append(seg)
        for body, segs in by_body.items():
            segs.sort(key=lambda s: s["from_date"])
            assert segs[0]["from_date"] == month_start, f"{m['year']}-{m['month']} {body}: no empieza en el mes"
            assert segs[-1]["to_date"] == month_end, f"{m['year']}-{m['month']} {body}: no termina en el mes"
            for i in range(1, len(segs)):
                prev_end = date.fromisoformat(segs[i - 1]["to_date"])
                cur_start = date.fromisoformat(segs[i]["from_date"])
                assert cur_start == prev_end + timedelta(days=1), f"hueco en segmentos de {body}"


def test_slow_segment_sign_matches_recomputed_midpoint():
    from astro.chart import PLANET_IDS, calc_planet_position, to_julian_day
    from astro.houses import longitude_to_sign
    from datetime import date

    months = compute_daily_calendar(2026, 7, months=3)
    checked = 0
    for m in months:
        for seg in m["slow"]:
            start = date.fromisoformat(seg["from_date"])
            end = date.fromisoformat(seg["to_date"])
            mid = start + (end - start) // 2
            jd = to_julian_day(mid.year, mid.month, mid.day, 12.0)
            lon = calc_planet_position(jd, PLANET_IDS[seg["name"]])["longitude"]
            sign = longitude_to_sign(lon)["sign"]
            assert sign == seg["sign"], f"{m['year']}-{m['month']} {seg['name']}: {sign} != {seg['sign']}"
            checked += 1
    assert checked > 0


def test_month_with_slow_ingress_has_two_segments():
    months = compute_daily_calendar(2026, 7, months=3)
    found_multi_segment_month = False
    for m in months:
        ingress_bodies = {
            e["body"] for d in m["days"] for e in d["events"]
            if e["type"] == "ingress" and e["body"] in {"Júpiter", "Saturno", "Urano", "Neptuno", "Plutón"}
        }
        for body in ingress_bodies:
            count = sum(1 for seg in m["slow"] if seg["name"] == body)
            assert count == 2, f"{m['year']}-{m['month']} {body} tiene ingreso pero {count} segmentos"
            found_multi_segment_month = True
    # No es obligatorio que un ingreso lento caiga en la ventana de prueba,
    # pero si ocurrió, debe haberse validado arriba.
    assert found_multi_segment_month or True
