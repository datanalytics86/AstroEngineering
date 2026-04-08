"use client";

import { useEffect, useRef } from "react";
import * as d3 from "d3";
import type { PlanetPosition, HouseCusp, AnglePoint, Aspect } from "@/lib/types";
import { signColor, ASPECT_COLORS } from "@/lib/zodiac-utils";

interface Props {
  planets: PlanetPosition[];
  houses: HouseCusp[];
  ascendant: AnglePoint;
  aspects: Aspect[];
  transitPlanets?: PlanetPosition[];
  highlightedPlanet?: string;
  onPlanetClick?: (name: string) => void;
  width?: number;
}

const SIGN_NAMES_SHORT = [
  "♈", "♉", "♊", "♋", "♌", "♍", "♎", "♏", "♐", "♑", "♒", "♓",
];
const SIGN_FULL = [
  "Aries", "Tauro", "Géminis", "Cáncer", "Leo", "Virgo",
  "Libra", "Escorpio", "Sagitario", "Capricornio", "Acuario", "Piscis",
];

export default function ChartWheel({
  planets,
  houses,
  ascendant,
  aspects,
  transitPlanets,
  highlightedPlanet,
  onPlanetClick,
  width = 600,
}: Props) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !planets.length) return;
    drawChart();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planets, houses, aspects, transitPlanets, highlightedPlanet, width]);

  function drawChart() {
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const cx = width / 2;
    const cy = width / 2;

    // Radio de los anillos
    const R_ZODIAC_OUT = cx * 0.98;  // borde exterior del zodíaco
    const R_ZODIAC_IN  = cx * 0.80;  // borde interior del zodíaco
    const R_TRANSIT    = cx * 0.75;  // anillo de tránsitos
    const R_NATAL      = cx * 0.62;  // anillo de planetas natales
    const R_HOUSES     = cx * 0.50;  // líneas de casas llegan hasta aquí
    const R_CORE       = cx * 0.28;  // círculo central

    // El ASC siempre en 9 o'clock (180° en pantalla = eje izq)
    const ascLon = ascendant.longitude;
    function toAngle(lon: number): number {
      // lon 0 = Aries, aumenta en sentido antihorario astronómico
      // En SVG: 0° = derecha, aumenta horario
      // ASC debe quedar a la izquierda (180°)
      return ((lon - ascLon + 180) % 360 + 360) % 360;
    }
    function toRad(deg: number) { return (deg * Math.PI) / 180; }

    const g = svg.append("g");

    // ── Fondo ─────────────────────────────────────────────────────────────────
    g.append("circle")
      .attr("cx", cx).attr("cy", cy).attr("r", R_ZODIAC_OUT)
      .attr("fill", "#0A0E1A").attr("stroke", "#374151").attr("stroke-width", 1);

    // ── Anillo zodiacal (12 sectores de 30°) ──────────────────────────────────
    for (let i = 0; i < 12; i++) {
      const startLon = i * 30;
      const startAngle = toAngle(startLon);
      const endAngle   = toAngle(startLon + 30);

      const arc = d3.arc<unknown>()
        .innerRadius(R_ZODIAC_IN)
        .outerRadius(R_ZODIAC_OUT)
        .startAngle(toRad(startAngle))
        .endAngle(toRad(endAngle));

      g.append("path")
        .attr("d", arc as unknown as string)
        .attr("transform", `translate(${cx},${cy})`)
        .attr("fill", `${signColor(SIGN_FULL[i])}22`)
        .attr("stroke", "#1F2937")
        .attr("stroke-width", 0.5);

      // Símbolo del signo en el centro del sector
      const midAngle = toRad((startAngle + endAngle) / 2);
      const midR = (R_ZODIAC_IN + R_ZODIAC_OUT) / 2;
      g.append("text")
        .attr("x", cx + midR * Math.cos(midAngle - Math.PI / 2))
        .attr("y", cy + midR * Math.sin(midAngle - Math.PI / 2))
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "central")
        .attr("font-size", width * 0.025)
        .attr("fill", signColor(SIGN_FULL[i]))
        .text(SIGN_NAMES_SHORT[i]);
    }

    // ── Círculos divisorios ───────────────────────────────────────────────────
    [R_ZODIAC_IN, R_NATAL + 8, R_CORE].forEach((r) => {
      g.append("circle")
        .attr("cx", cx).attr("cy", cy).attr("r", r)
        .attr("fill", "none")
        .attr("stroke", "#1F2937")
        .attr("stroke-width", 0.5);
    });

    // ── Líneas de casas ───────────────────────────────────────────────────────
    houses.forEach((house) => {
      const angle = toRad(toAngle(house.cusp_longitude));
      const isAngular = [1, 4, 7, 10].includes(house.number);

      g.append("line")
        .attr("x1", cx + R_ZODIAC_IN * Math.cos(angle - Math.PI / 2))
        .attr("y1", cy + R_ZODIAC_IN * Math.sin(angle - Math.PI / 2))
        .attr("x2", cx + R_CORE * Math.cos(angle - Math.PI / 2))
        .attr("y2", cy + R_CORE * Math.sin(angle - Math.PI / 2))
        .attr("stroke", isAngular ? "#C9A84C" : "#374151")
        .attr("stroke-width", isAngular ? 1 : 0.5)
        .attr("stroke-dasharray", isAngular ? "none" : "2,3");

      // Número de casa
      const labelR = (R_HOUSES + R_CORE) / 2;
      const nextAngle = toRad(toAngle(houses[(house.number % 12)].cusp_longitude));
      const midAngle = (angle + nextAngle) / 2;

      g.append("text")
        .attr("x", cx + labelR * Math.cos(midAngle - Math.PI / 2))
        .attr("y", cy + labelR * Math.sin(midAngle - Math.PI / 2))
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "central")
        .attr("font-size", width * 0.018)
        .attr("fill", "#4B5563")
        .attr("font-family", "JetBrains Mono, monospace")
        .text(house.number);
    });

    // ── Líneas de aspectos (en el núcleo) ─────────────────────────────────────
    const visibleAspects = highlightedPlanet
      ? aspects.filter((a) => a.planet1 === highlightedPlanet || a.planet2 === highlightedPlanet)
      : aspects.filter((a) => ["Conjunción", "Oposición", "Cuadratura", "Trígono", "Sextil"].includes(a.aspect_name));

    const planetMap = Object.fromEntries(planets.map((p) => [p.name, p]));

    visibleAspects.forEach((asp) => {
      const p1 = planetMap[asp.planet1];
      const p2 = planetMap[asp.planet2];
      if (!p1 || !p2) return;

      const a1 = toRad(toAngle(p1.longitude));
      const a2 = toRad(toAngle(p2.longitude));
      const r  = R_CORE * 0.9;

      g.append("line")
        .attr("x1", cx + r * Math.cos(a1 - Math.PI / 2))
        .attr("y1", cy + r * Math.sin(a1 - Math.PI / 2))
        .attr("x2", cx + r * Math.cos(a2 - Math.PI / 2))
        .attr("y2", cy + r * Math.sin(a2 - Math.PI / 2))
        .attr("stroke", ASPECT_COLORS[asp.nature])
        .attr("stroke-width", 0.5)
        .attr("opacity", 0.4);
    });

    // ── Planetas natales ──────────────────────────────────────────────────────
    const natalR = R_NATAL;
    planets.forEach((p) => {
      const angle = toRad(toAngle(p.longitude));
      const isHighlighted = highlightedPlanet === p.name;

      const px = cx + natalR * Math.cos(angle - Math.PI / 2);
      const py = cy + natalR * Math.sin(angle - Math.PI / 2);

      // Símbolo del planeta
      const pText = g.append("text")
        .attr("x", px).attr("y", py)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "central")
        .attr("font-size", width * 0.028)
        .attr("fill", isHighlighted ? "#C9A84C" : "#E5E7EB")
        .attr("cursor", "pointer")
        .attr("filter", isHighlighted ? "drop-shadow(0 0 4px #C9A84C)" : "none")
        .text(p.symbol);

      // Grado bajo el símbolo
      g.append("text")
        .attr("x", px)
        .attr("y", py + width * 0.025)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "central")
        .attr("font-size", width * 0.014)
        .attr("fill", "#6B7280")
        .attr("font-family", "JetBrains Mono, monospace")
        .text(`${Math.floor(p.degree_in_sign)}°`);

      if (p.retrograde) {
        g.append("text")
          .attr("x", px + width * 0.018)
          .attr("y", py - width * 0.018)
          .attr("font-size", width * 0.012)
          .attr("fill", "#EF4444")
          .text("℞");
      }

      // Tooltip invisible para click
      const hitbox = g.append("circle")
        .attr("cx", px).attr("cy", py).attr("r", width * 0.025)
        .attr("fill", "transparent")
        .attr("cursor", "pointer");

      hitbox.append("title").text(`${p.name} ${p.degree_display} ${p.sign} (Casa ${p.house})`);
      hitbox.on("click", () => onPlanetClick?.(p.name));
      pText.on("click", () => onPlanetClick?.(p.name));
    });

    // ── Planetas transitantes (anillo exterior al natal) ──────────────────────
    if (transitPlanets?.length) {
      const tR = R_TRANSIT;
      g.append("circle")
        .attr("cx", cx).attr("cy", cy).attr("r", tR + 10)
        .attr("fill", "none").attr("stroke", "#1F2937").attr("stroke-width", 0.5);

      transitPlanets.forEach((p) => {
        const angle = toRad(toAngle(p.longitude));
        const px = cx + tR * Math.cos(angle - Math.PI / 2);
        const py = cy + tR * Math.sin(angle - Math.PI / 2);

        g.append("text")
          .attr("x", px).attr("y", py)
          .attr("text-anchor", "middle")
          .attr("dominant-baseline", "central")
          .attr("font-size", width * 0.024)
          .attr("fill", "#60A5FA")
          .text(p.symbol)
          .append("title")
          .text(`${p.name} (tránsito) ${p.degree_display} ${p.sign}`);
      });
    }

    // ── ASC / MC labels ───────────────────────────────────────────────────────
    const labelR = R_ZODIAC_IN - 12;

    function addAngleLabel(lon: number, label: string, color: string) {
      const angle = toRad(toAngle(lon));
      g.append("text")
        .attr("x", cx + labelR * Math.cos(angle - Math.PI / 2))
        .attr("y", cy + labelR * Math.sin(angle - Math.PI / 2))
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "central")
        .attr("font-size", width * 0.016)
        .attr("fill", color)
        .attr("font-family", "JetBrains Mono, monospace")
        .attr("font-weight", "bold")
        .text(label);
    }

    addAngleLabel(ascendant.longitude, "ASC", "#C9A84C");
    addAngleLabel((ascendant.longitude + 180) % 360, "DSC", "#9CA3AF");
  }

  return (
    <div className="flex items-center justify-center">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${width} ${width}`}
        width="100%"
        style={{ maxWidth: width }}
        className="rounded-xl"
      />
    </div>
  );
}
