"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <div className="text-5xl mb-6">⚠️</div>
        <h1 className="font-semibold text-2xl text-slate-900 mb-3">Algo salió mal</h1>
        <p className="text-slate-500 font-mono text-sm mb-2">{error.message}</p>
        {error.digest && (
          <p className="text-slate-400 font-mono text-xs mb-6">ID: {error.digest}</p>
        )}
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="bg-blue-600 text-white px-5 py-2 rounded-lg font-mono text-sm hover:bg-blue-700 transition-colors"
          >
            Reintentar
          </button>
          <a
            href="/"
            className="border border-border text-slate-500 px-5 py-2 rounded-lg font-mono text-sm hover:border-blue-400 hover:text-blue-600 transition-colors"
          >
            Inicio
          </a>
        </div>
      </div>
    </div>
  );
}
