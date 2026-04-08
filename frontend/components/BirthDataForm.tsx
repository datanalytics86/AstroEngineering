"use client";

import { useState, useRef, useEffect } from "react";
import type { BirthData } from "@/lib/types";

interface Props {
  onSubmit: (data: BirthData) => void;
  loading?: boolean;
}

interface GeoResult {
  display_name: string;
  lat: string;
  lon: string;
}

const COMMON_TIMEZONES = [
  { label: "UTC-12",                    value: -12 },
  { label: "UTC-11",                    value: -11 },
  { label: "UTC-10 (Hawaii)",           value: -10 },
  { label: "UTC-8 (Los Ángeles)",       value: -8  },
  { label: "UTC-7 (Denver / Phoenix)",  value: -7  },
  { label: "UTC-6 (Ciudad de México)",  value: -6  },
  { label: "UTC-5 (Bogotá / Lima)",     value: -5  },
  { label: "UTC-4 (Santiago / Caracas)",value: -4  },
  { label: "UTC-3 (Buenos Aires)",      value: -3  },
  { label: "UTC-2",                     value: -2  },
  { label: "UTC-1",                     value: -1  },
  { label: "UTC+0 (Londres)",           value:  0  },
  { label: "UTC+1 (Madrid / París)",    value:  1  },
  { label: "UTC+2 (Atenas / El Cairo)", value:  2  },
  { label: "UTC+3 (Moscú / Nairobi)",   value:  3  },
  { label: "UTC+4 (Dubái)",             value:  4  },
  { label: "UTC+5:30 (India)",          value:  5.5},
  { label: "UTC+8 (Pekín / Singapur)", value:  8  },
  { label: "UTC+9 (Tokio / Seúl)",     value:  9  },
  { label: "UTC+10 (Sídney)",          value: 10  },
  { label: "UTC+12",                   value: 12  },
];

