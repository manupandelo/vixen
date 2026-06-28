import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { TeamForm } from "@/components/admin/AdminForms";
import { createTeam } from "@/features/football-tournaments/actions";
import {
  getAdminTeams,
  getAdminTournament,
} from "@/features/football-tournaments/data";

type AdminTournamentTeamsPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export const metadata: Metadata = {
  title: "Equipos — Vixen Admin",
  description: "Gestión interna de equipos de fútbol.",
};

export default async function AdminTournamentTeamsPage({
  params,
}: AdminTournamentTeamsPageProps) {
  const { id } = await params;
  const tournament = await getAdminTournament(id);

  if (!tournament) {
    notFound();
  }

  const teams = await getAdminTeams(tournament.id);
  const createTeamAction = createTeam.bind(null, tournament.id);

  return (
    <div className="grid gap-8">
      <section className="grid gap-6 border-b border-white/10 pb-8 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <Link
            href={`/admin/torneos/${tournament.id}`}
            className="text-sm font-semibold uppercase tracking-[0.16em] text-white/58 transition hover:text-[var(--color-accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-base)]"
          >
            Volver al torneo
          </Link>
          <p className="mt-6 text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-accent)]">
            Equipos
          </p>
          <h1 className="mt-4 text-display-sm">{tournament.name}</h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-[var(--color-muted)]">
            Cargá los equipos participantes y mantené los datos privados de
            contacto para la coordinación interna.
          </p>
        </div>

        <Link
          href={`/admin/torneos/${tournament.id}/partidos`}
          className="inline-flex min-h-11 items-center justify-center rounded-[0.8rem] border border-white/12 bg-white/[0.025] px-4 py-2 text-sm font-semibold uppercase tracking-[0.14em] text-white/78 transition hover:border-[var(--color-accent)] hover:bg-white/[0.05] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-base)]"
        >
          Partidos
        </Link>
      </section>

      <section className="editorial-panel p-6 sm:p-8">
        <div className="mb-6">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-accent)]">
            Nuevo equipo
          </p>
          <h2 className="mt-3 text-2xl font-semibold">Alta de equipo</h2>
        </div>
        <TeamForm action={createTeamAction} />
      </section>

      {teams.length > 0 ? (
        <section className="overflow-hidden rounded-[0.95rem] border border-white/10 bg-white/[0.025]">
          <div className="hidden grid-cols-[1fr_0.8fr_0.8fr_1fr] gap-4 border-b border-white/10 px-5 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-white/44 lg:grid">
            <span>Equipo</span>
            <span>Capitán</span>
            <span>Teléfono</span>
            <span>Notas privadas</span>
          </div>

          <div className="divide-y divide-white/10">
            {teams.map((team) => (
              <article
                key={team.id}
                className="grid gap-4 px-5 py-5 lg:grid-cols-[1fr_0.8fr_0.8fr_1fr] lg:items-start"
              >
                <div>
                  <h2 className="text-lg font-semibold text-white">
                    {team.name}
                  </h2>
                  <p className="mt-1 text-sm text-[var(--color-muted)]">
                    {team.shortName ?? "Sin nombre corto"}
                  </p>
                </div>

                <p className="text-sm text-white/76">
                  {team.captainName ?? "Sin capitán"}
                </p>

                <p className="text-sm text-white/76">
                  {team.contactPhone ?? "Sin teléfono"}
                </p>

                <p className="text-sm leading-6 text-white/70">
                  {team.notes ?? "Sin notas privadas"}
                </p>
              </article>
            ))}
          </div>
        </section>
      ) : (
        <section className="editorial-panel p-6 sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-accent)]">
            Sin equipos
          </p>
          <h2 className="mt-4 text-2xl font-semibold">
            Todavía no hay equipos cargados.
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--color-muted)]">
            Creá el primer equipo para poder armar partidos y calcular la tabla
            del torneo.
          </p>
        </section>
      )}
    </div>
  );
}
