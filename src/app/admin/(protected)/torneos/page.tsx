import type { Metadata } from "next";
import Link from "next/link";

import { getAdminTournaments } from "@/features/football-tournaments/data";
import type { FootballTournamentStatus } from "@/features/football-tournaments/types";

export const metadata: Metadata = {
  title: "Torneos — Vixen Admin",
  description: "Gestión interna de torneos de fútbol.",
};

const statusLabels: Record<FootballTournamentStatus, string> = {
  draft: "Borrador",
  published: "Publicado",
  active: "Activo",
  completed: "Finalizado",
  archived: "Archivado",
};

function formatDate(value: string | null) {
  if (!value) return "Sin fecha";

  return value.split("-").reverse().join("/");
}

export default async function AdminTournamentsPage() {
  const tournaments = await getAdminTournaments();

  return (
    <div className="grid gap-8">
      <section className="grid gap-6 border-b border-white/10 pb-8 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-accent)]">
            Torneos
          </p>
          <h1 className="mt-4 text-display-sm">Gestión de torneos</h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-[var(--color-muted)]">
            Creá torneos y mantené sus datos base antes de cargar equipos,
            partidos y resultados.
          </p>
        </div>

        <Link
          href="/admin/torneos/nuevo"
          className="inline-flex min-h-12 items-center justify-center rounded-[0.95rem] border border-[color-mix(in_srgb,var(--color-accent)_72%,black)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--color-accent)_92%,white_8%),var(--color-accent))] px-5 py-3 text-sm font-semibold uppercase tracking-[0.14em] text-[#07110a] shadow-[0_10px_24px_rgb(60_191_113_/_0.12)] transition duration-200 hover:-translate-y-px hover:border-[var(--color-accent-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-base)]"
        >
          Nuevo torneo
        </Link>
      </section>

      {tournaments.length > 0 ? (
        <section className="overflow-hidden rounded-[0.95rem] border border-white/10 bg-white/[0.025]">
          <div className="hidden grid-cols-[1.4fr_0.7fr_0.7fr_0.8fr_0.5fr] gap-4 border-b border-white/10 px-5 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-white/44 lg:grid">
            <span>Torneo</span>
            <span>Temporada</span>
            <span>Estado</span>
            <span>Fechas</span>
            <span className="text-right">Acción</span>
          </div>

          <div className="divide-y divide-white/10">
            {tournaments.map((tournament) => (
              <article
                key={tournament.id}
                className="grid gap-4 px-5 py-5 lg:grid-cols-[1.4fr_0.7fr_0.7fr_0.8fr_0.5fr] lg:items-center"
              >
                <div>
                  <h2 className="text-lg font-semibold text-white">
                    {tournament.name}
                  </h2>
                  <p className="mt-1 text-sm text-[var(--color-muted)]">
                    {tournament.category} · {tournament.slug}
                  </p>
                </div>

                <p className="text-sm text-white/76">{tournament.season}</p>

                <p className="text-sm font-semibold text-[var(--color-accent)]">
                  {statusLabels[tournament.status]}
                </p>

                <p className="text-sm text-white/70">
                  {formatDate(tournament.startsAt)} -{" "}
                  {formatDate(tournament.endsAt)}
                </p>

                <Link
                  href={`/admin/torneos/${tournament.id}`}
                  className="inline-flex min-h-10 items-center justify-center rounded-[0.8rem] border border-white/12 bg-white/[0.025] px-4 py-2 text-sm font-semibold uppercase tracking-[0.14em] text-white/78 transition hover:border-[var(--color-accent)] hover:bg-white/[0.05] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-base)] lg:justify-self-end"
                >
                  Editar
                </Link>
              </article>
            ))}
          </div>
        </section>
      ) : (
        <section className="editorial-panel p-6 sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-accent)]">
            Sin torneos
          </p>
          <h2 className="mt-4 text-2xl font-semibold">
            Todavía no hay torneos cargados.
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--color-muted)]">
            Creá el primer torneo para habilitar la carga de equipos y
            partidos.
          </p>
        </section>
      )}
    </div>
  );
}
