import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Guías del cielo",
  description: "Mercurio retrógrado, lunas y lunaciones — lectura de clima, no predicción.",
};

export default function GuiaIndexPage() {
  return (
    <article className="max-w-2xl mx-auto px-4 py-12 space-y-6">
      <p className="text-xs uppercase tracking-widest text-accent">Guías</p>
      <h1 className="font-display text-3xl text-ink">El cielo de 2027, en claro</h1>
      <p className="text-ink-2 leading-relaxed">
        Páginas gratuitas con las fechas del calendario (efemérides). Lectura de clima cotidiano, no un
        pronóstico de hechos. El módulo de calendario día a día sigue archivado.
      </p>
      <ul className="space-y-3">
        <li>
          <Link href="/guia/mercurio-retrogrado-2027" className="text-accent underline">
            Mercurio retrógrado 2027
          </Link>
        </li>
        <li>
          <Link href="/guia/lunas-2027" className="text-accent underline">
            Lunas nuevas y llenas 2027
          </Link>
        </li>
      </ul>
    </article>
  );
}
