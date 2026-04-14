"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import type { BirthData } from "@/lib/types";

interface Props {
  onSubmit: (data: BirthData) => void;
  loading?: boolean;
}

interface GeoResult {
  display_name: string;
  lat: string;
  lon: string;
  address?: { country_code?: string };
}

// Lookup de estado/provincia → zona IANA para países con múltiples zonas horarias.
// Evita que alguien de Los Ángeles reciba "America/New_York" y su Ascendente
// quede desplazado ~45° por error de zona.
const STATE_TZ: Record<string, string> = {
  // EE.UU.
  "Alabama": "America/Chicago",       "Alaska": "America/Anchorage",
  "Arizona": "America/Phoenix",       "Arkansas": "America/Chicago",
  "California": "America/Los_Angeles","Colorado": "America/Denver",
  "Connecticut": "America/New_York",  "Delaware": "America/New_York",
  "Florida": "America/New_York",      "Georgia": "America/New_York",
  "Hawaii": "Pacific/Honolulu",       "Idaho": "America/Denver",
  "Illinois": "America/Chicago",      "Indiana": "America/Indiana/Indianapolis",
  "Iowa": "America/Chicago",          "Kansas": "America/Chicago",
  "Kentucky": "America/New_York",     "Louisiana": "America/Chicago",
  "Maine": "America/New_York",        "Maryland": "America/New_York",
  "Massachusetts": "America/New_York","Michigan": "America/Detroit",
  "Minnesota": "America/Chicago",     "Mississippi": "America/Chicago",
  "Missouri": "America/Chicago",      "Montana": "America/Denver",
  "Nebraska": "America/Chicago",      "Nevada": "America/Los_Angeles",
  "New Hampshire": "America/New_York","New Jersey": "America/New_York",
  "New Mexico": "America/Denver",     "New York": "America/New_York",
  "North Carolina": "America/New_York","North Dakota": "America/Chicago",
  "Ohio": "America/New_York",         "Oklahoma": "America/Chicago",
  "Oregon": "America/Los_Angeles",    "Pennsylvania": "America/New_York",
  "Rhode Island": "America/New_York", "South Carolina": "America/New_York",
  "South Dakota": "America/Chicago",  "Tennessee": "America/Chicago",
  "Texas": "America/Chicago",         "Utah": "America/Denver",
  "Vermont": "America/New_York",      "Virginia": "America/New_York",
  "Washington": "America/Los_Angeles","West Virginia": "America/New_York",
  "Wisconsin": "America/Chicago",     "Wyoming": "America/Denver",
  // Canadá
  "British Columbia": "America/Vancouver", "Alberta": "America/Edmonton",
  "Saskatchewan": "America/Regina",        "Manitoba": "America/Winnipeg",
  "Ontario": "America/Toronto",            "Quebec": "America/Toronto",
  "New Brunswick": "America/Halifax",      "Nova Scotia": "America/Halifax",
  "Prince Edward Island": "America/Halifax","Newfoundland and Labrador": "America/St_Johns",
  // Australia
  "New South Wales": "Australia/Sydney",   "Victoria": "Australia/Melbourne",
  "Queensland": "Australia/Brisbane",      "South Australia": "Australia/Adelaide",
  "Western Australia": "Australia/Perth",  "Tasmania": "Australia/Hobart",
  "Northern Territory": "Australia/Darwin","Australian Capital Territory": "Australia/Sydney",
  // Brasil
  "São Paulo": "America/Sao_Paulo",     "Rio de Janeiro": "America/Sao_Paulo",
  "Minas Gerais": "America/Sao_Paulo",  "Bahia": "America/Bahia",
  "Rio Grande do Sul": "America/Sao_Paulo","Paraná": "America/Sao_Paulo",
  "Amazonas": "America/Manaus",         "Pará": "America/Belem",
  "Acre": "America/Rio_Branco",         "Mato Grosso": "America/Cuiaba",
  "Mato Grosso do Sul": "America/Campo_Grande",
  // México
  "Sonora": "America/Hermosillo",       "Chihuahua": "America/Chihuahua",
  "Sinaloa": "America/Mazatlan",        "Baja California": "America/Tijuana",
  "Baja California Sur": "America/Mazatlan",
};

