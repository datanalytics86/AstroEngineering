"use client";

import Link from "next/link";
import { DIGNITY_SYMBOL, DIGNITY_COLOR } from "@/lib/zodiac-utils";
import { useT } from "@/lib/i18n";

// ── Data ─────────────────────────────────────────────────────────────────────

const ASPECTS_DATA = [
  {
    id: "conjuncion",
    symbol: "☌",
    name: "Conjunción",
    angle: "0°",
    orb: "±8°",
    nature: "transformador",
    color: "#6366F1",
    description:
      "Las energías de los dos planetas se fusionan e intensifican mutuamente. Es el aspecto de máxima concentración: puede ser poderoso y creativo o abrumador, dependiendo de los planetas involucrados.",
    keyword: "Fusión e intensificación",
    transit_note:
      "En tránsito, la conjunción marca el inicio de un nuevo ciclo entre el planeta transitante y el principio natal activado.",
  },
  {
    id: "oposicion",
    symbol: "☍",
    name: "Oposición",
    angle: "180°",
    orb: "±8°",
    nature: "desafiante",
    color: "#EF4444",
    description:
      "Tensión entre dos principios opuestos que exigen integración consciente. A menudo se manifiesta a través de relaciones o situaciones externas que nos confrontan con nuestra propia sombra.",
    keyword: "Polarización e integración",
    transit_note:
      "En tránsito, la oposición genera conciencia a través del contraste: lo que surge 'afuera' refleja un aspecto interno no integrado.",
  },
  {
    id: "cuadratura",
    symbol: "□",
    name: "Cuadratura",
    angle: "90°",
    orb: "±7°",
    nature: "desafiante",
    color: "#F97316",
    description:
      "Fricción entre dos principios que exige acción. La cuadratura es el motor del crecimiento: sin ella, los talentos permanecen dormidos. El desafío es real pero fructífero si se responde activamente.",
    keyword: "Fricción y acción forzada",
    transit_note:
      "En tránsito, la cuadratura crea presión que obliga a moverse. Ignorarla suele intensificarla.",
  },
  {
    id: "trigono",
    symbol: "△",
    name: "Trígono",
    angle: "120°",
    orb: "±7°",
    nature: "constructivo",
    color: "#10B981",
    description:
      "Fluidez y armonía entre dos principios del mismo elemento. El trígono es el aspecto del talento natural: las energías se apoyan mutuamente sin resistencia. Su riesgo es la complacencia.",
    keyword: "Fluidez y oportunidad",
    transit_note:
      "En tránsito, el trígono abre ventanas de oportunidad que no exigen esfuerzo pero sí iniciativa para aprovecharlas.",
  },
  {
    id: "sextil",
    symbol: "⚹",
    name: "Sextil",
    angle: "60°",
    orb: "±5°",
    nature: "constructivo",
    color: "#3B82F6",
    description:
      "Apoyo y cooperación suaves entre dos principios. El sextil es la oportunidad que requiere ser aprovechada activamente: crea apertura pero no impulso propio.",
    keyword: "Apoyo y oportunidad",
    transit_note:
      "En tránsito, el sextil ofrece una ventana favorable de 2-3 semanas. Requiere iniciativa consciente.",
  },
  {
    id: "quincuncio",
    symbol: "⚻",
    name: "Quincuncio",
    angle: "150°",
    orb: "±3°",
    nature: "menor",
    color: "#A78BFA",
    description:
      "Aspecto menor de ajuste incómodo: dos principios que no comparten elemento ni modalidad y por lo tanto deben adaptarse mutuamente sin lenguaje común. Exige flexibilidad continua.",
    keyword: "Ajuste e incomodidad",
    transit_note:
      "En tránsito, el quincuncio suele señalar la necesidad de ajustar planes, rutinas o expectativas sin solución clara.",
  },
  {
    id: "semisextil",
    symbol: "⚺",
    name: "Semisextil",
    angle: "30°",
    orb: "±2°",
    nature: "menor",
    color: "#94A3B8",
    description:
      "Aspecto menor de leve apoyo entre principios adyacentes. Similar al sextil pero más débil; indica puntos de contacto sutiles que pueden cultivarse con atención.",
    keyword: "Contacto sutil",
    transit_note:
      "En tránsito, el semisextil rara vez produce eventos mayores pero puede señalar pequeñas aperturas.",
  },
];

