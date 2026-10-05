"""Resolución de hora local → UTC con zoneinfo (AD-04)."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

# Mensajes estables (claves, no copy de producto). El frontend las traduce.
TZ_WARNING_AMBIGUOUS = "ambiguous_dst"
TZ_WARNING_NONEXISTENT = "nonexistent_dst"
TZ_WARNING_UNKNOWN = "tz_unknown"
TZ_WARNING_OFFSET_OVERRIDE = "offset_override"


def resolve_birth_instant(
    birth_date: str,
    birth_time: str,
    timezone_offset: float,
    tz_name: str | None = None,
) -> dict[str, Any]:
    """Convierte fecha+hora local a UTC.

    - Si hay `tz_name` IANA válido, zoneinfo manda siempre (AD-04).
    - Hora ambigua (otoño) o inexistente (primavera): fold=0 + tz_warning.
    - `timezone_offset` se usa solo si `tz_name` se omite (ajuste manual).
    - Si hay `tz_name` y el offset del cliente no coincide, se anota
      `offset_override` y se sigue usando zoneinfo.
    """
    year, month, day = map(int, birth_date.split("-"))
    hh, mm = map(int, birth_time.split(":"))
    naive = datetime(year, month, day, hh, mm, 0)

    warning: str | None = None
    used_name: str | None = (tz_name or "").strip() or None
    offset_hours = float(timezone_offset)

    if used_name:
        try:
            tz = ZoneInfo(used_name)
        except ZoneInfoNotFoundError:
            tz = None
            warning = TZ_WARNING_UNKNOWN
            used_name = None

        if tz is not None:
            dt0 = naive.replace(tzinfo=tz, fold=0)
            dt1 = naive.replace(tzinfo=tz, fold=1)
            off0 = dt0.utcoffset()
            off1 = dt1.utcoffset()
            if off0 is None:
                warning = TZ_WARNING_UNKNOWN
            else:
                if off1 is not None and off0 != off1:
                    warning = TZ_WARNING_AMBIGUOUS
                zone_offset = off0.total_seconds() / 3600.0
                utc = dt0.astimezone(timezone.utc)
                roundtrip = utc.astimezone(tz).replace(tzinfo=None)
                if roundtrip.replace(second=0, microsecond=0) != naive:
                    warning = TZ_WARNING_NONEXISTENT
                # Override manual: el cliente omite tz_name (ver BirthDataForm "ajustar").
                # Si envía tz_name, zoneinfo manda; un offset distinto se anota, no se aplica.
                if abs(float(timezone_offset) - zone_offset) > 0.01:
                    warning = TZ_WARNING_OFFSET_OVERRIDE
                offset_hours = zone_offset
                return {
                    "utc": utc,
                    "offset_hours": offset_hours,
                    "tz_name": used_name,
                    "tz_warning": warning,
                    "hour_ut": utc.hour + utc.minute / 60.0 + utc.second / 3600.0,
                    "ut_year": utc.year,
                    "ut_month": utc.month,
                    "ut_day": utc.day,
                }

    utc_naive = naive - timedelta(hours=offset_hours)
    utc = utc_naive.replace(tzinfo=timezone.utc)
    return {
        "utc": utc,
        "offset_hours": offset_hours,
        "tz_name": used_name,
        "tz_warning": warning,
        "hour_ut": utc.hour + utc.minute / 60.0 + utc.second / 3600.0,
        "ut_year": utc.year,
        "ut_month": utc.month,
        "ut_day": utc.day,
    }
