import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MatchList } from "./MatchList";
import type { PublicFootballMatch } from "@/features/football-tournaments/types";

const matches: PublicFootballMatch[] = [
  {
    id: "match-1",
    roundLabel: "Fecha 1",
    scheduledAt: "2026-04-12T18:30:00-03:00",
    homeTeamId: "team-1",
    awayTeamId: "team-2",
    homeTeamName: "Vixen Rojo",
    awayTeamName: "La Banda",
    homeScore: 3,
    awayScore: 1,
    status: "completed",
  },
  {
    id: "match-2",
    roundLabel: "Fecha 2",
    scheduledAt: null,
    homeTeamId: "team-3",
    awayTeamId: "team-4",
    homeTeamName: "Norte FC",
    awayTeamName: "Sur FC",
    homeScore: null,
    awayScore: null,
    status: "postponed",
  },
];

describe("MatchList", () => {
  it("renders completed scores and Spanish dates", () => {
    render(<MatchList title="Últimos resultados" matches={[matches[0]]} />);

    expect(screen.getByText("Últimos resultados")).toBeInTheDocument();
    expect(screen.getByText("Fecha 1")).toBeInTheDocument();
    expect(screen.getByText(/Vixen Rojo/, { selector: "p" })).toHaveTextContent(
      /La Banda/,
    );
    expect(screen.getByText("3 - 1")).toBeInTheDocument();
    expect(screen.getByText(/12 de abr de 2026/i)).toBeInTheDocument();
  });

  it("renders readable status labels and null dates", () => {
    render(<MatchList title="Próximos partidos" matches={[matches[1]]} />);

    expect(screen.getByText("A confirmar")).toBeInTheDocument();
    expect(screen.getByText("Postergado")).toBeInTheDocument();
  });
});