export default function BirthDataForm({ onSubmit, loading = false }: Props) {
  const [form, setForm] = useState({
    name:             "",
    birth_date:       "",
    birth_time:       "",
    latitude:         "",
    longitude:        "",
    timezone_offset:  "-4",
    city_search:      "",
  });

  const [timeUnknown, setTimeUnknown] = useState(false);
  const [geoResults, setGeoResults]   = useState<GeoResult[]>([]);
  const [geoLoading, setGeoLoading]   = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
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

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleCityChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setForm((prev) => ({ ...prev, city_search: value }));

    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (value.length < 2) { setGeoResults([]); setShowDropdown(false); return; }

    searchTimeout.current = setTimeout(async () => {
      setGeoLoading(true);
      try {
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(value)}&format=json&limit=5&addressdetails=0`;
        const res = await fetch(url, {
          headers: { "Accept-Language": "es,en" }
        });
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

  function selectCity(result: GeoResult) {
    const lat = parseFloat(result.lat).toFixed(4);
    const lon = parseFloat(result.lon).toFixed(4);

    // Estimación de offset UTC a partir de longitud (cada 15° = 1 hora)
    const estimatedOffset = Math.round(parseFloat(result.lon) / 15);
    const clampedOffset = Math.max(-12, Math.min(12, estimatedOffset));

    setForm((prev) => ({
      ...prev,
      city_search: result.display_name.split(",").slice(0, 2).join(","),
      latitude:  lat,
      longitude: lon,
      timezone_offset: String(clampedOffset),
    }));
    setShowDropdown(false);
  }

  function handleSolarChart() {
    setTimeUnknown(true);
    setForm((prev) => ({ ...prev, birth_time: "12:00" }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.birth_date || !form.latitude || !form.longitude) return;
    onSubmit({
      name:             form.name,
      birth_date:       form.birth_date,
      birth_time:       form.birth_time || "12:00",
      latitude:         parseFloat(form.latitude),
      longitude:        parseFloat(form.longitude),
      timezone_offset:  parseFloat(form.timezone_offset),
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Nombre */}
      <div>
        <label className="block text-xs uppercase tracking-widest text-gray-500 mb-1">Nombre</label>
        <input
          type="text" name="name" value={form.name} onChange={handleChange}
          placeholder="Tu nombre o apodo" required
          className="w-full bg-space-bg border border-space-border rounded-lg px-4 py-3 text-gray-100 placeholder-gray-600 focus:outline-none focus:border-gold transition-colors font-mono"
        />
      </div>

      {/* Fecha + Hora */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs uppercase tracking-widest text-gray-500 mb-1">Fecha</label>
          <input
            type="date" name="birth_date" value={form.birth_date} onChange={handleChange} required
            className="w-full bg-space-bg border border-space-border rounded-lg px-4 py-3 text-gray-100 focus:outline-none focus:border-gold transition-colors font-mono"
          />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-widest text-gray-500 mb-1">Hora local</label>
          <input
            type="time" name="birth_time" value={form.birth_time} onChange={handleChange}
            disabled={timeUnknown}
            className="w-full bg-space-bg border border-space-border rounded-lg px-4 py-3 text-gray-100 focus:outline-none focus:border-gold transition-colors font-mono disabled:opacity-40"
          />
          <button type="button" onClick={handleSolarChart} className="mt-1 text-xs text-gold hover:underline">
            No sé la hora → carta solar (12:00)
          </button>
        </div>
      </div>

      {/* Búsqueda de ciudad */}
      <div className="relative" ref={dropdownRef}>
        <label className="block text-xs uppercase tracking-widest text-gray-500 mb-1">
          Ciudad de nacimiento
          {geoLoading && <span className="ml-2 text-gold animate-pulse">buscando…</span>}
        </label>
        <input
          type="text" name="city_search" value={form.city_search}
          onChange={handleCityChange}
          onFocus={() => geoResults.length > 0 && setShowDropdown(true)}
          placeholder="Escribe la ciudad para autocompletar coordenadas"
          autoComplete="off"
          className="w-full bg-space-bg border border-space-border rounded-lg px-4 py-3 text-gray-100 placeholder-gray-600 focus:outline-none focus:border-gold transition-colors font-mono"
        />

        {/* Dropdown de resultados */}
        {showDropdown && geoResults.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-space-card border border-space-border rounded-lg shadow-xl overflow-hidden">
            {geoResults.map((r, i) => (
              <button
                key={i} type="button"
                onClick={() => selectCity(r)}
                className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-gold/10 hover:text-gold transition-colors border-b border-space-border last:border-0 font-mono truncate"
              >
                {r.display_name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Coordenadas */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-gray-600 mb-1">Latitud <span className="text-gray-700">(auto desde ciudad)</span></label>
          <input
            type="number" name="latitude" value={form.latitude} onChange={handleChange}
            step="0.0001" min="-90" max="90" placeholder="-33.4489" required
            className="w-full bg-space-bg border border-space-border rounded-lg px-4 py-2.5 text-gray-100 placeholder-gray-600 focus:outline-none focus:border-gold transition-colors font-mono text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">Longitud <span className="text-gray-700">(auto desde ciudad)</span></label>
          <input
            type="number" name="longitude" value={form.longitude} onChange={handleChange}
            step="0.0001" min="-180" max="180" placeholder="-70.6693" required
            className="w-full bg-space-bg border border-space-border rounded-lg px-4 py-2.5 text-gray-100 placeholder-gray-600 focus:outline-none focus:border-gold transition-colors font-mono text-sm"
          />
        </div>
      </div>

      {/* Zona horaria */}
      <div>
        <label className="block text-xs uppercase tracking-widest text-gray-500 mb-1">
          Zona horaria al nacer
          <span className="ml-2 text-gray-600 normal-case">(se estima desde la ciudad)</span>
        </label>
        <select
          name="timezone_offset" value={form.timezone_offset} onChange={handleChange}
          className="w-full bg-space-bg border border-space-border rounded-lg px-4 py-3 text-gray-100 focus:outline-none focus:border-gold transition-colors font-mono"
        >
          {COMMON_TIMEZONES.map((tz) => (
            <option key={tz.value} value={tz.value}>{tz.label}</option>
          ))}
        </select>
      </div>

      {/* Submit */}
      <button
        type="submit" disabled={loading}
        className="w-full bg-gold text-space-bg font-semibold py-4 rounded-lg hover:bg-yellow-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-mono tracking-wider uppercase text-sm flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <span className="inline-block w-4 h-4 border-2 border-space-bg border-t-transparent rounded-full animate-spin" />
            Calculando carta natal…
          </>
        ) : (
          "✦ Calcular Carta Natal"
        )}
      </button>

      {timeUnknown && (
        <p className="text-xs text-yellow-600 text-center">
          Sin hora exacta: casas y Ascendente no serán precisos.
        </p>
      )}
    </form>
  );
}