// Lookup de zonas IANA por código de país (principales)
const COUNTRY_TZ: Record<string, string> = {
  cl: "America/Santiago",     ar: "America/Argentina/Buenos_Aires",
  pe: "America/Lima",         co: "America/Bogota",
  mx: "America/Mexico_City",  us: "America/New_York",
  gb: "Europe/London",        es: "Europe/Madrid",
  fr: "Europe/Paris",         de: "Europe/Berlin",
  it: "Europe/Rome",          pt: "Europe/Lisbon",
  br: "America/Sao_Paulo",    ve: "America/Caracas",
  bo: "America/La_Paz",       ec: "America/Guayaquil",
  py: "America/Asuncion",     uy: "America/Montevideo",
  gt: "America/Guatemala",    cr: "America/Costa_Rica",
  pa: "America/Panama",       cu: "America/Havana",
  do: "America/Santo_Domingo",pr: "America/Puerto_Rico",
  au: "Australia/Sydney",     nz: "Pacific/Auckland",
  jp: "Asia/Tokyo",           cn: "Asia/Shanghai",
  in: "Asia/Kolkata",         ru: "Europe/Moscow",
  za: "Africa/Johannesburg",  eg: "Africa/Cairo",
  ng: "Africa/Lagos",         ke: "Africa/Nairobi",
  ae: "Asia/Dubai",           sa: "Asia/Riyadh",
  tr: "Europe/Istanbul",      gr: "Europe/Athens",
  pl: "Europe/Warsaw",        nl: "Europe/Amsterdam",
  be: "Europe/Brussels",      ch: "Europe/Zurich",
  at: "Europe/Vienna",        se: "Europe/Stockholm",
  no: "Europe/Oslo",          dk: "Europe/Copenhagen",
  fi: "Europe/Helsinki",      hu: "Europe/Budapest",
  ro: "Europe/Bucharest",     ua: "Europe/Kiev",
  ca: "America/Toronto",
};

/** Dado un nombre IANA y una fecha de nacimiento, obtiene el offset UTC histórico en horas */
function getHistoricalOffset(ianaZone: string, birthDate: string): number | null {
  try {
    const date = new Date(`${birthDate}T12:00:00`);
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: ianaZone,
      timeZoneName: "shortOffset",
    });
    const parts = formatter.formatToParts(date);
    const tzPart = parts.find((p) => p.type === "timeZoneName")?.value ?? "";
    // tzPart tiene forma "GMT-4" o "GMT+5:30"
    const match = tzPart.match(/GMT([+-])(\d+)(?::(\d+))?/);
    if (!match) return null;
    const sign = match[1] === "+" ? 1 : -1;
    const hours = parseInt(match[2], 10);
    const minutes = match[3] ? parseInt(match[3], 10) : 0;
    return sign * (hours + minutes / 60);
  } catch {
    return null;
  }
}

/** Datos de la carta de Einstein para demo */
const DEMO_DATA = {
  name: "Albert Einstein",
  birth_date: "1879-03-14",
  birth_time: "11:30",
  city_search: "Ulm, Alemania",
  latitude: "48.4011",
  longitude: "9.9876",
  timezone_offset: "1",
  ianaZone: "Europe/Berlin",
};

// ── DatePicker custom ─────────────────────────────────────────────────────────

const MONTHS_ES = [
  "Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre",
];

interface DatePickerProps {
  value: string;            // YYYY-MM-DD
  onChange: (v: string) => void;
  maxDate?: Date;
}

