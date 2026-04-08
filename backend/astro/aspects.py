"""
Detección y scoring de aspectos astrológicos.
"""

ASPECTS = [
    {"name": "Conjunción",       "angle": 0,   "orb": 8,   "symbol": "☌", "nature": "neutro"},
    {"name": "Semi-sextil",      "angle": 30,  "orb": 2,   "symbol": "⚺", "nature": "menor"},
    {"name": "Sextil",           "angle": 60,  "orb": 6,   "symbol": "⚹", "nature": "armonioso"},
    {"name": "Cuadratura",       "angle": 90,  "orb": 7,   "symbol": "□", "nature": "tenso"},
    {"name": "Trígono",          "angle": 120, "orb": 8,   "symbol": "△", "nature": "armonioso"},
    {"name": "Sesquicuadratura", "angle": 135, "orb": 2,   "symbol": "⚼", "nature": "tenso"},
    {"name": "Quincuncio",       "angle": 150, "orb": 3,   "symbol": "⚻", "nature": "tenso"},
    {"name": "Oposición",        "angle": 180, "orb": 8,   "symbol": "☍", "nature": "tenso"},
]

# Orbes más estrictos para tránsitos
TRANSIT_ORBS = {
    "Conjunción":       3.0,
    "Sextil":           2.0,
    "Cuadratura":       3.0,
    "Trígono":          3.0,
    "Oposición":        3.0,
    "Quincuncio":       1.5,
    "Semi-sextil":      1.0,
    "Sesquicuadratura": 1.0,
}

PLANET_WEIGHT = {
    "Plutón": 10, "Neptuno": 9, "Urano": 8,
    "Saturno": 7, "Júpiter": 6, "Sol": 5,
    "Marte": 4, "Luna": 3, "Venus": 3,
    "Mercurio": 2, "Nodo Norte": 3, "Quirón": 3,
    "Ascendente": 8, "MC": 7,
}

ASPECT_WEIGHT = {
    "Conjunción": 10, "Oposición": 9, "Cuadratura": 8,
    "Trígono": 7, "Sextil": 5, "Quincuncio": 4,
    "Semi-sextil": 2, "Sesquicuadratura": 3,
}


def angular_distance(lon1: float, lon2: float) -> float:
    """Distancia angular mínima entre dos longitudes eclípticas."""
    diff = abs(lon1 - lon2) % 360
    return diff if diff <= 180 else 360 - diff


def find_aspects(planets: list[dict]) -> list[dict]:
    """Detecta aspectos entre todos los pares de planetas de la lista."""
    aspects = []
    for i, p1 in enumerate(planets):
        for p2 in planets[i + 1:]:
            angle = angular_distance(p1["longitude"], p2["longitude"])
            for asp in ASPECTS:
                orb = abs(angle - asp["angle"])
                if orb <= asp["orb"]:
                    # Determinar si es aplicativo (simplificado por velocidad relativa)
                    applying = (p1.get("speed", 0) - p2.get("speed", 0)) > 0
                    aspects.append({
                        "planet1": p1["name"],
                        "planet2": p2["name"],
                        "aspect_name": asp["name"],
                        "aspect_symbol": asp["symbol"],
                        "exact_angle": asp["angle"],
                        "actual_angle": round(angle, 4),
                        "orb": round(orb, 4),
                        "applying": applying,
                        "nature": asp["nature"],
                    })
    return aspects


def score_transit(transit_planet: str, natal_planet: str, aspect_name: str, orb: float) -> float:
    """Calcula la importancia de un tránsito (0-10 aprox)."""
    tp_w = PLANET_WEIGHT.get(transit_planet, 3)
    np_w = PLANET_WEIGHT.get(natal_planet, 3)
    asp_w = ASPECT_WEIGHT.get(aspect_name, 3)
    orb_factor = max(0.0, 1 - orb / 5)
    return round((tp_w + np_w) * asp_w * orb_factor / 10, 2)


def importance_label(score: float) -> str:
    if score >= 8:
        return "crítica"
    elif score >= 5:
        return "alta"
    elif score >= 3:
        return "media"
    return "baja"
