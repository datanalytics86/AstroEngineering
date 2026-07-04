"""
Cartas nacionales (astrología mundial, tradición de Nicholas Campion — "The
Book of World Horoscopes"). Es el nivel intermedio entre el análisis mundial
puro (backend/astro/mundane.py) y el impacto sobre una carta natal personal:
usa la carta de un país en vez de la de una persona, reutilizando la misma
maquinaria de impactos ya existente (`find_natal_impacts` en mundane.py, que
solo necesita `name`/`longitude` por cuerpo — el shape que este módulo
produce es compatible sin cambios).

DECISIÓN DE DISEÑO — insensibilidad horaria (obligatoria, ver CLAUDE.md):
La hora exacta de muchas cartas nacionales es objeto de debate historiográfico
(el caso clásico es EE.UU.: la tradición Sibly la fija a las 17:10, sin
registro oficial). Por eso este módulo usa SOLO Sol→Plutón, EXCLUYENDO LA
LUNA (es el cuerpo más sensible al error horario, ~13°/día) y SIN casas ni
ángulos (dependen enteramente de la hora exacta y del lugar preciso). Un
error razonable de unas pocas horas mueve al Sol menos de 1° y al resto de
los cuerpos (todos con movimiento diario << 1°, salvo Marte en casos
extremos) aún menos — muy por debajo de los orbes de detección usados en el
módulo mundano (2-3°). Donde la hora no es célebre ni está documentada, se
usa 12:00 hora local aproximada.
"""

from datetime import datetime as _dt, timedelta as _td

from .chart import to_julian_day, calc_planet_position, PLANET_IDS, PLANET_SYMBOLS
from .houses import longitude_to_sign, degrees_to_dms

# Cuerpos usados en cartas nacionales: Sol → Plutón, SIN Luna (ver docstring).
NATIONAL_BODIES = [
    "Sol", "Mercurio", "Venus", "Marte",
    "Júpiter", "Saturno", "Urano", "Neptuno", "Plutón",
]