const PLANETS_DATA = [
  { symbol: "☉", name: "Sol", color: "#F97316", role: "Identidad y voluntad", areas: "identidad, vitalidad, ego, propósito", description: "El Sol representa el núcleo de la personalidad: quién eres en esencia, tu voluntad creativa y tu sentido de propósito. Rige el signo de Leo." },
  { symbol: "☽", name: "Luna", color: "#6366F1", role: "Emociones y hábitos", areas: "emociones, hogar, familia, instintos", description: "La Luna rige el mundo interior: tus respuestas emocionales, hábitos inconscientes, memoria y la forma en que te nutres. Rige el signo de Cáncer." },
  { symbol: "☿", name: "Mercurio", color: "#06B6D4", role: "Mente y comunicación", areas: "comunicación, aprendizaje, contratos, pensamiento", description: "Mercurio gobierna el pensamiento racional, el lenguaje, los contratos y los desplazamientos cortos. Rige Géminis y Virgo." },
  { symbol: "♀", name: "Venus", color: "#EC4899", role: "Valores y relaciones", areas: "amor, dinero, belleza, relaciones", description: "Venus representa lo que aprecias: en el amor, la belleza y las finanzas. Define tu capacidad de atracción y los valores que guían tus elecciones. Rige Tauro y Libra." },
  { symbol: "♂", name: "Marte", color: "#EF4444", role: "Energía y acción", areas: "acción, sexualidad, coraje, conflictos", description: "Marte es el impulso que te mueve: ambición, deseo, valentía y la forma en que enfrentas los obstáculos. Rige Aries y co-rige Escorpio." },
  { symbol: "♃", name: "Júpiter", color: "#10B981", role: "Expansión y optimismo", areas: "expansión, fe, crecimiento, filosofía", description: "Júpiter señala dónde encuentras abundancia, crecimiento y significado. Es el principio de expansión, sabiduría y búsqueda filosófica. Rige Sagitario y co-rige Piscis." },
  { symbol: "♄", name: "Saturno", color: "#64748B", role: "Estructura y limitaciones", areas: "disciplina, madurez, restricciones, karma", description: "Saturno representa las lecciones kármicas, la disciplina y las estructuras que dan forma a la vida. Es donde maduras con esfuerzo. Rige Capricornio y co-rige Acuario." },
  { symbol: "♅", name: "Urano", color: "#0EA5E9", role: "Cambio y libertad", areas: "innovación, libertad, tecnología, revolución", description: "Planeta transpersonal de la revolución y la ruptura. Trae cambios súbitos e inesperados que liberan de estructuras obsoletas. Tarda ~84 años en dar la vuelta al zodíaco. Rige Acuario." },
  { symbol: "♆", name: "Neptuno", color: "#8B5CF6", role: "Espiritualidad e ilusión", areas: "espiritualidad, creatividad, ilusiones, sacrificio", description: "Planeta transpersonal de lo espiritual y lo disolvente. Rige la imaginación, los ideales, la compasión y también las ilusiones y adicciones. Tarda ~165 años. Rige Piscis." },
  { symbol: "♇", name: "Plutón", color: "#7C3AED", role: "Transformación y poder", areas: "transformación, poder, regeneración, secretos", description: "Planeta transpersonal de la transformación radical. Activa procesos de muerte y renacimiento psicológico, poder personal y colectivo. Tarda ~248 años. Rige Escorpio." },
  { symbol: "☊", name: "Nodo Norte", color: "#D97706", role: "Dirección evolutiva", areas: "propósito kármico, crecimiento, destino, aprendizaje", description: "El Nodo Norte (Cabeza del Dragón) señala la dirección de crecimiento del alma en esta vida: el territorio que debe explorarse aunque resulte desafiante." },
  { symbol: "⚷", name: "Quirón", color: "#DC2626", role: "Herida y sanación", areas: "herida, sanación, vulnerabilidad, maestría", description: "Asteroide-centauro que señala la 'herida incurable' del alma: el punto de mayor vulnerabilidad que, trabajado conscientemente, se convierte en el mayor regalo." },
];

