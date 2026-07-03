"use client";

import { useState } from "react";
import type {
  AdminMatch,
  AdminTeam,
  MatchResultRosterEntry,
  StaffProfile,
} from "@/features/football-tournaments/data";
import type { UIFootballMatch } from "@/features/football-tournaments/types";
import { assignMatchViewer, updateMatch, updateMatchResult } from "@/features/football-tournaments/actions";
import { MatchSidePanel } from "./MatchSidePanel";
import { TournamentBracket } from "@/components/football/shared/TournamentBracket";

type BracketResultsViewerProps = {
  teams: Pick<AdminTeam, "id" | "name">[];
  matches: AdminMatch[];
  viewers: StaffProfile[];
  rosterEntries: MatchResultRosterEntry[];
  tournamentId: string;
};

export function BracketResultsViewer({
  teams,
  matches,
  viewers,
  rosterEntries,
  tournamentId,
}: BracketResultsViewerProps) {
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);

  const getTeamName = (id: string | null) => {
    if (!id) return null;
    return teams.find((t) => t.id === id)?.name || null;
  };

  const uiMatches: UIFootballMatch[] = matches.map(match => ({
    ...match,
    homeTeamName: getTeamName(match.homeTeamId),
    awayTeamName: getTeamName(match.awayTeamId),
  }));

  const selectedMatch = matches.find((m) => m.id === selectedMatchId);

  return (
    <div className="flex gap-4">
      <div className="flex-1 min-w-0">
        <TournamentBracket 
          matches={uiMatches} 
          onMatchClick={(m) => setSelectedMatchId(m.id)}
          selectedMatchId={selectedMatchId}
        />
      </div>

      {selectedMatch ? (
        <MatchSidePanel
          match={selectedMatch}
          teams={teams}
          viewers={viewers}
          rosterEntries={rosterEntries}
          isKnockout
          roundLabel={selectedMatch.roundLabel}
          updateResultAction={updateMatchResult.bind(null, tournamentId, selectedMatch.id)}
          assignViewerAction={assignMatchViewer.bind(null, tournamentId, selectedMatch.id)}
          updateMatchAction={updateMatch.bind(null, tournamentId, selectedMatch.id)}
          onClose={() => setSelectedMatchId(null)}
        />
      ) : null}
    </div>
  );
}