# Corpus de cartas nacionales (tradición mundialista de Campion). Fechas y
# horas son hechos históricos documentados (o, donde la hora es discutida,
# la convención más citada en la tradición — ver `chart_note_*` por país).
# lat/lon/tz son aproximados de la ciudad histórica del evento; dado el
# diseño insensible a la hora, una tz histórica aproximada es aceptable.
NATIONAL_CHARTS: dict[str, dict] = {
    "chile": {
        "id": "chile", "name_es": "Chile", "name_en": "Chile",
        "date": "1810-09-18", "time_local": "12:00", "tz_offset": -4.0,
        "lat": -33.4489, "lon": -70.6693,
        "chart_note_es": "Primera Junta Nacional de Gobierno, Santiago (18 de septiembre de 1810).",
        "chart_note_en": "First National Government Junta, Santiago (September 18, 1810).",
    },
    "argentina": {
        "id": "argentina", "name_es": "Argentina", "name_en": "Argentina",
        "date": "1816-07-09", "time_local": "12:00", "tz_offset": -3.0,
        "lat": -26.8241, "lon": -65.2226,
        "chart_note_es": "Declaración de Independencia, Congreso de Tucumán (9 de julio de 1816).",
        "chart_note_en": "Declaration of Independence, Congress of Tucumán (July 9, 1816).",
    },
    "mexico": {
        "id": "mexico", "name_es": "México", "name_en": "Mexico",
        "date": "1821-09-27", "time_local": "12:00", "tz_offset": -6.0,
        "lat": 19.4326, "lon": -99.1332,
        "chart_note_es": "Consumación de la Independencia, entrada del Ejército Trigarante a Ciudad de México (27 de septiembre de 1821).",
        "chart_note_en": "Consummation of Independence, entry of the Army of the Three Guarantees into Mexico City (September 27, 1821).",
    },
    "eeuu": {
        "id": "eeuu", "name_es": "Estados Unidos", "name_en": "United States",
        "date": "1776-07-04", "time_local": "17:10", "tz_offset": -5.0,
        "lat": 39.9526, "lon": -75.1652,
        "chart_note_es": "Declaración de Independencia, Filadelfia (4 de julio de 1776). Hora discutida — tradición Sibly (17:10).",
        "chart_note_en": "Declaration of Independence, Philadelphia (July 4, 1776). Time debated — Sibly tradition (5:10 PM).",
    },
    "espana": {
        "id": "espana", "name_es": "España", "name_en": "Spain",
        "date": "1978-12-29", "time_local": "12:00", "tz_offset": 1.0,
        "lat": 40.4168, "lon": -3.7038,
        "chart_note_es": "Entrada en vigor de la Constitución de 1978, Madrid (29 de diciembre de 1978).",
        "chart_note_en": "Entry into force of the 1978 Constitution, Madrid (December 29, 1978).",
    },
    "francia": {
        "id": "francia", "name_es": "Francia", "name_en": "France",
        "date": "1958-10-05", "time_local": "12:00", "tz_offset": 1.0,
        "lat": 48.8566, "lon": 2.3522,
        "chart_note_es": "Promulgación de la Constitución de la V República, París (5 de octubre de 1958).",
        "chart_note_en": "Promulgation of the Fifth Republic's Constitution, Paris (October 5, 1958).",
    },
    "reino_unido": {
        "id": "reino_unido", "name_es": "Reino Unido", "name_en": "United Kingdom",
        "date": "1801-01-01", "time_local": "00:00", "tz_offset": 0.0,
        "lat": 51.5074, "lon": -0.1278,
        "chart_note_es": "Entrada en vigor del Acta de Unión de Gran Bretaña e Irlanda, Londres (1 de enero de 1801) — carta clásica de Campion.",
        "chart_note_en": "Entry into force of the Act of Union of Great Britain and Ireland, London (January 1, 1801) — a Campion classic.",
    },
    "alemania": {
        "id": "alemania", "name_es": "Alemania", "name_en": "Germany",
        "date": "1990-10-03", "time_local": "00:00", "tz_offset": 1.0,
        "lat": 52.5200, "lon": 13.4050,
        "chart_note_es": "Reunificación alemana, Berlín (3 de octubre de 1990, medianoche).",
        "chart_note_en": "German reunification, Berlin (October 3, 1990, midnight).",
    },
    "italia": {
        "id": "italia", "name_es": "Italia", "name_en": "Italy",
        "date": "1946-06-10", "time_local": "12:00", "tz_offset": 1.0,
        "lat": 41.9028, "lon": 12.4964,
        "chart_note_es": "Proclamación de la República Italiana, Roma (10 de junio de 1946).",
        "chart_note_en": "Proclamation of the Italian Republic, Rome (June 10, 1946).",
    },
    "rusia": {
        "id": "rusia", "name_es": "Rusia", "name_en": "Russia",
        "date": "1991-12-25", "time_local": "12:00", "tz_offset": 3.0,
        "lat": 55.7558, "lon": 37.6173,
        "chart_note_es": "Disolución de la URSS / Federación Rusa, Moscú (25 de diciembre de 1991).",
        "chart_note_en": "Dissolution of the USSR / Russian Federation, Moscow (December 25, 1991).",
    },
    "china": {
        "id": "china", "name_es": "China", "name_en": "China",
        "date": "1949-10-01", "time_local": "15:00", "tz_offset": 8.0,
        "lat": 39.9042, "lon": 116.4074,
        "chart_note_es": "Proclamación de la República Popular China, Pekín (1 de octubre de 1949, 15:00 — hora documentada).",
        "chart_note_en": "Proclamation of the People's Republic of China, Beijing (October 1, 1949, 3:00 PM — documented time).",
    },
    "japon": {
        "id": "japon", "name_es": "Japón", "name_en": "Japan",
        "date": "1952-04-28", "time_local": "12:00", "tz_offset": 9.0,
        "lat": 35.6762, "lon": 139.6503,
        "chart_note_es": "Entrada en vigor del Tratado de San Francisco, Tokio (28 de abril de 1952).",
        "chart_note_en": "Entry into force of the Treaty of San Francisco, Tokyo (April 28, 1952).",
    },
    "india": {
        "id": "india", "name_es": "India", "name_en": "India",
        "date": "1947-08-15", "time_local": "00:00", "tz_offset": 5.5,
        "lat": 28.6139, "lon": 77.2090,
        "chart_note_es": "Independencia de India, Nueva Delhi (15 de agosto de 1947, medianoche — hora célebre).",
        "chart_note_en": "Independence of India, New Delhi (August 15, 1947, midnight — famous hour).",
    },
    "brasil": {
        "id": "brasil", "name_es": "Brasil", "name_en": "Brazil",
        "date": "1822-09-07", "time_local": "12:00", "tz_offset": -3.0,
        "lat": -23.5505, "lon": -46.6333,
        "chart_note_es": "Grito de Ipiranga, São Paulo (7 de septiembre de 1822).",
        "chart_note_en": "Cry of Ipiranga, São Paulo (September 7, 1822).",
    },
    "israel": {
        "id": "israel", "name_es": "Israel", "name_en": "Israel",
        "date": "1948-05-14", "time_local": "12:00", "tz_offset": 2.0,
        "lat": 32.0853, "lon": 34.7818,
        "chart_note_es": "Declaración de independencia, Tel Aviv (14 de mayo de 1948).",
        "chart_note_en": "Declaration of independence, Tel Aviv (May 14, 1948).",
    },
    "ucrania": {
        "id": "ucrania", "name_es": "Ucrania", "name_en": "Ukraine",
        "date": "1991-08-24", "time_local": "12:00", "tz_offset": 2.0,
        "lat": 50.4501, "lon": 30.5234,
        "chart_note_es": "Declaración de independencia, Kiev (24 de agosto de 1991).",
        "chart_note_en": "Declaration of independence, Kyiv (August 24, 1991).",
    },
}

