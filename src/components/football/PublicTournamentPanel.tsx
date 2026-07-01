import {
  footballTournamentFormatLabels,
  type PublicFootballTournament,
} from "@/features/football-tournaments/types";

import { MatchList } from "./MatchList";
import { StandingsTable } from "./StandingsTable";

export function PublicTournamentPanel({
  tournament,
}: {
  tournament: PublicFootballTournament;
}) {
  const upcomingMatches = tournament.matches
    .filter((match) => match.status === "scheduled")
    .slice(0, 5);
  const latestCompletedMatches = tournament.matches
    .filter((match) => match.status === "completed")
    .slice(-5)
    .reverse();

  return (
    <article className="border-t border-white/10 pt-8 first:border-t-0 first:pt-0">
      <div className="grid gap-5 lg:grid-cols-[0.84fr_1.16fr] lg:items-start">
        <div className="min-w-0">
          <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-accent)]">
            <span>{tournament.category}</span>
            <span className="text-white/30">/</span>
            <span>{footballTournamentFormatLabels[tournament.format]}</span>
            <span className="text-white/30">/</span>
            <span>Temporada {tournament.season}</span>
          </div>
          <h3 className="mt-3 text-display-sm text-2xl">{tournament.name}</h3>
          {tournament.description && (
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-[var(--color-muted)]">
              {tournament.description}
            </p>
          )}
        </div>

        <div className="min-w-0">
          <StandingsTable rows={tournament.standings} />
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <MatchList title="Próximos partidos" matches={upcomingMatches} />
        <MatchList
          title="Últimos resultados"
          matches={latestCompletedMatches}
        />
      </div>
    </article>
  );
}
