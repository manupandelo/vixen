import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { TournamentForm } from "@/components/admin/AdminForms";
import { updateTournament } from "@/features/football-tournaments/actions";
import { getAdminTournament } from "@/features/football-tournaments/data";

type EditTournamentPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export const metadata: Metadata = {
  title: "Editar torneo — Vixen Admin",
  description: "Edición interna de torneos de fútbol.",
};

export default async function EditTournamentPage({
  params,
}: EditTournamentPageProps) {
  const { id } = await params;
  const tournament = await getAdminTournament(id);

  if (!tournament) {
    notFound();
  }

  const updateTournamentAction = updateTournament.bind(null, tournament.id);

  return (
    <div className="grid gap-8">
      <section className="grid gap-6 border-b border-white/10 pb-8 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <Link
            href="/admin/torneos"
            className="text-sm font-semibold uppercase tracking-[0.16em] text-white/58 transition hover:text-[var(--color-accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-base)]"
          >
            Volver a torneos
          </Link>
          <p className="mt-6 text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-accent)]">
            Editar torneo
          </p>
          <h1 className="mt-4 text-display-sm">{tournament.name}</h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-[var(--color-muted)]">
            Actualizá los datos base o avanzá a la carga operativa de equipos y
            partidos.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href={`/admin/torneos/${tournament.id}/equipos`}
            className="inline-flex min-h-11 items-center justify-center rounded-[0.8rem] border border-white/12 bg-white/[0.025] px-4 py-2 text-sm font-semibold uppercase tracking-[0.14em] text-white/78 transition hover:border-[var(--color-accent)] hover:bg-white/[0.05] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-base)]"
          >
            Equipos
          </Link>
          <Link
            href={`/admin/torneos/${tournament.id}/partidos`}
            className="inline-flex min-h-11 items-center justify-center rounded-[0.8rem] border border-white/12 bg-white/[0.025] px-4 py-2 text-sm font-semibold uppercase tracking-[0.14em] text-white/78 transition hover:border-[var(--color-accent)] hover:bg-white/[0.05] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-base)]"
          >
            Partidos
          </Link>
        </div>
      </section>

      <section className="editorial-panel p-6 sm:p-8">
        <TournamentForm
          action={updateTournamentAction}
          tournament={tournament}
          submitLabel="Guardar torneo"
        />
      </section>
    </div>
  );
}
