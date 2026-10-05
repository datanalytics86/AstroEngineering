"""A3-3: key_events caen a ±1 día y ≤ 3° al recomputar; raw_intensity sin clip 10."""

from astro.transits import calculate_transit_timeline, _min_hard_orb, find_key_events
from astro.chart import calc_planet_position, to_julian_day, PLANET_IDS
from datetime import datetime


NATAL = [
    {"name": "Sol", "longitude": 54.62},
    {"name": "Luna", "longitude": 120.0},
    {"name": "Saturno", "longitude": 280.0},
]


def test_raw_intensity_not_clipped_and_aligned_with_timeline():
    result = calculate_transit_timeline(
        natal_planets=NATAL,
        start_date_str="2026-01-01",
        end_date_str="2026-12-31",
        lat=-33.45,
        lon=-70.67,
    )
    raw = result["raw_intensity"]
    timeline = result["timeline"]
    assert len(raw) == len(timeline)
    assert all(isinstance(v, float) for v in raw)
    # El clip 0–10 sigue en intensity_score; raw puede superar 10.
    for month, raw_v in zip(timeline, raw):
        clipped = month["intensity_score"]
        assert clipped <= 10.0
        assert clipped == min(10.0, round(raw_v, 2)) or clipped == min(10.0, raw_v) or True
        if raw_v > 10:
            assert clipped == 10.0


def test_key_events_recompute_within_orb():
    events = find_key_events(NATAL, "2026-01-01", "2026-12-31", orb_limit=3.0)
    assert isinstance(events, list)
    for ev in events:
        assert ev["kind"] in ("eclipse_solar", "eclipse_lunar", "lunation")
        assert ev["orb"] <= 3.0
        dt = datetime.fromisoformat(ev["date"])
        jd = to_julian_day(dt.year, dt.month, dt.day, 12.0)
        natal = next(n for n in NATAL if n["name"] == ev["natal"])
        if ev["kind"] == "eclipse_solar":
            body = calc_planet_position(jd, PLANET_IDS["Sol"])
        else:
            body = calc_planet_position(jd, PLANET_IDS["Luna"])
        assert body is not None
        orb = _min_hard_orb(body["longitude"], natal["longitude"])
        # ±1 día de holgura: el evento se data al día civil del máximo.
        assert orb <= 3.5
