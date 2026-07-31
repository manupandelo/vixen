import { resolveMatchWinner } from "./bracket-progression";
import type { FootballTournamentFormat, StandingRow } from "./types";

export type ChampionMatch = {
  id: string;
  isKnockout: boolean;
  nextMatchId?: string | null;
  homeTeamId: string | null;
  awayTeamId: string | null;
  homeScore: number | null;
  awayScore: number | null;
  homePenaltyScore?: number | null;
  awayPenaltyScore?: number | null;
  status: string;
};

function isPlayed(match: ChampionMatch) {
  return (
    match.status === "completed" &&
    match.homeScore !== null &&
    match.awayScore !== null
  );
}

/**
 * Devuelve el equipo campeón, o null si la competencia todavía no terminó.
 *
 * En copa y playoff el campeón sale de la final: el partido de llave que no
 * alimenta a ningún otro. En liga, del primero de la tabla una vez que se
 * jugaron todos los partidos.
 */
export function resolveChampionTeamId({
  format,
  matches,
  standings,
}: {
  format: FootballTournamentFormat;
  matches: ChampionMatch[];
  standings: StandingRow[];
}): string | null {
  if (matches.length === 0) return null;

  if (format === "league") {
    const allPlayed = matches.every(
      (match) => isPlayed(match) || match.status === "cancelled",
    );

    if (!allPlayed) return null;

    return standings[0]?.teamId ?? null;
  }

  const knockoutMatches = matches.filter((match) => match.isKnockout);
  const matchIds = new Set(knockoutMatches.map((match) => match.id));
  const finals = knockoutMatches.filter(
    (match) => !match.nextMatchId || !matchIds.has(match.nextMatchId),
  );

  // Una llave bien formada tiene una sola final; si hay varias, no hay campeón.
  if (finals.length !== 1) return null;

  const final = finals[0];

  if (!isPlayed(final)) return null;

  return resolveMatchWinner({
    homeTeamId: final.homeTeamId,
    awayTeamId: final.awayTeamId,
    homeScore: final.homeScore,
    awayScore: final.awayScore,
    homePenaltyScore: final.homePenaltyScore,
    awayPenaltyScore: final.awayPenaltyScore,
  });
}
