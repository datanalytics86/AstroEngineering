"use client";

import { useState } from "react";
import type { BirthData } from "@/lib/types";

interface Props {
  onSubmit: (data: BirthData) => void;
  loading?: boolean;
}

const COMMON_TIMEZONES = [
  { label: "UTC-12", value: -12 }, { label: "UTC-11", value: -11 },
  { label: "UTC-10 (Hawaii)", value: -10 }, { label: "UTC-8 (LA/Vancouver)", value: -8 },
  { label: "UTC-7 (Denver/Phoenix)", value: -7 }, { label: "UTC-6 (Ciudad de México)", value: -6 },
  { label: "UTC-5 (Bogotá/Lima)", value: -5 }, { label: "UTC-4 (Santiago/Caracas)", value: -4 },
  { label: "UTC-3 (Buenos Aires/São Paulo)", value: -3 },
  { label: "UTC+0 (Londres)", value: 0 }, { label: "UTC+1 (Madrid/París)", value: 1 },
  { label: "UTC+2 (Atenas/El Cairo)", value: 2 }, { label: "UTC+3 (Moscú/Nairobi)", value: 3 },
  { label: "UTC+5:30 (India)", value: 5.5 }, { label: "UTC+8 (Pekín/Singapur)", value: 8 },
  { label: "UTC+9 (Tokio)", value: 9 }, { label: "UTC+10 (Sídney)", value: 10 },
  { label: "UTC+12", value: 12 },
];

export default function BirthDataForm({ onSubmit, loading = false }: Props) {
  const [form, setForm] = useState({
    name: "",
    birth_date: "",
    birth_time: "",
    latitude: "",
    longitude: "",
    timezone_offset: "-4",
    city_search: "",
  });

  const [timeUnknown, setTimeUnknown] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleSolarChart() {
    setTimeUnknown(true);
    setForm((prev) => ({ ...prev, birth_time: "12:00" }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.birth_date || !form.latitude || !form.longitude) return;

    onSubmit({
      name: form.name,
      birth_date: form.birth_date,
      birth_time: form.birth_time || "12:00",
      latitude: parseFloat(form.latitude),
      longitude: parseFloat(form.longitude),
      timezone_offset: parseFloat(form.timezone_offset),
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Nombre */}
      <div>
        <label className="block text-xs uppercase tracking-widest text-gray-500 mb-1">
          Nombre
        </label>
        <input
          type="text"
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="Tu nombre o apodo"
          required
          className="w-full bg-space-card border border-space-border rounded-lg px-4 py-3 text-gray-100 placeholder-gray-600 focus:outline-none focus:border-gold transition-colors font-mono"
        />
      </div>

      {/* Fecha */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs uppercase tracking-widest text-gray-500 mb-1">
            Fecha de nacimiento
          </label>
          <input
            type="date"
            name="birth_date"
            value={form.birth_date}
            onChange={handleChange}
            required
            className="w-full bg-space-card border border-space-border rounded-lg px-4 py-3 text-gray-100 focus:outline-none focus:border-gold transition-colors font-mono"
          />
        </div>

        <div>
          <label className="block text-xs uppercase tracking-widest text-gray-500 mb-1">
            Hora de nacimiento
          </label>
          <input
            type="time"
            name="birth_time"
            value={form.birth_time}
            onChange={handleChange}
            disabled={timeUnknown}
            className="w-full bg-space-card border border-space-border rounded-lg px-4 py-3 text-gray-100 focus:outline-none focus:border-gold transition-colors font-mono disabled:opacity-40"
          />
          <button
            type="button"
            onClick={handleSolarChart}
            className="mt-1 text-xs text-gold hover:underline"
          >
            No sé mi hora exacta → usar carta solar (12:00)
          </button>
        </div>
      </div>

      {/* Ciudad / Coordenadas */}
      <div>
        <label className="block text-xs uppercase tracking-widest text-gray-500 mb-1">
          Lugar de nacimiento
        </label>
        <input
          type="text"
          name="city_search"
          value={form.city_search}
          onChange={handleChange}
          placeholder="Ciudad (ingresa las coordenadas manualmente abajo)"
          className="w-full bg-space-card border border-space-border rounded-lg px-4 py-3 text-gray-100 placeholder-gray-600 focus:outline-none focus:border-gold transition-colors font-mono mb-3"
        />
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-600 mb-1">Latitud</label>
            <input
              type="number"
              name="latitude"
              value={form.latitude}
              onChange={handleChange}
              step="0.0001"
              min="-90"
              max="90"
              placeholder="-33.4489"
              required
              className="w-full bg-space-card border border-space-border rounded-lg px-4 py-2 text-gray-100 placeholder-gray-600 focus:outline-none focus:border-gold transition-colors font-mono text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Longitud</label>
            <input
              type="number"
              name="longitude"
              value={form.longitude}
              onChange={handleChange}
              step="0.0001"
              min="-180"
              max="180"
              placeholder="-70.6693"
              required
              className="w-full bg-space-card border border-space-border rounded-lg px-4 py-2 text-gray-100 placeholder-gray-600 focus:outline-none focus:border-gold transition-colors font-mono text-sm"
            />
          </div>
        </div>
      </div>

      {/* Zona horaria */}
      <div>
        <label className="block text-xs uppercase tracking-widest text-gray-500 mb-1">
          Zona horaria al nacer
        </label>
        <select
          name="timezone_offset"
          value={form.timezone_offset}
          onChange={handleChange}
          className="w-full bg-space-card border border-space-border rounded-lg px-4 py-3 text-gray-100 focus:outline-none focus:border-gold transition-colors font-mono"
        >
          {COMMON_TIMEZONES.map((tz) => (
            <option key={tz.value} value={tz.value}>
              {tz.label}
            </option>
          ))}
        </select>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-gold text-space-bg font-semibold py-4 rounded-lg hover:bg-yellow-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-mono tracking-wider uppercase text-sm"
      >
        {loading ? "Calculando carta natal…" : "✦ Calcular Carta Natal"}
      </button>

      {timeUnknown && (
        <p className="text-xs text-yellow-600 text-center">
          Sin hora exacta: se usará mediodía solar. Las casas y el Ascendente no serán precisos.
        </p>
      )}
    </form>
  );
}
