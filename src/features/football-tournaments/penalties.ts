export type PenaltyResolvableMatch = {
  homeScore: number | null;
  awayScore: number | null;
  homePenaltyScore?: number | null;
  awayPenaltyScore?: number | null;
};

/**
 * Un partido se definió por penales cuando terminó empatado y hay tanda cargada.
 * Es la única forma de que un cruce empatado tenga ganador.
 */
export function wasDecidedOnPenalties(match: PenaltyResolvableMatch): boolean {
  return (
    match.homeScore !== null &&
    match.awayScore !== null &&
    match.homeScore === match.awayScore &&
    match.homePenaltyScore !== null &&
    match.homePenaltyScore !== undefined &&
    match.awayPenaltyScore !== null &&
    match.awayPenaltyScore !== undefined
  );
}

/** "3-1 en penales", o null si no hubo tanda. */
export function formatPenaltyResult(
  match: PenaltyResolvableMatch,
): string | null {
  if (!wasDecidedOnPenalties(match)) return null;

  return `${match.homePenaltyScore}-${match.awayPenaltyScore} en penales`;
}
