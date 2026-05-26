"""
Cartas de inicio (inception charts) de mercados y activos financieros.

Tradición astro-financiera: Bill Meridian "Planetary Stock Trading",
W.D. Gann, Grace Morris, Raymond Merriman.
Los horarios exactos son debatidos en la literatura especializada;
se indica en "source" el grado de certeza.

Keys: ASCII minúsculas, sin tildes, para URLs simples.
"""

MARKET_CHARTS: dict[str, dict] = {
    "nyse": {
        "name": "NYSE (Wall Street)",
        "ticker": "NYSE",
        "asset_class": "índice",
        "location": "Nueva York, EEUU",
        "birth_date": "1792-05-17",
        "birth_time": "10:00",   # LMT convencional; horario debatido
        "latitude": 40.7069,
        "longitude": -74.0113,
        "timezone_offset": -4.934,  # LMT = -74.0113° / 15
        "source": "Buttonwood Agreement; tradición astro-financiera (Meridian)",
    },
    "sp500": {
        "name": "S&P 500",
        "ticker": "SPX",
        "asset_class": "índice",
        "location": "Nueva York, EEUU",
        "birth_date": "1957-03-04",
        "birth_time": "10:00",   # apertura de mercado convencional
        "latitude": 40.7069,
        "longitude": -74.0113,
        "timezone_offset": -5.0,  # EST
        "source": "Lanzamiento del índice S&P 500 (tradición astro-financiera)",
    },
    "nasdaq": {
        "name": "NASDAQ",
        "ticker": "COMP",
        "asset_class": "índice",
        "location": "Nueva York, EEUU",
        "birth_date": "1971-02-08",
        "birth_time": "10:00",
        "latitude": 40.7069,
        "longitude": -74.0113,
        "timezone_offset": -5.0,  # EST
        "source": "Fundación del NASDAQ (tradición astro-financiera)",
    },
    "dow": {
        "name": "Dow Jones Industrial",
        "ticker": "DJIA",
        "asset_class": "índice",
        "location": "Nueva York, EEUU",
        "birth_date": "1896-05-26",
        "birth_time": "12:00",   # horario no documentado con precisión
        "latitude": 40.7069,
        "longitude": -74.0113,
        "timezone_offset": -5.0,  # EST convencional
        "source": "Primera publicación del DJIA, 26 may 1896 (Meridian/Gann)",
    },
    "bitcoin": {
        "name": "Bitcoin",
        "ticker": "BTC",
        "asset_class": "cripto",
        "location": "Londres, Reino Unido",
        "birth_date": "2009-01-03",
        "birth_time": "18:15",   # timestamp del bloque génesis (18:15:05 UTC)
        "latitude": 51.5074,
        "longitude": -0.1278,
        "timezone_offset": 0.0,  # UTC
        "source": "Timestamp del bloque génesis de Bitcoin (UTC verificado)",
    },
    "gold": {
        "name": "Oro (COMEX)",
        "ticker": "XAU",
        "asset_class": "materia prima",
        "location": "Nueva York, EEUU",
        "birth_date": "1974-12-31",
        "birth_time": "10:00",
        "latitude": 40.7069,
        "longitude": -74.0113,
        "timezone_offset": -5.0,  # EST
        "source": "Reapertura del comercio de oro en EEUU / inicio COMEX gold",
    },
    "crude": {
        "name": "Petróleo WTI (NYMEX)",
        "ticker": "CL",
        "asset_class": "materia prima",
        "location": "Nueva York, EEUU",
        "birth_date": "1983-03-30",
        "birth_time": "10:00",
        "latitude": 40.7069,
        "longitude": -74.0113,
        "timezone_offset": -5.0,  # EST
        "source": "Inicio de futuros de crudo WTI en NYMEX",
    },
    "eurusd": {
        "name": "EUR/USD",
        "ticker": "EURUSD",
        "asset_class": "divisa",
        "location": "Fráncfort, Alemania",
        "birth_date": "1999-01-01",
        "birth_time": "00:00",
        "latitude": 50.1109,
        "longitude": 8.6821,
        "timezone_offset": 1.0,  # CET
        "source": "Lanzamiento del euro como moneda oficial",
    },
}

MARKET_KEYS = list(MARKET_CHARTS.keys())
