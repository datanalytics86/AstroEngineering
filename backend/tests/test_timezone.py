"""AD-04: zoneinfo en la hora local exacta. Casos verificados contra tzdata."""

from astro.timezone import (
    TZ_WARNING_OFFSET_OVERRIDE,
    resolve_birth_instant,
)


def _offset(date: str, time: str, tz: str, fallback: float = 0.0) -> float:
    return resolve_birth_instant(date, time, fallback, tz)["offset_hours"]


def test_santiago_winter_1990_minus_4():
    # 15 jul 1990 14:30 America/Santiago → CLT UTC−4
    r = resolve_birth_instant("1990-07-15", "14:30", -4, "America/Santiago")
    assert r["offset_hours"] == -4
    assert r["tz_warning"] is None


def test_santiago_summer_1990_minus_3():
    r = resolve_birth_instant("1990-01-15", "14:30", -3, "America/Santiago")
    assert r["offset_hours"] == -3


def test_punta_arenas_2018_minus_3():
    r = resolve_birth_instant("2018-07-15", "12:00", -3, "America/Punta_Arenas")
    assert r["offset_hours"] == -3


def test_seoul_plus_9():
    assert _offset("1990-05-15", "14:30", "Asia/Seoul") == 9


def test_dublin_summer_plus_1():
    assert _offset("2026-07-01", "12:00", "Europe/Dublin") == 1


def test_phoenix_no_dst_minus_7():
    winter = _offset("2026-01-15", "12:00", "America/Phoenix")
    summer = _offset("2026-07-15", "12:00", "America/Phoenix")
    assert winter == summer == -7


def test_kolkata_plus_5_30():
    assert _offset("2000-01-01", "00:00", "Asia/Kolkata") == 5.5


def test_kathmandu_plus_5_45():
    assert _offset("2000-01-01", "00:00", "Asia/Kathmandu") == 5.75


def test_caracas_2010_minus_4_30():
    # Venezuela used UTC−4:30 from 2007-12-09 to 2016-04-30.
    assert _offset("2010-06-15", "12:00", "America/Caracas") == -4.5


def test_numeric_offset_without_tz_name():
    r = resolve_birth_instant("1990-05-15", "14:30", -4, None)
    assert r["offset_hours"] == -4
    assert r["tz_name"] is None
    assert r["ut_year"] == 1990
    # 14:30 − (−4) = 18:30 UT
    assert r["hour_ut"] == 18.5


def test_offset_override_sets_warning_but_zoneinfo_wins():
    r = resolve_birth_instant("1990-07-15", "14:30", -5, "America/Santiago")
    assert r["tz_warning"] == TZ_WARNING_OFFSET_OVERRIDE
    assert r["offset_hours"] == -4


def test_manual_offset_without_tz_name():
    r = resolve_birth_instant("1990-07-15", "14:30", -5, None)
    assert r["offset_hours"] == -5
    assert r["tz_name"] is None