function DatePicker({ value, onChange, maxDate }: DatePickerProps) {
  const today = maxDate ?? new Date();
  const parsedDate = value ? new Date(value + "T12:00:00") : null;

  const [mode, setMode] = useState<"day" | "month" | "year">("day");
  const [viewYear, setViewYear]   = useState(parsedDate?.getFullYear() ?? today.getFullYear() - 30);
  const [viewMonth, setViewMonth] = useState(parsedDate?.getMonth() ?? today.getMonth());
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  function formatDisplay(v: string): string {
    if (!v) return "";
    const d = new Date(v + "T12:00:00");
    return `${d.getDate()} ${MONTHS_ES[d.getMonth()].toLowerCase()} ${d.getFullYear()}`;
  }

  // Decade for year picker
  const decadeStart = Math.floor(viewYear / 10) * 10;

  // Build calendar days
  function buildDays(): (number | null)[] {
    const firstDay = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const startOffset = (firstDay + 6) % 7; // Mon-first
    const cells: (number | null)[] = [];
    for (let i = 0; i < startOffset; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    return cells;
  }

  function selectDay(day: number) {
    const mm = String(viewMonth + 1).padStart(2, "0");
    const dd = String(day).padStart(2, "0");
    onChange(`${viewYear}-${mm}-${dd}`);
    setOpen(false);
  }

  function isDisabled(day: number): boolean {
    const d = new Date(viewYear, viewMonth, day);
    return d > today;
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`w-full bg-white border rounded-xl px-4 py-2.5 text-left text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/30 ${
          open ? "border-blue-500" : "border-border hover:border-slate-300"
        } ${value ? "text-slate-900" : "text-slate-400"} font-mono`}
      >
        {value ? formatDisplay(value) : "Selecciona fecha"}
      </button>

      {open && (
        <div className="absolute z-50 mt-1.5 bg-white border border-border rounded-2xl shadow-card-md p-3 w-72">
          {/* Header de navegación */}
          <div className="flex items-center justify-between mb-2 gap-1">
            <button
              type="button"
              onClick={() => {
                if (mode === "day") {
                  const d = new Date(viewYear, viewMonth - 1, 1);
                  setViewYear(d.getFullYear()); setViewMonth(d.getMonth());
                } else if (mode === "month") {
                  setViewYear((y) => y - 1);
                } else {
                  setViewYear((y) => y - 10);
                }
              }}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 text-sm"
            >‹</button>

            <button
              type="button"
              onClick={() => setMode(mode === "day" ? "month" : mode === "month" ? "year" : "year")}
              className="flex-1 text-center text-sm font-semibold text-slate-800 hover:text-blue-600 transition-colors px-2 py-1 rounded-lg hover:bg-slate-50"
            >
              {mode === "day"
                ? `${MONTHS_ES[viewMonth]} ${viewYear}`
                : mode === "month"
                  ? viewYear
                  : `${decadeStart} – ${decadeStart + 9}`}
            </button>

            <button
              type="button"
              onClick={() => {
                if (mode === "day") {
                  const d = new Date(viewYear, viewMonth + 1, 1);
                  setViewYear(d.getFullYear()); setViewMonth(d.getMonth());
                } else if (mode === "month") {
                  setViewYear((y) => y + 1);
                } else {
                  setViewYear((y) => y + 10);
                }
              }}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 text-sm"
            >›</button>
          </div>

          {/* Vista: días */}
          {mode === "day" && (
            <>
              <div className="grid grid-cols-7 mb-1">
                {["Lu","Ma","Mi","Ju","Vi","Sá","Do"].map((d) => (
                  <div key={d} className="text-center text-xs text-slate-400 py-1 font-mono">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-y-0.5">
                {buildDays().map((day, i) => {
                  if (!day) return <div key={`e-${i}`} />;
                  const str = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                  const selected = value === str;
                  const disabled = isDisabled(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      disabled={disabled}
                      onClick={() => selectDay(day)}
                      className={`h-8 w-full rounded-lg text-xs font-mono transition-colors ${
                        selected
                          ? "bg-blue-600 text-white font-semibold"
                          : disabled
                            ? "text-slate-300 cursor-not-allowed"
                            : "text-slate-700 hover:bg-blue-50 hover:text-blue-700"
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {/* Vista: meses */}
          {mode === "month" && (
            <div className="grid grid-cols-3 gap-1">
              {MONTHS_ES.map((m, i) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => { setViewMonth(i); setMode("day"); }}
                  className={`py-2 rounded-xl text-xs font-mono transition-colors ${
                    i === viewMonth
                      ? "bg-blue-600 text-white font-semibold"
                      : "text-slate-700 hover:bg-blue-50 hover:text-blue-700"
                  }`}
                >
                  {m.slice(0, 3)}
                </button>
              ))}
            </div>
          )}

          {/* Vista: años / décadas */}
          {mode === "year" && (
            <div className="grid grid-cols-4 gap-1">
              {Array.from({ length: 12 }, (_, i) => decadeStart - 1 + i).map((y) => (
                <button
                  key={y}
                  type="button"
                  disabled={y > today.getFullYear() || y < 1900}
                  onClick={() => { setViewYear(y); setMode("month"); }}
                  className={`py-2 rounded-xl text-xs font-mono transition-colors ${
                    y === viewYear
                      ? "bg-blue-600 text-white font-semibold"
                      : y > today.getFullYear() || y < 1900
                        ? "text-slate-300 cursor-not-allowed"
                        : "text-slate-700 hover:bg-blue-50 hover:text-blue-700"
                  }`}
                >
                  {y}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── TimePicker ────────────────────────────────────────────────────────────────
// Usa input[type=time] nativo: interfaz del navegador, validación automática,
// funciona en móvil con scroll wheel, devuelve siempre "HH:MM" en 24h.

interface TimePickerProps {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}

function TimePicker({ value, onChange, disabled }: TimePickerProps) {
  return (
    <input
      type="time"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className={`w-full bg-white border rounded-xl px-4 py-2.5 text-sm font-mono text-slate-900
        focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500
        border-border transition-colors disabled:opacity-40 disabled:cursor-not-allowed
        hover:border-slate-300`}
    />
  );
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function BirthDataForm({ onSubmit, loading = false }: Props) {
  const [form, setForm] = useState({
    name:            "",
    birth_date:      "",
    birth_time:      "",
    latitude:        "",
    longitude:       "",
    timezone_offset: "-4",
    city_search:     "",
  });
  const [ianaZone, setIanaZone]     = useState<string | null>(null);
  const [tzLabel, setTzLabel]       = useState<string | null>(null);
  const [timeUnknown, setTimeUnknown] = useState(false);
  const [geoResults, setGeoResults] = useState<GeoResult[]>([]);
  const [geoLoading, setGeoLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [demoToast, setDemoToast]   = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dropdownRef   = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Recalcular offset cuando cambia fecha o zona IANA
  const recalcTz = useCallback((zone: string, date: string) => {
    const offset = getHistoricalOffset(zone, date || "1990-01-01");
    if (offset !== null) {
      setForm((prev) => ({ ...prev, timezone_offset: String(offset) }));
      const sign = offset >= 0 ? "+" : "";
      const hrs = Math.floor(Math.abs(offset));
      const mins = Math.round((Math.abs(offset) - hrs) * 60);
      const label = mins > 0 ? `UTC${sign}${hrs}:${String(mins).padStart(2,"0")}` : `UTC${sign}${hrs}`;
      setTzLabel(`${zone.split("/").pop()?.replace("_"," ")} · ${label}`);
    }
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (name === "birth_date" && ianaZone) recalcTz(ianaZone, value);
  }

  function handleDateChange(v: string) {
    setForm((prev) => ({ ...prev, birth_date: v }));
    if (ianaZone) recalcTz(ianaZone, v);
  }

  function handleTimeChange(v: string) {
    setForm((prev) => ({ ...prev, birth_time: v }));
  }

  function handleCityChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setForm((prev) => ({ ...prev, city_search: value }));
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (value.length < 2) { setGeoResults([]); setShowDropdown(false); return; }

    searchTimeout.current = setTimeout(async () => {
      setGeoLoading(true);
      try {
        // limit=8 para que ciudades pequeñas no queden fuera si hay homónimas más grandes
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(value)}&format=json&limit=8&addressdetails=1`;
        const res = await fetch(url, { headers: { "Accept-Language": "es,en" } });
        const data: GeoResult[] = await res.json();
        setGeoResults(data);
        setShowDropdown(data.length > 0);
      } catch {
        setGeoResults([]);
      } finally {
        setGeoLoading(false);
      }
    }, 400);
  }

  /** Formatea el display_name de Nominatim como "Ciudad · Región · País"
   *  para que sea legible y permita distinguir entre ciudades homónimas. */
  function formatCityLabel(displayName: string): string {
    const parts = displayName.split(",").map((s) => s.trim()).filter(Boolean);
    // Eliminar partes que son solo números (códigos postales)
    const filtered = parts.filter((p) => !/^\d+$/.test(p));
    if (filtered.length === 0) return displayName;
    if (filtered.length === 1) return filtered[0];
    // Mostrar: primera parte (ciudad/barrio), penúltima (estado/departamento), última (país)
    const city    = filtered[0];
    const country = filtered[filtered.length - 1];
    const region  = filtered.length >= 3 ? filtered[filtered.length - 2] : null;
    return region ? `${city} · ${region} · ${country}` : `${city} · ${country}`;
  }

  function selectCity(result: GeoResult) {
    const lat = parseFloat(result.lat).toFixed(4);
    const lon = parseFloat(result.lon).toFixed(4);
    const countryCode = result.address?.country_code ?? "";
    const birthDate = form.birth_date || "1990-01-01";

    // Buscar zona primero por estado/provincia (más preciso para países multi-zona),
    // luego por país como fallback.
    const stateOrProvince =
      (result.address as Record<string, string | undefined>)?.state ??
      (result.address as Record<string, string | undefined>)?.province ??
      "";
    const zone = STATE_TZ[stateOrProvince] ?? COUNTRY_TZ[countryCode] ?? null;

    let newOffset = String(Math.max(-12, Math.min(12, Math.round(parseFloat(result.lon) / 15))));
    let newLabel: string | null = null;

    if (zone) {
      const offset = getHistoricalOffset(zone, birthDate);
      if (offset !== null) {
        newOffset = String(offset);
        const sign = offset >= 0 ? "+" : "";
        const hrs = Math.floor(Math.abs(offset));
        const mins = Math.round((Math.abs(offset) - hrs) * 60);
        const label = mins > 0 ? `UTC${sign}${hrs}:${String(mins).padStart(2,"0")}` : `UTC${sign}${hrs}`;
        newLabel = `${zone.split("/").pop()?.replace("_"," ")} · ${label}`;
      }
      setIanaZone(zone);
    } else {
      setIanaZone(null);
    }

    setForm((prev) => ({
      ...prev,
      city_search:     result.display_name.split(",").slice(0, 2).join(",").trim(),
      latitude:        lat,
      longitude:       lon,
      timezone_offset: newOffset,
    }));
    setTzLabel(newLabel);
    setShowDropdown(false);
  }

  function handleSolarChart() {
    setTimeUnknown(true);
    setForm((prev) => ({ ...prev, birth_time: "12:00" }));
  }

  function loadDemo() {
    setForm({
      name:            DEMO_DATA.name,
      birth_date:      DEMO_DATA.birth_date,
      birth_time:      DEMO_DATA.birth_time,
      latitude:        DEMO_DATA.latitude,
      longitude:       DEMO_DATA.longitude,
      timezone_offset: DEMO_DATA.timezone_offset,
      city_search:     DEMO_DATA.city_search,
    });
    setIanaZone(DEMO_DATA.ianaZone);
    const offset = getHistoricalOffset(DEMO_DATA.ianaZone, DEMO_DATA.birth_date);
    if (offset !== null) {
      const sign = offset >= 0 ? "+" : "";
      setTzLabel(`${DEMO_DATA.ianaZone.split("/").pop()} · UTC${sign}${offset}`);
    }
    setTimeUnknown(false);
    setDemoToast(true);
    setTimeout(() => setDemoToast(false), 2500);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.birth_date || !form.latitude || !form.longitude) return;
    onSubmit({
      name:            form.name,
      birth_date:      form.birth_date,
      birth_time:      form.birth_time || "12:00",
      latitude:        parseFloat(form.latitude),
      longitude:       parseFloat(form.longitude),
      timezone_offset: parseFloat(form.timezone_offset),
    });
  }

  // Validación visual
  const valid = {
    name:    form.name.trim().length > 0,
    date:    !!form.birth_date,
    time:    !!form.birth_time,
    coords:  !!form.latitude && !!form.longitude,
  };
  const allValid = valid.name && valid.date && valid.time && valid.coords;

  function FieldCheck({ ok }: { ok: boolean }) {
    if (!ok) return null;
    return <span className="text-emerald-500 text-xs ml-1.5">✓</span>;
  }

  const labelClass = "block text-xs font-semibold uppercase tracking-widest text-slate-500 mb-1.5";
  const inputClass = `w-full bg-white border border-border rounded-xl px-4 py-2.5 text-sm text-slate-900
    placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500
    transition-colors font-mono hover:border-slate-300`;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Nombre */}
      <div>
        <label className={labelClass}>
          Nombre <FieldCheck ok={valid.name} />
        </label>
        <input
          type="text" name="name" value={form.name} onChange={handleChange}
          placeholder="Tu nombre o apodo" required
          className={inputClass}
        />
      </div>

      {/* Fecha + Hora */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>
            Fecha de nacimiento <FieldCheck ok={valid.date} />
          </label>
          <DatePicker
            value={form.birth_date}
            onChange={handleDateChange}
            maxDate={new Date()}
          />
        </div>
        <div>
          <label className={labelClass}>
            Hora local <FieldCheck ok={valid.time} />
          </label>
          <TimePicker
            value={form.birth_time}
            onChange={handleTimeChange}
            disabled={timeUnknown}
          />
          <button
            type="button"
            onClick={handleSolarChart}
            className="mt-1.5 text-xs text-blue-500 hover:text-blue-700 hover:underline transition-colors"
          >
            No sé la hora → usar 12:00
          </button>
        </div>
      </div>

      {timeUnknown && (
        <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          Sin hora exacta el Ascendente y las Casas serán imprecisos.
        </p>
      )}

      {/* Ciudad */}
      <div className="relative" ref={dropdownRef}>
        <label className={labelClass}>
          Ciudad de nacimiento
          {geoLoading && <span className="ml-2 text-blue-500 animate-pulse font-normal normal-case">buscando…</span>}
        </label>
        <input
          type="text" name="city_search" value={form.city_search}
          onChange={handleCityChange}
          onFocus={() => geoResults.length > 0 && setShowDropdown(true)}
          placeholder="Escribe para buscar y autocompletar coordenadas"
          autoComplete="off"
          className={inputClass}
        />
        {showDropdown && geoResults.length > 0 && (
          <div className="absolute z-10 w-full mt-1.5 bg-white border border-border rounded-xl shadow-card-md overflow-hidden">
            {geoResults.map((r, i) => (
              <button
                key={i} type="button"
                onClick={() => selectCity(r)}
                className="w-full text-left px-4 py-2.5 hover:bg-blue-50 transition-colors border-b border-border last:border-0"
              >
                <span className="text-sm text-slate-700 font-mono block truncate">
                  {formatCityLabel(r.display_name)}
                </span>
              </button>
            ))}
          </div>
        )}
        <p className="mt-1 text-xs text-slate-400 font-mono">
          Si no aparece tu ciudad, añade el país: <span className="italic">Villarrica, Chile</span>
        </p>
      </div>

      {/* Coordenadas */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-slate-400 mb-1 font-mono">Latitud (auto)</label>
          <input
            type="number" name="latitude" value={form.latitude} onChange={handleChange}
            step="0.0001" min="-90" max="90" placeholder="-33.4489" required
            className={inputClass + " text-sm py-2"}
          />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1 font-mono">Longitud (auto)</label>
          <input
            type="number" name="longitude" value={form.longitude} onChange={handleChange}
            step="0.0001" min="-180" max="180" placeholder="-70.6693" required
            className={inputClass + " text-sm py-2"}
          />
        </div>
      </div>

      {/* Zona horaria */}
      <div>
        <label className={labelClass}>Zona horaria al nacer</label>
        {tzLabel ? (
          <div className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-sm">
            <span className="text-emerald-500 text-xs">✓</span>
            <span className="font-mono text-slate-700 text-xs">{tzLabel}</span>
            <button
              type="button"
              onClick={() => setTzLabel(null)}
              className="ml-auto text-xs text-slate-400 hover:text-slate-600"
            >
              ajustar
            </button>
          </div>
        ) : (
          <select
            name="timezone_offset" value={form.timezone_offset} onChange={handleChange}
            className={inputClass}
          >
            {[
              [-12,"UTC-12"],[-11,"UTC-11"],[-10,"UTC-10 (Hawaii)"],[-8,"UTC-8 (Los Ángeles)"],
              [-7,"UTC-7 (Denver)"],[-6,"UTC-6 (Ciudad de México)"],[-5,"UTC-5 (Bogotá / Lima)"],
              [-4,"UTC-4 (Santiago / Caracas)"],[-3,"UTC-3 (Buenos Aires)"],[-2,"UTC-2"],
              [-1,"UTC-1"],[0,"UTC+0 (Londres)"],[1,"UTC+1 (Madrid / París)"],
              [2,"UTC+2 (Atenas)"],[3,"UTC+3 (Moscú)"],[4,"UTC+4 (Dubái)"],
              [5.5,"UTC+5:30 (India)"],[8,"UTC+8 (Pekín)"],[9,"UTC+9 (Tokio)"],[10,"UTC+10 (Sídney)"],[12,"UTC+12"],
            ].map(([v,l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        )}
      </div>

      {/* Submit */}
      <button
        type="submit" disabled={loading || !allValid}
        className={`w-full font-semibold py-3.5 rounded-xl transition-all text-sm flex items-center justify-center gap-2 ${
          allValid
            ? "bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
            : "bg-slate-100 text-slate-400 cursor-not-allowed"
        }`}
      >
        {loading ? (
          <>
            <span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            Calculando carta natal…
          </>
        ) : (
          "Calcular Carta Natal"
        )}
      </button>

      {/* Demo */}
      <div className="text-center pt-1">
        <button
          type="button"
          onClick={loadDemo}
          className="text-xs text-slate-400 hover:text-blue-600 hover:underline transition-colors"
        >
          ¿Solo quieres probar? Usa la carta de Einstein →
        </button>
      </div>

      {/* Toast demo */}
      {demoToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs font-mono px-4 py-2.5 rounded-xl shadow-lg z-50">
          Datos de ejemplo cargados
        </div>
      )}
    </form>
  );
}
