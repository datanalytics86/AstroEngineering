import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { sanitizeShareWord } from "@/lib/share";

export const runtime = "edge";

export async function GET(req: NextRequest, ctx: { params: Promise<{ kind: string }> }) {
  const { kind } = await ctx.params;
  const sp = req.nextUrl.searchParams;
  const w1 = sanitizeShareWord(sp.get("w1")) || "Amor";
  const w2 = sanitizeShareWord(sp.get("w2")) || "Trabajo";
  const w3 = sanitizeShareWord(sp.get("w3")) || "Casa";
  const areas = kind !== "words";
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 80,
          background: "#14110e",
          color: "#f4efe6",
          fontFamily: "Georgia, serif",
        }}
      >
        <div style={{ fontSize: 22, letterSpacing: 6, textTransform: "uppercase", color: "#c4a574" }}>
          AstroEngine
        </div>
        <div style={{ fontSize: 64, marginTop: 24, lineHeight: 1.1 }}>
          {areas ? "Mis 6 áreas" : "Mi 2027 en 3 palabras"}
        </div>
        {areas ? (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 36, fontSize: 28 }}>
            {["Amor", "Dinero", "Trabajo", "Salud", "Familia", "Crecimiento"].map((a) => (
              <div
                key={a}
                style={{
                  border: "1px solid #3a322b",
                  padding: "8px 16px",
                  borderRadius: 8,
                }}
              >
                {a}
              </div>
            ))}
          </div>
        ) : (
          <div style={{ display: "flex", gap: 24, marginTop: 40, fontSize: 40 }}>
            <span>{w1}</span>
            <span style={{ color: "#c4a574" }}>·</span>
            <span>{w2}</span>
            <span style={{ color: "#c4a574" }}>·</span>
            <span>{w3}</span>
          </div>
        )}
        <div style={{ marginTop: 48, fontSize: 22, color: "#b7a99a" }}>
          Cómo te va el amor, el dinero y el trabajo — en claro.
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
