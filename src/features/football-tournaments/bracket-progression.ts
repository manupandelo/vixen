export type MatchSlot = "home" | "away";

export type WinnerResolvableMatch = {
  homeTeamId: string | null;
  awayTeamId: string | null;
  homeScore: number | null;
  awayScore: number | null;
  homePenaltyScore?: number | null;
  awayPenaltyScore?: number | null;
};

export type AdvancementTargetMatch = {
  roundLabel: string;
  homeTeamId: string | null;
  awayTeamId: string | null;
  homeScore: number | null;
  awayScore: number | null;
  status: string;
};

/**
 * Devuelve el id del equipo ganador, o null si el partido todavía no define uno.
 * Los penales solo se miran cuando el marcador quedó igualado.
 */
export function resolveMatchWinner(match: WinnerResolvableMatch): string | null {
  const { homeTeamId, awayTeamId, homeScore, awayScore } = match;

  if (!homeTeamId || !awayTeamId) return null;
  if (homeScore === null || awayScore === null) return null;

  if (homeScore > awayScore) return homeTeamId;
  if (awayScore > homeScore) return awayTeamId;

  const homePenalties = match.homePenaltyScore ?? null;
  const awayPenalties = match.awayPenaltyScore ?? null;

  if (homePenalties === null || awayPenalties === null) return null;
  if (homePenalties > awayPenalties) return homeTeamId;
  if (awayPenalties > homePenalties) return awayTeamId;

  return null;
}

function hasLoadedResult(match: AdvancementTargetMatch) {
  return (
    match.status === "completed" &&
    match.homeScore !== null &&
    match.awayScore !== null
  );
}

/**
 * Devuelve el motivo por el que NO se puede sembrar al ganador, o null si se puede.
 * Bloquea solo cuando el equipo del slot cambia y el partido destino ya tiene
 * resultado: pisarlo dejaría cargado un resultado entre equipos que nunca jugaron.
 */
export function findAdvancementBlock(
  nextMatch: AdvancementTargetMatch,
  slot: MatchSlot,
  winnerTeamId: string,
): string | null {
  const currentTeamId =
    slot === "home" ? nextMatch.homeTeamId : nextMatch.awayTeamId;

  if (currentTeamId === winnerTeamId) return null;
  if (!hasLoadedResult(nextMatch)) return null;

  return `No se puede cambiar el ganador: ${nextMatch.roundLabel} ya tiene resultado cargado. Borrá ese resultado primero.`;
}
