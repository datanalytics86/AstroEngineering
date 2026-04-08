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
        <h1 className="font-serif text-2xl text-gold mb-3">Algo salió mal</h1>
        <p className="text-gray-400 font-mono text-sm mb-2">{error.message}</p>
        {error.digest && (
          <p className="text-gray-600 font-mono text-xs mb-6">ID: {error.digest}</p>
        )}
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="bg-gold text-space-bg px-5 py-2 rounded-lg font-mono text-sm hover:bg-yellow-500 transition-colors"
          >
            Reintentar
          </button>
          <a
            href="/"
            className="border border-space-border text-gray-400 px-5 py-2 rounded-lg font-mono text-sm hover:border-gold hover:text-gold transition-colors"
          >
            Inicio
          </a>
        </div>
      </div>
    </div>
  );
}
