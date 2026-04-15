"""
Cartas nacionales canónicas para astrología mundial (mundana).

Fuentes principales:
  - Campion, N. (1995). The Book of World Horoscopes. Cinnabar Books.
  - Baigent, M., Campion, N. & Harvey, C. (1984). Mundane Astrology. Aquarian Press.
  - Tarnas, R. (2006). Cosmos and Psyche. Viking.

Todos los datos de hora/TZ se expresan en hora LOCAL al momento histórico.
El backend convierte a UT usando timezone_offset antes de llamar a swe.julday().
"""

# Keys deben ser strings ASCII minúsculas (sin tildes) para URLs sencillas.
NATIONAL_CHARTS: dict[str, dict] = {
    "usa": {
        "name": "Estados Unidos",
        "location": "Philadelphia, Pennsylvania",
        "birth_date": "1776-07-04",
        # Carta Sibly (17:10 LMT). La más usada internacionalmente.
        # Campion #370, pp. 363-367.
        "birth_time": "17:10",
        "latitude": 39.9526,
        "longitude": -75.1652,
        # LMT Philadelphia = -75.1652° / 15 ≈ -5.011 h → 5h0m41s
        "timezone_offset": -5.011,
        "source": "Sibly (1787); Campion #370",
    },
    "chile": {
        "name": "Chile",
        "location": "Santiago, Chile",
        "birth_date": "1810-09-18",
        # Primera Junta de Gobierno. Campion #74 sugiere mediodía LMT.
        "birth_time": "10:00",
        "latitude": -33.4489,
        "longitude": -70.6693,
        # LMT Santiago = -70.6693° / 15 ≈ -4.711 h
        "timezone_offset": -4.711,
        "source": "Campion #74",
    },
    "uk": {
        "name": "Reino Unido",
        "location": "Londres, Reino Unido",
        "birth_date": "1801-01-01",
        # Acta de Unión (Gran Bretaña + Irlanda). Medianoche LMT Londres.
        # Campion #369, pp. 357-362.
        "birth_time": "00:00",
        "latitude": 51.5074,
        "longitude": -0.1278,
        # LMT Londres ≈ 0 (−0.128°/15 ≈ −0.009 h)
        "timezone_offset": -0.009,
        "source": "Campion #369",
    },
    "eu": {
        "name": "Unión Europea",
        "location": "Bruselas, Bélgica",
        "birth_date": "1993-11-01",
        # Tratado de Maastricht en vigor: 1993-11-01 00:00 CET.
        "birth_time": "00:00",
        "latitude": 50.8503,
        "longitude": 4.3517,
        "timezone_offset": 1.0,  # CET
        "source": "Tratado de Maastricht; Campion",
    },
    "germany": {
        "name": "Alemania (Reunificación)",
        "location": "Berlín, Alemania",
        "birth_date": "1990-10-03",
        # Reunificación oficial: 00:00 CEST.
        "birth_time": "00:00",
        "latitude": 52.5200,
        "longitude": 13.4050,
        "timezone_offset": 2.0,  # CEST
        "source": "Campion #153",
    },
    "france": {
        "name": "Francia (V República)",
        "location": "París, Francia",
        "birth_date": "1958-10-05",
        # Promulgación de la Constitución de la V República.
        "birth_time": "00:00",
        "latitude": 48.8566,
        "longitude": 2.3522,
        "timezone_offset": 1.0,  # CET
        "source": "Campion #139",
    },
    "china": {
        "name": "República Popular China",
        "location": "Pekín, China",
        "birth_date": "1949-10-01",
        # Proclamación en Tiananmen: 15:00 CST (Campion #68, pp. 68-72).
        "birth_time": "15:00",
        "latitude": 39.9042,
        "longitude": 116.4074,
        "timezone_offset": 8.0,  # CST
        "source": "Campion #68",
    },
    "russia": {
        "name": "Federación Rusa",
        "location": "Viskuli, Bielorrusia",
        "birth_date": "1991-12-08",
        # Firma de los Acuerdos de Belavezha: se estima 17:45 MSK.
        "birth_time": "17:45",
        "latitude": 53.6884,
        "longitude": 23.8258,
        "timezone_offset": 3.0,  # MSK
        "source": "Campion (Acuerdos de Belavezha)",
    },
}

COUNTRY_KEYS = list(NATIONAL_CHARTS.keys())
