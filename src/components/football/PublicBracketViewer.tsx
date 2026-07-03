"use client";

import type { PublicFootballMatch } from "@/features/football-tournaments/types";
import { TournamentBracket } from "@/components/football/shared/TournamentBracket";
import type { UIFootballMatch } from "@/features/football-tournaments/types";

type PublicBracketViewerProps = {
  matches: PublicFootballMatch[];
  onMatchClick?: (match: PublicFootballMatch) => void;
};

export function PublicBracketViewer({
  matches,
  onMatchClick,
}: PublicBracketViewerProps) {
  // Map to UIFootballMatch
  const uiMatches: UIFootballMatch[] = matches.map(match => ({
    id: match.id,
    roundLabel: match.roundLabel,
    scheduledAt: match.scheduledAt,
    homeTeamId: match.homeTeamId,
    awayTeamId: match.awayTeamId,
    homeTeamName: match.homeTeamName || match.homeTeamShortName,
    awayTeamName: match.awayTeamName || match.awayTeamShortName,
    homeScore: match.homeScore,
    awayScore: match.awayScore,
    status: match.status,
    nextMatchId: match.nextMatchId,
    isKnockout: match.isKnockout,
  }));

  return (
    <div className="w-full">
      <TournamentBracket 
        matches={uiMatches} 
        onMatchClick={(uiMatch) => {
          if (onMatchClick) {
            const originalMatch = matches.find(m => m.id === uiMatch.id);
            if (originalMatch) {
              onMatchClick(originalMatch);
            }
          }
        }} 
      />
    </div>
  );
}
