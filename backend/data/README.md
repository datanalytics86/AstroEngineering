# Places (GeoNames)

`places.tsv.gz` alimenta `GET /api/places`.

- **Licencia:** [GeoNames](https://www.geonames.org/) Creative Commons Attribution 4.0.
- **Fuente:** extracto de `cities5000` + `countryInfo` + `admin1CodesASCII`.
- **Regenerar:** `python backend/scripts/build_places.py`
- **Build de esta oleada:** 2026-10-05, `cities5000` GeoNames, ~69 767 filas, CC BY 4.0.
- **Formato:** TSV gzip, columnas `id name ascii alts admin1 cc country_es country_en lat lon tz pop`.
- Si Punta Arenas no entra en `cities5000` (umbral 5 000), el script de semilla la incluye; AD-06 permite bajar el umbral solo para CL.

Atribución visible en `NOTICE` y en `/privacidad`.
