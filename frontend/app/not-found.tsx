import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="text-center">
        <div className="text-6xl mb-6 text-blue-200">✦</div>
        <h1 className="font-semibold text-4xl text-slate-900 mb-3">404</h1>
        <p className="text-slate-500 mb-6 font-mono text-sm">
          Esta carta no existe o expiró.<br />
          Los datos se guardan solo en tu navegador.
        </p>
        <Link
          href="/"
          className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-mono text-sm hover:bg-blue-700 transition-colors"
        >
          ← Calcular nueva carta
        </Link>
      </div>
    </div>
  );
}
