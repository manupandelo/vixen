import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { TournamentSummaryCard } from "./TournamentSummaryCard";
import type { PublicFootballTournament } from "@/features/football-tournaments/types";

function tournament(
  overrides: Partial<PublicFootballTournament> = {},
): PublicFootballTournament {
  return {
    id: "tournament-1",
    name: "Apertura Vixen",
    slug: "apertura-vixen",
    season: "2026",
    category: "Primera",
    format: "league",
    status: "active",
    startsAt: "2026-03-01",
    endsAt: null,
    description: "Liga semanal.",
    teams: [
      { id: "team-1", name: "Vixen Rojo", shortName: null },
      { id: "team-2", name: "La Banda", shortName: null },
    ],
    matches: [
      {
        id: "match-1",
        roundLabel: "Fecha 1",
        scheduledAt: "2026-04-12T18:30:00-03:00",
        homeTeamId: "team-1",
        awayTeamId: "team-2",
        homeTeamName: "Vixen Blanco",
        awayTeamName: "La Banda",
        homeTeamShortName: null,
        awayTeamShortName: null,
        homeScore: null,
        awayScore: null,
        status: "scheduled",
        isKnockout: false,
        nextMatchId: null,
      },
    ],
    standings: [],
    ...overrides,
  };
}

describe("TournamentSummaryCard", () => {
  it("links to the tournament detail and summarizes active tournament state", () => {
    render(<TournamentSummaryCard tournament={tournament()} />);

    expect(screen.getByRole("link", { name: /apertura vixen/i })).toHaveAttribute(
      "href",
      "/futbol/torneos/apertura-vixen",
    );
    expect(screen.getByText("En juego")).toBeInTheDocument();
    expect(
      screen.getByText((_, node) => node?.textContent === "Primera • 2 equipos"),
    ).toBeInTheDocument();
    expect(screen.getByText("Progreso")).toBeInTheDocument();
    expect(screen.getByText("Vixen Blanco")).toBeInTheDocument();
    expect(screen.getByText("La Banda")).toBeInTheDocument();
  });

  it("labels completed tournaments as public history", () => {
    render(
      <TournamentSummaryCard
        tournament={tournament({ status: "completed", matches: [] })}
      />,
    );

    expect(screen.getByText("Finalizado")).toBeInTheDocument();
    expect(screen.getByText("Historial disponible")).toBeInTheDocument();
  });
});