NATIONAL_CHART_IDS: set[str] = set(NATIONAL_CHARTS.keys())

# Cachea las cartas nacionales en memoria: no cambian entre requests.
_national_cache: dict[str, list[dict]] = {}


def compute_national_planets(country_id: str) -> list[dict]:
    """
    Devuelve los 9 cuerpos (Sol → Plutón, sin Luna) de la carta nacional del
    país dado, con el mismo shape que un `PlanetPosition` natal (sin casas
    reales: `house` queda en 0, ver decisión de diseño en el docstring del
    módulo). Cacheado en memoria por país.
    """
    if country_id in _national_cache:
        return _national_cache[country_id]

    chart = NATIONAL_CHARTS.get(country_id)
    if chart is None:
        raise ValueError(f"País desconocido: {country_id}")

    year, month, day = map(int, chart["date"].split("-"))
    hh, mm = map(int, chart["time_local"].split(":"))
    hour_local = hh + mm / 60.0
    hour_ut = hour_local - chart["tz_offset"]

    # Ajusta el día si la hora UT cruza medianoche (mismo patrón que
    # calculate_natal_chart en astro/chart.py).
    if hour_ut < 0 or hour_ut >= 24:
        base = _dt(year, month, day)
        adjusted = base + _td(hours=hour_ut)
        year, month, day = adjusted.year, adjusted.month, adjusted.day
        hour_ut = adjusted.hour + adjusted.minute / 60.0 + adjusted.second / 3600.0

    jd = to_julian_day(year, month, day, hour_ut)

    planets: list[dict] = []
    for name in NATIONAL_BODIES:
        pos = calc_planet_position(jd, PLANET_IDS[name])
        if pos is None:
            continue
        si = longitude_to_sign(pos["longitude"])
        planets.append({
            "name": name,
            "symbol": PLANET_SYMBOLS.get(name, ""),
            "longitude": round(pos["longitude"], 6),
            "sign": si["sign"],
            "sign_symbol": si["sign_symbol"],
            "degree_in_sign": round(si["degree_in_sign"], 4),
            "degree_display": degrees_to_dms(si["degree_in_sign"]),
            "house": 0,  # cartas nacionales: sin casas (ver decisión de diseño arriba)
            "retrograde": pos["retrograde"],
            "speed": round(pos["speed"], 6),
        })

    _national_cache[country_id] = planets
    return planets