const DIGNITIES_DATA = [
  {
    key: "domicilio" as const,
    name: "Domicilio",
    symbol: DIGNITY_SYMBOL["domicilio"],
    color: DIGNITY_COLOR["domicilio"],
    description: "El planeta está en el signo que rige. Expresión natural, fluida y poderosa de sus principios.",
    example: "Sol en Leo, Luna en Cáncer, Marte en Aries",
  },
  {
    key: "exaltación" as const,
    name: "Exaltación",
    symbol: DIGNITY_SYMBOL["exaltación"],
    color: DIGNITY_COLOR["exaltación"],
    description: "El planeta actúa con especial fuerza y claridad, aunque con cierta tendencia al exceso o idealización.",
    example: "Sol en Aries, Luna en Tauro, Júpiter en Cáncer",
  },
  {
    key: "detrimento" as const,
    name: "Detrimento",
    symbol: DIGNITY_SYMBOL["detrimento"],
    color: DIGNITY_COLOR["detrimento"],
    description: "El planeta opera en el signo opuesto a su domicilio. Mayor esfuerzo para expresar sus principios; puede derivar en exceso o compensación.",
    example: "Sol en Acuario, Luna en Capricornio, Marte en Libra",
  },
  {
    key: "caída" as const,
    name: "Caída",
    symbol: DIGNITY_SYMBOL["caída"],
    color: DIGNITY_COLOR["caída"],
    description: "El planeta está en el signo opuesto a su exaltación. Dificultad para expresarse con confianza; exige mayor trabajo interior.",
    example: "Sol en Libra, Luna en Escorpio, Júpiter en Capricornio",
  },
];

const ANGLES_DATA = [
  {
    name: "Ascendente (ASC)",
    symbol: "ASC",
    color: "#2563EB",
    description:
      "El Ascendente es el signo zodiacal que estaba ascendiendo en el horizonte este en el momento del nacimiento. Representa la máscara que mostramos al mundo, el punto de partida de la carta y la perspectiva con que filtramos la realidad. Es el eje de la casa I (yo) y casa VII (tú/otro).",
  },
  {
    name: "Medio Cielo (MC)",
    symbol: "MC",
    color: "#0EA5E9",
    description:
      "El Medio Cielo es el punto más elevado del cielo en el momento del nacimiento. Representa la vocación, la imagen pública y las aspiraciones. Es la cúspide de la casa X (carrera y reputación) y forma parte del eje MC–IC (ambiciones vs. raíces).",
  },
];

const SECTIONS = [
  { id: "aspectos", label: "Aspectos" },
  { id: "retrogradacion", label: "Retrógrados" },
  { id: "dignidades", label: "Dignidades" },
  { id: "planetas", label: "Planetas" },
  { id: "angulos", label: "Ángulos" },
  { id: "orbes", label: "Orbes" },
];

