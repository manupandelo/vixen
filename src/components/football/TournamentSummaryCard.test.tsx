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
      screen.queryByText(
        (_, node) => node?.textContent === "Primera • 2 equipos",
      ),
    ).not.toBeInTheDocument();
    expect(
      screen.getAllByText((_, node) => node?.textContent === "Primera · 2 equipos").length
    ).toBeGreaterThan(0);
    expect(screen.queryByText("Progreso")).not.toBeInTheDocument();
    expect(screen.getByText("0 / 1 partidos")).toBeInTheDocument();
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
    expect(screen.getByText("Resultados")).toBeInTheDocument();
    expect(screen.getByText("Sin partidos")).toBeInTheDocument();
  });

  it("handles missing date and missing team names gracefully", () => {
    render(
      <TournamentSummaryCard
        tournament={tournament({
          matches: [
            {
              id: "match-1",
              roundLabel: "Fecha 1",
              scheduledAt: null,
              homeTeamId: null,
              awayTeamId: null,
              homeTeamName: null,
              awayTeamName: null,
              homeTeamShortName: null,
              awayTeamShortName: null,
              homeScore: null,
              awayScore: null,
              status: "scheduled",
              isKnockout: false,
              nextMatchId: null,
            },
          ],
        })}
      />,
    );

    expect(screen.getAllByText((_, node) => node?.textContent?.includes("Próximo partido · Fecha 1") ?? false).length).toBeGreaterThan(0);
    expect(screen.getByText("Fecha a confirmar")).toBeInTheDocument();
    expect(screen.getAllByText("Por definir")).toHaveLength(2);
  });

  it("renders a single category as an explicit link", () => {
    render(
      <TournamentSummaryCard
        tournament={tournament({
          categories: [{ name: "Primera", slug: "primera" }],
        })}
      />
    );

    const link = screen.getByRole("link", { name: "Primera" });
    expect(link).toHaveAttribute("href", "/futbol/torneos/apertura-vixen/primera");
  });

  it("renders multiple categories as separate links if under the limit", () => {
    render(
      <TournamentSummaryCard
        tournament={tournament({
          categories: [
            { name: "Primera", slug: "primera" },
            { name: "Segunda", slug: "segunda" },
          ],
        })}
      />
    );

    const link1 = screen.getByRole("link", { name: "Primera" });
    const link2 = screen.getByRole("link", { name: "Segunda" });
    expect(link1).toHaveAttribute("href", "/futbol/torneos/apertura-vixen/primera");
    expect(link2).toHaveAttribute("href", "/futbol/torneos/apertura-vixen/segunda");
  });

  it("renders a single fallback link if there are many categories", () => {
    render(
      <TournamentSummaryCard
        tournament={tournament({
          categories: [
            { name: "Cat 1", slug: "cat-1" },
            { name: "Cat 2", slug: "cat-2" },
            { name: "Cat 3", slug: "cat-3" },
            { name: "Cat 4", slug: "cat-4" },
          ],
        })}
      />
    );

    const link1 = screen.getByRole("link", { name: "Cat 1" });
    const link4 = screen.getByRole("link", { name: "Cat 4" });
    expect(link1).toHaveAttribute("href", "/futbol/torneos/apertura-vixen/cat-1");
    expect(link4).toHaveAttribute("href", "/futbol/torneos/apertura-vixen/cat-4");
  });
});
