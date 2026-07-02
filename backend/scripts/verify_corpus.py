#!/usr/bin/env python3
"""
Verifica el corpus de eventos históricos de astrología mundial
(backend/astro/mundane.py::HISTORICAL_EVENTS) contra el cielo real calculado
con Swiss Ephemeris / Moshier.

Para CADA evento y CADA una de sus firmas (un evento puede tener varias,
ver `signatures`):
  - Firma de aspecto (par de cuerpos + aspecto): computa el cielo en la
    fecha del evento y verifica que la separación real entre el par esté
    a <= 8° de orbe del aspecto declarado.
  - Firma de ingreso (cuerpo + signo): verifica que el cuerpo esté
    efectivamente EN ese signo en la fecha del evento.

Imprime una tabla evento | firma | declarado | real | orbe | PASS/FAIL y
termina con exit code != 0 si hay algún FAIL.

Uso:
    cd backend && python3 scripts/verify_corpus.py
"""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from astro.mundane import HISTORICAL_EVENTS, _event_signatures, compute_mundane_sky  # noqa: E402
from astro.aspects import ASPECTS, angular_distance  # noqa: E402

MAX_ASPECT_ORB = 8.0
ASPECT_ANGLE = {a["name"]: a["angle"] for a in ASPECTS}


def _fmt_sig(sig: dict) -> str:
    if "pair" in sig:
        return f"{sig['pair'][0]}-{sig['pair'][1]} {sig['aspect']}"
    return f"{sig['body']} → {sig['ingress']}"


def verify_event(event: dict) -> list[dict]:
    """Verifica cada firma de un evento. Devuelve una lista de filas de resultado."""
    rows: list[dict] = []
    sky = compute_mundane_sky(event["date"])
    by_name = {s["name"]: s for s in sky}

    for sig in _event_signatures(event):
        if "pair" in sig:
            body_a, body_b = sig["pair"]
            aspect_name = sig["aspect"]
            sa = by_name.get(body_a)
            sb = by_name.get(body_b)
            if sa is None or sb is None:
                rows.append({
                    "event": event["id"], "sig": _fmt_sig(sig), "declared": aspect_name,
                    "actual": "n/d (sin efemérides)", "orb": None, "ok": False,
                })
                continue
            actual_angle = angular_distance(sa["longitude"], sb["longitude"])
            aspect_angle = ASPECT_ANGLE.get(aspect_name)
            if aspect_angle is None:
                rows.append({
                    "event": event["id"], "sig": _fmt_sig(sig), "declared": aspect_name,
                    "actual": f"{actual_angle:.2f}°", "orb": None, "ok": False,
                })
                continue
            orb = abs(actual_angle - aspect_angle)
            rows.append({
                "event": event["id"], "sig": _fmt_sig(sig), "declared": aspect_name,
                "actual": f"{actual_angle:.2f}°", "orb": orb, "ok": orb <= MAX_ASPECT_ORB,
            })
        elif "body" in sig:
            body = sig["body"]
            ingress = sig["ingress"]
            sb = by_name.get(body)
            if sb is None:
                rows.append({
                    "event": event["id"], "sig": _fmt_sig(sig), "declared": ingress,
                    "actual": "n/d (sin efemérides)", "orb": None, "ok": False,
                })
                continue
            rows.append({
                "event": event["id"], "sig": _fmt_sig(sig), "declared": ingress,
                "actual": f"{sb['sign']} {sb['degree_in_sign']:.2f}°", "orb": None,
                "ok": sb["sign"] == ingress,
            })
        else:
            rows.append({
                "event": event["id"], "sig": str(sig), "declared": "?",
                "actual": "firma desconocida", "orb": None, "ok": False,
            })
    return rows


def main() -> int:
    all_rows: list[dict] = []
    for event in HISTORICAL_EVENTS:
        all_rows.extend(verify_event(event))

    header = f"{'evento':<30} {'firma':<26} {'declarado':<14} {'real':<22} {'orbe':<8} resultado"
    print(header)
    print("-" * len(header))

    n_fail = 0
    for row in all_rows:
        orb_str = f"{row['orb']:.2f}°" if row["orb"] is not None else "—"
        status = "PASS" if row["ok"] else "FAIL"
        if not row["ok"]:
            n_fail += 1
        print(
            f"{row['event']:<30} {row['sig']:<26} {row['declared']:<14} "
            f"{row['actual']:<22} {orb_str:<8} {status}"
        )

    n_events = len(HISTORICAL_EVENTS)
    n_signatures = len(all_rows)
    print("-" * len(header))
    print(f"Eventos: {n_events} · Firmas verificadas: {n_signatures} · "
          f"PASS: {n_signatures - n_fail} · FAIL: {n_fail}")

    if n_fail > 0:
        print(f"\n{n_fail} firma(s) fallaron la verificación.", file=sys.stderr)
        return 1

    print("\nTodas las firmas verificadas contra el cielo real. OK.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
