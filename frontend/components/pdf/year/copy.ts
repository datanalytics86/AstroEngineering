/** Bilingual instrument copy. Keep sentences short — the PDF is a tool. */

export function copy(en: boolean) {
  return {
    mastLive: (year: number) =>
      en ? `ASTROENGINE  ·  YEAR MAP  ·  ${year}` : `ASTROENGINE  ·  MAPA DEL AÑO  ·  ${year}`,
    mastSample: (year: number) =>
      en ? `ASTROENGINE  ·  ${year}  ·  SAMPLE` : `ASTROENGINE  ·  ${year}  ·  EJEMPLO`,
    footerMark: en ? "INSTRUMENT — NOT A HOROSCOPE" : "INSTRUMENTO — NO UN HORÓSCOPO",
    kickerCover: en ? "PERSONAL YEAR INSTRUMENT" : "INSTRUMENTO DEL AÑO PERSONAL",
    thesis: en
      ? "Not a horoscope. A laboratory map: climate, the months that weigh, and what each life area asks — written so you can use it."
      : "No es un horóscopo. Un mapa de laboratorio: clima, los meses que pesan y lo que pide cada área — escrito para usarlo.",
    sampleNote: en ? "Sample plate. Your Pro is drawn from your sky." : "Placa de muestra. Tu Pro se traza con tu cielo.",
    holdThese: en ? "Hold these months" : "Estos meses pesan",
    contents: en ? "Plates" : "Placas",
    plates: en
      ? [
          ["02", "Year at a glance"],
          ["03", "Who you are"],
          ["04", "Tone + table"],
          ["05–07", "Twelve month cards"],
          ["08", "Protocol"],
        ]
      : [
          ["02", "El año de un vistazo"],
          ["03", "Quién eres"],
          ["04", "Tono y tabla"],
          ["05–07", "Doce fichas del mes"],
          ["08", "Protocolo"],
        ],
    yearSpine: en ? "Year spine" : "Columna del año",
    holdHow: en ? "How to hold this map" : "Cómo se sostiene este mapa",
    holdSteps: en
      ? [
          "The three months above are the year in twenty seconds.",
          "Plate 02 is the one you pin. The rest you open on the first.",
          "Plate 08 is the log. One box a month. That is Pro, used.",
        ]
      : [
          "Los tres meses de arriba son el año en veinte segundos.",
          "La placa 02 se clava. El resto se abre el día uno.",
          "La placa 08 es el registro. Una casilla al mes. Eso es Pro, usado.",
        ],
    serial: (name: string, year: number) => {
      const initials = name
        .split(/\s+/)
        .filter(Boolean)
        .map((w) => w[0])
        .join("")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toUpperCase()
        .slice(0, 4);
      return `AE  ·  YM  ·  ${year}  ·  ${initials || "MAP"}`;
    },
    glance: en ? "YEAR AT A GLANCE" : "EL AÑO DE UN VISTAZO",
    moves: en ? "Three moves" : "Tres movimientos",
    keyMark: en ? "KEY" : "CLAVE",
    who: en ? "WHO YOU ARE" : "QUIÉN ERES",
    lean: en ? "To lean on" : "En qué apoyarte",
    practice: en ? "To practice" : "Dónde practicar",
    zones: en ? "Life zones" : "Zonas de vida",
    whoUse: en ? "How to use this plate" : "Cómo se usa esta placa",
    whoSteps: en
      ? [
          "This is the baseline. The year sits on it. It does not replace it.",
          "When a month tightens, return to what you lean on.",
          "When a month opens, practice the right-hand plate.",
        ]
      : [
          "Esta es la base. El año se sienta encima. No la reemplaza.",
          "Si el mes aprieta, vuelve a en qué apoyarte.",
          "Si el mes abre, practica la placa de la derecha.",
        ],
    tone: en ? "TONE OF THE YEAR" : "TONO DEL AÑO",
    solarOwn: en ? "This cycle’s opening — life zones" : "Apertura de este ciclo — zonas de vida",
    solarNatal: en
      ? "From your natal sky (solar return not calculated)"
      : "Desde tu cielo natal (sin retorno solar)",
    yearPractice: en ? "One practice" : "Una práctica",
    table: en ? "Operating table" : "Tabla de operación",
    colMonth: en ? "MONTH" : "MES",
    colClimate: en ? "CLIMATE" : "CLIMA",
    colAsk: en ? "WHAT IT ASKS" : "QUÉ PIDE",
    months: (a: string, b: string) =>
      en ? `MONTH INSTRUMENTS  ·  ${a}–${b}` : `FICHAS DEL MES  ·  ${a}–${b}`,
    monthHint: en
      ? "Read the ask. Two areas get a full line. The rest is climate — not homework."
      : "Lee lo que pide. Dos áreas llevan línea completa. El resto es clima — no tarea.",
    protocol: en ? "PROTOCOL" : "PROTOCOLO",
    protocolTitle: en ? "The instrument, used" : "El instrumento, usado",
    protocolLead: en
      ? "This page is the operating manual. Keep it with the glance plate. Return on the first of the month."
      : "Esta página es el manual de operación. Guárdala con el vistazo. Vuelve el día uno de cada mes.",
    howTo: en ? "How to read" : "Cómo se lee",
    ritual: en ? "Each month, on the first" : "Cada mes, el día uno",
    ritualSteps: en
      ? [
          "Open only this month’s card. Do not reread the year.",
          "Do one thing the ask names. Write it down if you must.",
          "Leave the other areas as climate. They are not homework.",
        ]
      : [
          "Abre solo la ficha de este mes. No releas el año.",
          "Haz una cosa que nombra lo que pide. Anótala si hace falta.",
          "Deja el resto como clima. No es tarea.",
        ],
    yearLog: en ? "Year log" : "Registro del año",
    logHint: en
      ? "One box a month. Tick it when you have done the action. That is the instrument, used."
      : "Una casilla al mes. Márcala cuando hayas hecho la acción. Ese es el instrumento, usado.",
    climateKey: en ? "Climate key" : "Clave de clima",
    colophon: en
      ? "Drawn as a laboratory instrument. Precision over prediction. One year, one map, one practice."
      : "Trazado como instrumento de laboratorio. Precisión antes que predicción. Un año, un mapa, una práctica.",
    closeLine: en
      ? "On the first of each month: open only that card. Do one thing it asks. That is the whole instrument."
      : "El día uno de cada mes: abre solo esa ficha. Haz una cosa que pide. Ese es el instrumento entero.",
  };
}
