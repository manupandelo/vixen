import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { MatchForm } from "@/components/admin/AdminForms";
import { createMatch } from "@/features/football-tournaments/actions";
import {
  getAdminMatches,
  getAdminTeams,
  getAdminTournament,
} from "@/features/football-tournaments/data";
import type { FootballMatchStatus } from "@/features/football-tournaments/types";

type AdminTournamentMatchesPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export const metadata: Metadata = {
  title: "Partidos — Vixen Admin",
  description: "Gestión interna de partidos de fútbol.",
};

const statusLabels: Record<FootballMatchStatus, string> = {
  scheduled: "Programado",
  completed: "Finalizado",
  postponed: "Postergado",
  cancelled: "Cancelado",
};

function formatScheduledAt(value: string | null) {
  if (!value) return "Sin fecha";

  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Argentina/Buenos_Aires",
  }).format(new Date(value));
}

function formatScore(
  status: FootballMatchStatus,
  homeScore: number | null,
  awayScore: number | null,
) {
  if (status !== "completed") return "Sin resultado";
  if (homeScore === null || awayScore === null) return "Resultado incompleto";

  return `${homeScore} - ${awayScore}`;
}

export default async function AdminTournamentMatchesPage({
  params,
}: AdminTournamentMatchesPageProps) {
  const { id } = await params;
  const tournament = await getAdminTournament(id);

  if (!tournament) {
    notFound();
  }

  const [teams, matches] = await Promise.all([
    getAdminTeams(tournament.id),
    getAdminMatches(tournament.id),
  ]);
  const teamNames = new Map(teams.map((team) => [team.id, team.name]));
  const createMatchAction = createMatch.bind(null, tournament.id);

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
            Partidos
          </p>
          <h1 className="mt-4 text-display-sm">{tournament.name}</h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-[var(--color-muted)]">
            Programá fixture, cargá resultados finales y dejá que la tabla se
            calcule desde los partidos completados.
          </p>
        </div>

        <Link
          href={`/admin/torneos/${tournament.id}/equipos`}
          className="inline-flex min-h-11 items-center justify-center rounded-[0.8rem] border border-white/12 bg-white/[0.025] px-4 py-2 text-sm font-semibold uppercase tracking-[0.14em] text-white/78 transition hover:border-[var(--color-accent)] hover:bg-white/[0.05] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-base)]"
        >
          Equipos
        </Link>
      </section>

      <section className="editorial-panel p-6 sm:p-8">
        <div className="mb-6">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-accent)]">
            Nuevo partido
          </p>
          <h2 className="mt-3 text-2xl font-semibold">Alta de partido</h2>
        </div>
        <MatchForm action={createMatchAction} teams={teams} />
      </section>

      {matches.length > 0 ? (
        <section className="overflow-hidden rounded-[0.95rem] border border-white/10 bg-white/[0.025]">
          <div className="hidden grid-cols-[0.75fr_0.85fr_1.2fr_0.55fr_0.65fr] gap-4 border-b border-white/10 px-5 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-white/44 lg:grid">
            <span>Ronda</span>
            <span>Fecha</span>
            <span>Partido</span>
            <span>Resultado</span>
            <span>Estado</span>
          </div>

          <div className="divide-y divide-white/10">
            {matches.map((match) => (
              <article
                key={match.id}
                className="grid gap-4 px-5 py-5 lg:grid-cols-[0.75fr_0.85fr_1.2fr_0.55fr_0.65fr] lg:items-center"
              >
                <div>
                  <p className="text-sm font-semibold text-white">
                    {match.roundLabel}
                  </p>
                  <p className="mt-1 text-xs text-[var(--color-muted)]">
                    ID {match.id.slice(0, 8)}
                  </p>
                </div>

                <p className="text-sm text-white/76">
                  {formatScheduledAt(match.scheduledAt)}
                </p>

                <p className="text-sm text-white/86">
                  {teamNames.get(match.homeTeamId) ?? "Equipo local"} vs{" "}
                  {teamNames.get(match.awayTeamId) ?? "Equipo visitante"}
                </p>

                <p className="text-sm font-semibold text-white">
                  {formatScore(match.status, match.homeScore, match.awayScore)}
                </p>

                <p className="text-sm font-semibold text-[var(--color-accent)]">
                  {statusLabels[match.status]}
                </p>
              </article>
            ))}
          </div>
        </section>
      ) : (
        <section className="editorial-panel p-6 sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-accent)]">
            Sin partidos
          </p>
          <h2 className="mt-4 text-2xl font-semibold">
            Todavía no hay partidos cargados.
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--color-muted)]">
            Creá el primer partido cuando el torneo tenga al menos dos equipos.
          </p>
        </section>
      )}
    </div>
  );
}
