import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import ViewerDashboardPage from "./page";

vi.mock("@/features/football-tournaments/actions", () => ({
  logoutAdmin: vi.fn(),
  submitViewerMatchResult: vi.fn(),
}));

vi.mock("@/features/football-tournaments/data", () => ({
  getViewerAssignedMatches: vi.fn(async () => [
    {
      id: "match-1",
      categoryId: "category-1",
      tournamentId: "tournament-1",
      tournamentName: "Apertura Vixen",
      roundLabel: "Fecha 1",
      scheduledAt: null,
      homeTeamId: "team-1",
      awayTeamId: "team-2",
      homeTeamName: "Norte",
      awayTeamName: "Sur",
      homeScore: null,
      awayScore: null,
      homePenaltyScore: null,
      awayPenaltyScore: null,
      status: "scheduled",
      assignedViewerId: "viewer-1",
      resultLockedAt: null,
      resultSubmittedBy: null,
      isKnockout: false,
      rosterEntries: [],
    },
  ]),
}));

describe("ViewerDashboardPage", () => {
  it("renders assigned matches with a logout action", async () => {
    render(await ViewerDashboardPage());

    expect(
      screen.getByRole("heading", { name: "Mis partidos asignados" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Apertura Vixen · Fecha 1/)).toBeInTheDocument();
    // Cada equipo va en su propia línea, no en una sola frase.
    expect(screen.getByText("Norte")).toBeInTheDocument();
    expect(screen.getByText("Sur")).toBeInTheDocument();
    expect(screen.getByText("Sin fecha asignada")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Cerrar sesión" }),
    ).toBeInTheDocument();
  });
});
