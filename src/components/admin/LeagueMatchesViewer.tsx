"use client";

import { useState } from "react";
import type {
  AdminMatch,
  AdminTeam,
  MatchResultRosterEntry,
  StaffProfile,
} from "@/features/football-tournaments/data";
import type { UIFootballMatch } from "@/features/football-tournaments/types";
import { updateMatch, updateMatchResult, assignMatchViewer } from "@/features/football-tournaments/actions";
import { MatchSidePanel } from "./MatchSidePanel";
import { TournamentFixture } from "@/components/football/shared/TournamentFixture";

type LeagueMatchesViewerProps = {
  teams: Pick<AdminTeam, "id" | "name">[];
  matches: AdminMatch[];
  viewers: StaffProfile[];
  rosterEntries: MatchResultRosterEntry[];
  tournamentId: string;
};

export function LeagueMatchesViewer({
  teams,
  matches,
  viewers,
  rosterEntries,
  tournamentId,
}: LeagueMatchesViewerProps) {
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
        <TournamentFixture 
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
          isKnockout={false}
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
