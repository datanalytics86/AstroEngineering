"use client";

import { useEffect, useRef, useCallback } from "react";
import * as d3 from "d3";
import type { PlanetPosition, HouseCusp, AnglePoint, Aspect, ClickTarget } from "@/lib/types";
import { signColor, ASPECT_COLORS } from "@/lib/zodiac-utils";

interface Props {
  planets: PlanetPosition[];
  houses: HouseCusp[];
  ascendant: AnglePoint;
  midheaven: AnglePoint;
  aspects: Aspect[];
  transitPlanets?: PlanetPosition[];
  highlightedPlanet?: string;
  onPlanetClick?: (name: string) => void;
  onElementClick?: (target: ClickTarget) => void;
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
  midheaven,
  aspects,
  transitPlanets,
  highlightedPlanet,
  onPlanetClick,
  onElementClick,
  width = 600,
}: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  // Use refs to avoid stale closures inside D3 handlers
  const onElementClickRef = useRef(onElementClick);
  const onPlanetClickRef = useRef(onPlanetClick);
  useEffect(() => { onElementClickRef.current = onElementClick; }, [onElementClick]);
  useEffect(() => { onPlanetClickRef.current = onPlanetClick; }, [onPlanetClick]);

  const drawChart = useCallback(() => {
    if (!svgRef.current || !planets.length) return;
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
      .attr("fill", "#FFFFFF").attr("stroke", "#E5E9F0").attr("stroke-width", 1);

    // ── Anillo zodiacal (12 sectores de 30°) ──────────────────────────────────
    for (let i = 0; i < 12; i++) {
      const startLon = i * 30;
      const sA = toAngle(startLon);
      let eA = toAngle(startLon + 30);
      // Asegurar que endAngle > startAngle para que D3 dibuje el arco correcto (~30°)
      if (eA <= sA) eA += 360;

      const arc = d3.arc<unknown>()
        .innerRadius(R_ZODIAC_IN)
        .outerRadius(R_ZODIAC_OUT)
        .startAngle(toRad(sA))
        .endAngle(toRad(eA));

      g.append("path")
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .attr("d", arc(null as any) as string)
        .attr("transform", `translate(${cx},${cy})`)
        .attr("fill", `${signColor(SIGN_FULL[i])}18`)
        .attr("stroke", "#E5E9F0")
        .attr("stroke-width", 0.5);

      // Símbolo del signo en el centro del sector
      const midAngle = toRad((sA + eA) / 2);
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
        .attr("stroke", "#CBD5E1")
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
        .attr("stroke", isAngular ? "#2563EB" : "#CBD5E1")
        .attr("stroke-width", isAngular ? 1 : 0.5)
        .attr("stroke-dasharray", isAngular ? "none" : "2,3");

      // Número de casa — midpoint entre esta cúspide y la siguiente
      const labelR = (R_HOUSES + R_CORE) / 2;
      const nextCusp = houses[house.number % 12].cusp_longitude;
      let nextAngleRaw = toAngle(nextCusp);
      let thisAngleRaw = toAngle(house.cusp_longitude);
      if (nextAngleRaw <= thisAngleRaw) nextAngleRaw += 360;
      const midAngle = toRad((thisAngleRaw + nextAngleRaw) / 2);

      const capturedHouse = house;
      g.append("text")
        .attr("x", cx + labelR * Math.cos(midAngle - Math.PI / 2))
        .attr("y", cy + labelR * Math.sin(midAngle - Math.PI / 2))
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "central")
        .attr("font-size", width * 0.018)
        .attr("fill", "#94A3B8")
        .attr("font-family", "JetBrains Mono, monospace")
        .attr("cursor", "pointer")
        .text(house.number)
        .on("click", () => onElementClickRef.current?.({ type: "house", house: capturedHouse }));
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

      const line = g.append("line")
        .attr("x1", cx + r * Math.cos(a1 - Math.PI / 2))
        .attr("y1", cy + r * Math.sin(a1 - Math.PI / 2))
        .attr("x2", cx + r * Math.cos(a2 - Math.PI / 2))
        .attr("y2", cy + r * Math.sin(a2 - Math.PI / 2))
        .attr("stroke", ASPECT_COLORS[asp.nature])
        .attr("stroke-width", 0.5)
        .attr("opacity", 0.4)
        .attr("cursor", "pointer");

      // Hitbox más fácil de clickear
      const midX = (cx + r * Math.cos(a1 - Math.PI / 2) + cx + r * Math.cos(a2 - Math.PI / 2)) / 2;
      const midY = (cy + r * Math.sin(a1 - Math.PI / 2) + cy + r * Math.sin(a2 - Math.PI / 2)) / 2;
      const capturedAsp = asp;
      const hitLine = g.append("line")
        .attr("x1", cx + r * Math.cos(a1 - Math.PI / 2))
        .attr("y1", cy + r * Math.sin(a1 - Math.PI / 2))
        .attr("x2", cx + r * Math.cos(a2 - Math.PI / 2))
        .attr("y2", cy + r * Math.sin(a2 - Math.PI / 2))
        .attr("stroke", "transparent")
        .attr("stroke-width", 12)
        .attr("cursor", "pointer");
      hitLine.append("title").text(`${asp.planet1} ${asp.aspect_name} ${asp.planet2} (${asp.orb.toFixed(2)}°)`);
      hitLine.on("click", () => {
        onElementClickRef.current?.({ type: "aspect", aspect: capturedAsp });
      });
      line.on("click", () => {
        onElementClickRef.current?.({ type: "aspect", aspect: capturedAsp });
      });
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
        .attr("fill", isHighlighted ? "#2563EB" : "#1E293B")
        .attr("cursor", "pointer")
        .attr("filter", isHighlighted ? "drop-shadow(0 0 4px #2563EB)" : "none")
        .text(p.symbol);

      // Grado bajo el símbolo
      g.append("text")
        .attr("x", px)
        .attr("y", py + width * 0.025)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "central")
        .attr("font-size", width * 0.014)
        .attr("fill", "#94A3B8")
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
      const capturedPlanet = p;
      hitbox.on("click", () => {
        onPlanetClickRef.current?.(capturedPlanet.name);
        onElementClickRef.current?.({ type: "planet", planet: capturedPlanet, aspects });
      });
      pText.on("click", () => {
        onPlanetClickRef.current?.(capturedPlanet.name);
        onElementClickRef.current?.({ type: "planet", planet: capturedPlanet, aspects });
      });
    });

    // ── Planetas transitantes (anillo exterior al natal) ──────────────────────
    if (transitPlanets?.length) {
      const tR = R_TRANSIT;
      g.append("circle")
        .attr("cx", cx).attr("cy", cy).attr("r", tR + 10)
        .attr("fill", "none").attr("stroke", "#E5E9F0").attr("stroke-width", 0.5);

      transitPlanets.forEach((p) => {
        const angle = toRad(toAngle(p.longitude));
        const px = cx + tR * Math.cos(angle - Math.PI / 2);
        const py = cy + tR * Math.sin(angle - Math.PI / 2);

        g.append("text")
          .attr("x", px).attr("y", py)
          .attr("text-anchor", "middle")
          .attr("dominant-baseline", "central")
          .attr("font-size", width * 0.024)
          .attr("fill", "#3B82F6")
          .text(p.symbol)
          .append("title")
          .text(`${p.name} (tránsito) ${p.degree_display} ${p.sign}`);
      });
    }

    // ── ASC / MC labels ───────────────────────────────────────────────────────
    const labelR = R_ZODIAC_IN - 12;

    function addAngleLabel(
      lon: number,
      label: "ASC" | "DSC" | "MC" | "IC",
      color: string,
      anglePoint: AnglePoint,
    ) {
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
        .attr("cursor", "pointer")
        .text(label)
        .on("click", () =>
          onElementClickRef.current?.({
            type: "angle",
            name: label,
            longitude: lon,
            sign: anglePoint.sign,
            degree_display: anglePoint.degree_display,
          }),
        );
    }

    addAngleLabel(ascendant.longitude, "ASC", "#2563EB", ascendant);
    addAngleLabel((ascendant.longitude + 180) % 360, "DSC", "#94A3B8", {
      longitude: (ascendant.longitude + 180) % 360,
      sign: ascendant.sign,
      degree_display: ascendant.degree_display,
    });
    addAngleLabel(midheaven.longitude, "MC", "#0EA5E9", midheaven);
    addAngleLabel((midheaven.longitude + 180) % 360, "IC", "#94A3B8", {
      longitude: (midheaven.longitude + 180) % 360,
      sign: midheaven.sign,
      degree_display: midheaven.degree_display,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planets, houses, aspects, transitPlanets, highlightedPlanet, width]);

  useEffect(() => { drawChart(); }, [drawChart]);

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