const NATURE_COLORS: Record<string, string> = {
  constructivo: "#10B981",
  desafiante: "#EF4444",
  transformador: "#6366F1",
  menor: "#A78BFA",
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function GlosarioPage() {
  const { t } = useT();

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-4">
          <Link href="/" className="text-sm font-mono text-slate-400 hover:text-blue-600 transition-colors">
            {t("nav.home")}
          </Link>
          <span className="text-slate-300 font-mono">/</span>
          <span className="text-sm font-mono text-slate-600">{t("nav.learn")}</span>
        </div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">{t("glossary.title")}</h1>
        <p className="text-slate-500 leading-relaxed">
          {t("glossary.subtitle")}
        </p>
      </div>

      {/* Index */}
      <nav className="bg-white border border-border rounded-2xl p-5 shadow-card mb-10">
        <p className="text-xs font-mono text-slate-400 uppercase tracking-wide mb-3">{t("glossary.index")}</p>
        <div className="flex flex-wrap gap-2">
          {SECTIONS.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="text-sm font-mono text-slate-600 bg-slate-50 border border-border hover:border-blue-300 hover:text-blue-600 px-3 py-1.5 rounded-lg transition-colors"
            >
              {s.label}
            </a>
          ))}
        </div>
      </nav>

      {/* ── ASPECTOS ── */}
      <section id="aspectos" className="mb-14 scroll-mt-20">
        <h2 className="text-xl font-bold text-slate-900 mb-1">{t("glossary.aspects.title")}</h2>
        <p className="text-sm text-slate-500 mb-6 font-mono">
          {t("glossary.aspects.subtitle")}
        </p>
        <div className="space-y-4">
          {ASPECTS_DATA.map((asp) => (
            <div key={asp.id} className="bg-white border border-border rounded-2xl p-5 shadow-card">
              <div className="flex items-start gap-4">
                <div
                  className="text-2xl w-12 h-12 flex items-center justify-center rounded-xl bg-slate-50 border border-border font-mono shrink-0"
                  style={{ color: asp.color }}
                >
                  {asp.symbol}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center flex-wrap gap-2 mb-2">
                    <h3 className="font-semibold text-slate-800">{asp.name}</h3>
                    <span className="text-xs font-mono text-slate-400 bg-slate-50 border border-border px-2 py-0.5 rounded">
                      {asp.angle} · orbe {asp.orb}
                    </span>
                    <span
                      className="text-xs font-mono px-2 py-0.5 rounded-full border"
                      style={{ color: NATURE_COLORS[asp.nature] ?? "#94A3B8", borderColor: NATURE_COLORS[asp.nature] ?? "#E5E9F0", backgroundColor: (NATURE_COLORS[asp.nature] ?? "#94A3B8") + "10" }}
                    >
                      {asp.nature}
                    </span>
                  </div>
                  <p className="text-xs font-mono text-blue-600 mb-2">{asp.keyword}</p>
                  <p className="text-sm text-slate-600 leading-relaxed mb-2">{asp.description}</p>
                  <p className="text-xs text-slate-400 italic leading-relaxed">{asp.transit_note}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── RETROGRADACIÓN ── */}
      <section id="retrogradacion" className="mb-14 scroll-mt-20">
        <h2 className="text-xl font-bold text-slate-900 mb-1">{t("glossary.retro.title")}</h2>
        <p className="text-sm text-slate-500 mb-6 font-mono">
          {t("glossary.retro.subtitle")}
        </p>
        <div className="bg-white border border-border rounded-2xl p-6 shadow-card space-y-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl font-mono text-red-500">℞</span>
            <div>
              <p className="font-semibold text-slate-800">¿Qué es la retrogradación?</p>
              <p className="text-xs text-slate-400 font-mono">Todos los planetas excepto Sol y Luna retrogradán</p>
            </div>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">
            Cuando un planeta aparece retrógrado (℞) en la carta, no se mueve hacia atrás de verdad:
            es una ilusión óptica causada por la diferencia de velocidades entre la Tierra y el planeta
            en sus órbitas alrededor del Sol. Astrológicamente, se interpreta como una energía más
            internalizada, reflexiva o con expresión atípica.
          </p>
          <div className="bg-slate-50 border border-border rounded-xl p-4">
            <p className="text-xs font-mono text-slate-500 uppercase tracking-wide mb-2">
              Implicación en tránsitos: el triple aspecto
            </p>
            <p className="text-sm text-slate-600 leading-relaxed">
              Un planeta retrógrado puede activar el mismo aspecto hasta tres veces seguidas:
              primero en movimiento directo (avanzando), luego retrógrado (retrocediendo sobre el mismo grado)
              y finalmente directo de nuevo. Este patrón se llama <span className="font-semibold text-slate-800">triple aspecto</span> y
              es especialmente significativo porque el tema del tránsito se procesa en varias capas durante meses.
            </p>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
            <span className="text-red-500 font-mono text-sm shrink-0 mt-0.5">↺</span>
            <p className="text-sm text-red-700 leading-relaxed">
              En la rueda de tránsitos, los planetas retrógrados se muestran con un{" "}
              <span className="font-semibold">anillo rojo</span> y el símbolo ℞.
              El símbolo ↺ indica que el planeta está actualmente retrógrado.
            </p>
          </div>
        </div>
      </section>

      {/* ── DIGNIDADES ── */}
      <section id="dignidades" className="mb-14 scroll-mt-20">
        <h2 className="text-xl font-bold text-slate-900 mb-1">{t("glossary.dignities.title")}</h2>
        <p className="text-sm text-slate-500 mb-6 font-mono">
          {t("glossary.dignities.subtitle")}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {DIGNITIES_DATA.map((d) => (
            <div key={d.key} className="bg-white border border-border rounded-2xl p-5 shadow-card">
              <div className="flex items-center gap-3 mb-3">
                <span
                  className="text-xl w-10 h-10 flex items-center justify-center rounded-xl border font-mono"
                  style={{ color: d.color, borderColor: d.color + "40", backgroundColor: d.color + "10" }}
                >
                  {d.symbol}
                </span>
                <p className="font-semibold text-slate-800">{d.name}</p>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed mb-3">{d.description}</p>
              <p className="text-xs text-slate-400 font-mono italic">{d.example}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── PLANETAS ── */}
      <section id="planetas" className="mb-14 scroll-mt-20">
        <h2 className="text-xl font-bold text-slate-900 mb-1">{t("glossary.planets.title")}</h2>
        <p className="text-sm text-slate-500 mb-6 font-mono">
          {t("glossary.planets.subtitle")}
        </p>
        <div className="space-y-3">
          {PLANETS_DATA.map((p) => (
            <div key={p.name} className="bg-white border border-border rounded-2xl p-5 shadow-card">
              <div className="flex items-start gap-4">
                <span
                  className="text-2xl w-12 h-12 flex items-center justify-center rounded-xl bg-slate-50 border border-border font-mono shrink-0"
                  style={{ color: p.color }}
                >
                  {p.symbol}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center flex-wrap gap-2 mb-1">
                    <h3 className="font-semibold text-slate-800">{p.name}</h3>
                    <span className="text-xs font-mono text-slate-400">{p.role}</span>
                  </div>
                  <p className="text-xs font-mono text-blue-600 mb-2">{p.areas}</p>
                  <p className="text-sm text-slate-600 leading-relaxed">{p.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── ÁNGULOS ── */}
      <section id="angulos" className="mb-14 scroll-mt-20">
        <h2 className="text-xl font-bold text-slate-900 mb-1">{t("glossary.angles.title")}</h2>
        <p className="text-sm text-slate-500 mb-6 font-mono">
          {t("glossary.angles.subtitle")}
        </p>
        <div className="space-y-4">
          {ANGLES_DATA.map((a) => (
            <div key={a.name} className="bg-white border border-border rounded-2xl p-5 shadow-card">
              <div className="flex items-center gap-3 mb-3">
                <span
                  className="text-sm font-mono font-bold w-12 h-12 flex items-center justify-center rounded-xl border"
                  style={{ color: a.color, borderColor: a.color + "40", backgroundColor: a.color + "10" }}
                >
                  {a.symbol}
                </span>
                <h3 className="font-semibold text-slate-800">{a.name}</h3>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">{a.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── ORBES ── */}
      <section id="orbes" className="mb-14 scroll-mt-20">
        <h2 className="text-xl font-bold text-slate-900 mb-1">{t("glossary.orbs.title")}</h2>
        <p className="text-sm text-slate-500 mb-6 font-mono">
          {t("glossary.orbs.subtitle")}
        </p>
        <div className="bg-white border border-border rounded-2xl p-6 shadow-card space-y-4">
          <p className="text-sm text-slate-600 leading-relaxed">
            Un <span className="font-semibold text-slate-800">orbe</span> es el margen de tolerancia
            alrededor del ángulo exacto de un aspecto. Si Júpiter está a 123° de tu Sol natal
            (trígono exacto = 120°), el orbe es de 3°: el aspecto existe y actúa aunque no sea perfecto.
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 border border-border rounded-xl p-4">
              <p className="text-xs font-mono text-slate-500 uppercase tracking-wide mb-2">Aspectos natales</p>
              <div className="space-y-1 text-xs font-mono text-slate-700">
                <div className="flex justify-between"><span>Conjunción / Oposición</span><span>±8°</span></div>
                <div className="flex justify-between"><span>Cuadratura / Trígono</span><span>±7°</span></div>
                <div className="flex justify-between"><span>Sextil</span><span>±5°</span></div>
                <div className="flex justify-between"><span>Quincuncio / menores</span><span>±2-3°</span></div>
              </div>
            </div>
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
              <p className="text-xs font-mono text-blue-600 uppercase tracking-wide mb-2">Tránsitos (más estrictos)</p>
              <div className="space-y-1 text-xs font-mono text-blue-700">
                <div className="flex justify-between"><span>Conjunción / Oposición</span><span>±5°</span></div>
                <div className="flex justify-between"><span>Cuadratura / Trígono</span><span>±4°</span></div>
                <div className="flex justify-between"><span>Sextil</span><span>±3°</span></div>
                <div className="flex justify-between"><span>Menores</span><span>±2°</span></div>
              </div>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <p className="text-xs font-mono text-amber-700 uppercase tracking-wide mb-2">
              Aspecto natal vs. aspecto de tránsito
            </p>
            <p className="text-sm text-amber-800 leading-relaxed">
              Un <span className="font-semibold">aspecto natal</span> es permanente: define una
              dinámica estructural de tu psicología. Un <span className="font-semibold">aspecto de tránsito</span> es
              temporal: un planeta en el cielo actual activa ese punto natal durante días, semanas o
              (para planetas lentos) meses o años. Los orbes de tránsito son más estrictos porque
              el planeta se mueve y la activación es más focalizada.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <div className="text-center pt-8 border-t border-border">
        <button
          onClick={() => window.history.back()}
          className="text-sm font-mono text-slate-400 hover:text-blue-600 transition-colors mr-6"
        >
          {t("glossary.back")}
        </button>
        <Link
          href="/nueva"
          className="bg-blue-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors"
        >
          {t("glossary.cta")}
        </Link>
      </div>
    </div>
  );
}
