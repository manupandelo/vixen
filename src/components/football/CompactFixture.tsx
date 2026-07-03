"use client";

import { useState } from "react";
import type { PublicFootballMatch } from "@/features/football-tournaments/types";
import { PublicMatchDetailOverlay } from "./PublicMatchDetailOverlay";
import { TournamentFixture } from "@/components/football/shared/TournamentFixture";
import type { UIFootballMatch } from "@/features/football-tournaments/types";

export function CompactFixture({
  matches,
  onMatchClick,
}: {
  matches: PublicFootballMatch[];
  onMatchClick?: (match: PublicFootballMatch) => void;
}) {
  const [selectedMatch, setSelectedMatch] = useState<PublicFootballMatch | null>(null);

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

  const handleMatchClick = (uiMatch: UIFootballMatch) => {
    const originalMatch = matches.find(m => m.id === uiMatch.id);
    if (originalMatch) {
      if (onMatchClick) {
        onMatchClick(originalMatch);
      } else {
        setSelectedMatch(originalMatch);
      }
    }
  };

  return (
    <>
      <TournamentFixture 
        matches={uiMatches} 
        onMatchClick={handleMatchClick} 
      />

      {!onMatchClick && (
        <PublicMatchDetailOverlay 
          match={selectedMatch} 
          open={!!selectedMatch} 
          onOpenChange={(open) => !open && setSelectedMatch(null)} 
        />
      )}
    </>
  );
}
