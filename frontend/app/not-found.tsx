import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="text-center">
        <div className="text-6xl mb-6">✦</div>
        <h1 className="font-serif text-4xl text-gold mb-3">404</h1>
        <p className="text-gray-400 mb-6 font-mono text-sm">
          Esta carta no existe o expiró.<br />
          Los datos se guardan solo en tu navegador.
        </p>
        <Link
          href="/"
          className="inline-block bg-gold text-space-bg px-6 py-3 rounded-lg font-mono text-sm hover:bg-yellow-500 transition-colors"
        >
          ← Calcular nueva carta
        </Link>
      </div>
    </div>
  );
}
