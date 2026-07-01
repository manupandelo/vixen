import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PublicTournamentPanel } from "./PublicTournamentPanel";
import type {
  PublicFootballMatch,
  PublicFootballTournament,
  StandingRow,
} from "@/features/football-tournaments/types";

const standings: StandingRow[] = [
  {
    teamId: "team-1",
    teamName: "Vixen Rojo",
    played: 1,
    won: 1,
    drawn: 0,
    lost: 0,
    goalsFor: 2,
    goalsAgainst: 0,
    goalDifference: 2,
    points: 3,
  },
];

function match(
  id: string,
  status: PublicFootballMatch["status"],
  scheduledAt: string | null,
): PublicFootballMatch {
  return {
    id,
    roundLabel: `Fecha ${id}`,
    scheduledAt,
    homeTeamId: "team-1",
    awayTeamId: "team-2",
    homeTeamName: `Local ${id}`,
    awayTeamName: `Visitante ${id}`,
    homeScore: status === "completed" ? 2 : null,
    awayScore: status === "completed" ? 0 : null,
    status,
  };
}

const tournament: PublicFootballTournament = {
  id: "tournament-1",
  name: "Apertura Vixen",
  slug: "apertura-vixen",
  season: "2026",
  category: "Fútbol 7 Masculino",
  format: "league_playoff",
  status: "active",
  startsAt: "2026-03-01",
  endsAt: null,
  description: "Liga semanal en Pilar.",
  teams: [],
  standings,
  matches: [
    match("1", "completed", "2026-03-01T18:00:00-03:00"),
    match("2", "completed", "2026-03-08T18:00:00-03:00"),
    match("3", "completed", "2026-03-15T18:00:00-03:00"),
    match("4", "completed", "2026-03-22T18:00:00-03:00"),
    match("5", "completed", "2026-03-29T18:00:00-03:00"),
    match("6", "completed", "2026-04-05T18:00:00-03:00"),
    match("7", "scheduled", "2026-04-12T18:00:00-03:00"),
    match("8", "scheduled", "2026-04-19T18:00:00-03:00"),
    match("9", "scheduled", "2026-04-26T18:00:00-03:00"),
    match("10", "scheduled", "2026-05-03T18:00:00-03:00"),
    match("11", "scheduled", "2026-05-10T18:00:00-03:00"),
    match("12", "scheduled", "2026-05-17T18:00:00-03:00"),
  ],
};

describe("PublicTournamentPanel", () => {
  it("shows tournament metadata, standings, first upcoming matches, and latest completed matches", () => {
    render(<PublicTournamentPanel tournament={tournament} />);

    expect(screen.getByText("Apertura Vixen")).toBeInTheDocument();
    expect(screen.getByText("Fútbol 7 Masculino")).toBeInTheDocument();
    expect(screen.getByText("Liga con playoff")).toBeInTheDocument();
    expect(screen.getByText("Temporada 2026")).toBeInTheDocument();
    expect(screen.getByText("Liga semanal en Pilar.")).toBeInTheDocument();
    expect(screen.getByText("Vixen Rojo")).toBeInTheDocument();

    expect(screen.getByText(/Local 7/, { selector: "p" })).toBeInTheDocument();
    expect(screen.getByText(/Local 11/, { selector: "p" })).toBeInTheDocument();
    expect(
      screen.queryByText(/Local 12/, { selector: "p" }),
    ).not.toBeInTheDocument();

    expect(screen.getByText(/Local 6/, { selector: "p" })).toBeInTheDocument();
    expect(screen.getByText(/Local 2/, { selector: "p" })).toBeInTheDocument();
    expect(
      screen.queryByText((_, node) => {
        if (node?.tagName !== "P") return false;
        return node.textContent === "Local 1vsVisitante 1";
      }),
    ).not.toBeInTheDocument();
  });
});
