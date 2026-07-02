"""Tests de `astro/aspects.py`: distancia angular, detección de aspectos y scoring."""

from astro.aspects import (
    angular_distance,
    find_aspects,
    score_transit,
    importance_label,
)


def test_angular_distance_symmetric():
    assert angular_distance(10, 350) == angular_distance(350, 10)


def test_angular_distance_wraparound():
    # 350° y 10° están a 20° de distancia real (cruzando 0°/360°)
    assert angular_distance(350, 10) == 20


def test_angular_distance_zero_and_opposite():
    assert angular_distance(100, 100) == 0
    assert angular_distance(0, 180) == 180


def test_find_aspects_detects_exact_conjunction():
    planets = [
        {"name": "Sol", "longitude": 10.0, "speed": 1.0},
        {"name": "Luna", "longitude": 10.0, "speed": 13.0},
    ]
    aspects = find_aspects(planets)
    conjunctions = [a for a in aspects if a["aspect_name"] == "Conjunción"]
    assert len(conjunctions) == 1
    assert conjunctions[0]["orb"] == 0.0
    assert conjunctions[0]["actual_angle"] == 0.0


def test_find_aspects_respects_orb_limits():
    # Sextil tiene orbe 6°; a 67° (7° de orbe) no debe detectarse
    planets = [
        {"name": "Sol", "longitude": 0.0, "speed": 1.0},
        {"name": "Venus", "longitude": 67.0, "speed": 1.2},
    ]
    aspects = find_aspects(planets)
    sextiles = [a for a in aspects if a["aspect_name"] == "Sextil"]
    assert sextiles == []

    # A 64° (4° de orbe) sí debe detectarse
    planets2 = [
        {"name": "Sol", "longitude": 0.0, "speed": 1.0},
        {"name": "Venus", "longitude": 64.0, "speed": 1.2},
    ]
    aspects2 = find_aspects(planets2)
    sextiles2 = [a for a in aspects2 if a["aspect_name"] == "Sextil"]
    assert len(sextiles2) == 1
    assert sextiles2[0]["orb"] == 4.0


def test_find_aspects_no_self_pair_duplication():
    planets = [
        {"name": "Sol", "longitude": 0.0, "speed": 1.0},
        {"name": "Luna", "longitude": 90.0, "speed": 13.0},
        {"name": "Marte", "longitude": 180.0, "speed": 0.5},
    ]
    aspects = find_aspects(planets)
    pairs = [(a["planet1"], a["planet2"]) for a in aspects]
    assert len(pairs) == len(set(pairs))  # cada par aparece una sola vez


def test_score_transit_monotonic_with_orb():
    tight = score_transit("Plutón", "Sol", "Conjunción", orb=0.1)
    loose = score_transit("Plutón", "Sol", "Conjunción", orb=4.0)
    assert tight > loose


def test_score_transit_monotonic_with_weight():
    heavy = score_transit("Plutón", "Sol", "Conjunción", orb=1.0)
    light = score_transit("Mercurio", "Luna", "Semi-sextil", orb=1.0)
    assert heavy > light


def test_importance_label_thresholds():
    assert importance_label(9.0) == "crítica"
    assert importance_label(6.0) == "alta"
    assert importance_label(3.5) == "media"
    assert importance_label(1.0) == "baja"
    # Bordes exactos
    assert importance_label(8.0) == "crítica"
    assert importance_label(5.0) == "alta"
    assert importance_label(3.0) == "media"
