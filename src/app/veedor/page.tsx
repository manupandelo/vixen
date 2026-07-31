import type { Metadata } from "next";
import { LogOut } from "lucide-react";

import { ViewerMatchList } from "@/components/veedor/ViewerMatchList";
import { logoutAdmin } from "@/features/football-tournaments/actions";
import { getViewerAssignedMatches } from "@/features/football-tournaments/data";

export const metadata: Metadata = {
  title: "Veedor — Vixen Club",
  description: "Carga privada de resultados asignados.",
};

export default async function ViewerDashboardPage() {
  const matches = await getViewerAssignedMatches();

  return (
    <main className="min-h-screen bg-[var(--color-base)] px-5 py-8 text-[var(--color-ink)] sm:px-8">
      <div className="mx-auto grid w-full max-w-5xl gap-8">
        <section className="grid gap-5 border-b border-white/10 pb-8 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-accent)]">
              Veedor
            </p>
            <h1 className="mt-4 text-2xl font-semibold text-white sm:text-3xl">
              Mis partidos asignados
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-[var(--color-muted)]">
              Cargá solo resultados finales. Una vez guardado, el resultado
              queda bloqueado y cualquier corrección la hace un administrador.
            </p>
          </div>

          <form action={logoutAdmin}>
            <button
              type="submit"
              className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-[0.8rem] border border-white/12 bg-white/[0.025] px-4 py-2 text-sm font-semibold text-white/78 transition hover:border-[var(--color-warm)]/55 hover:bg-[var(--color-warm)]/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-base)] sm:w-auto"
            >
              <LogOut size={16} aria-hidden="true" />
              Cerrar sesión
            </button>
          </form>
        </section>

        {matches.length > 0 ? (
          <ViewerMatchList matches={matches} />
        ) : (
          <section className="rounded-[0.95rem] border border-white/10 bg-white/[0.025] p-6 sm:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-accent)]">
              Sin asignaciones
            </p>
            <h2 className="mt-4 text-2xl font-semibold text-white">
              No tenés partidos asignados.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--color-muted)]">
              Cuando un administrador te asigne un partido, va a aparecer acá.
            </p>
          </section>
        )}
      </div>
    </main>
  );
}
