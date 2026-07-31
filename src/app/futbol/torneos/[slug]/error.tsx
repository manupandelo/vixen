"use client";

import { useEffect } from "react";

import { PageState } from "@/components/PageState";

export default function TournamentError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <PageState
      code="ERR"
      eyebrow="Carga interrumpida"
      title="No pudimos cargar el torneo"
      description="Hubo un problema al cargar esta página. Probá de nuevo ahora o volvé a intentarlo en unos minutos."
      fallbackHref="/futbol/torneos"
      fallbackLabel="Ver todos los torneos"
      action={
        <button
          type="button"
          onClick={() => unstable_retry()}
          className="inline-flex min-h-11 items-center justify-center rounded-lg border border-[var(--color-accent-strong)] bg-[var(--color-accent)] px-5 py-2.5 text-[0.95rem] font-bold text-[#07110a] transition-all duration-200 hover:bg-[var(--color-accent-strong)] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-base)]"
        >
          Reintentar
        </button>
      }
    />
  );
}
