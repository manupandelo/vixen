import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import AdminTournamentWorkspacePage from "./page";

vi.mock("@/features/football-tournaments/data", () => ({
  getAdminTournament: vi.fn(async () => ({
    id: "tournament-1",
    name: "Apertura 2026",
    slug: "apertura-2026",
    season: "2026",
    category: "Primera",
    format: "league",
    status: "draft",
    startsAt: "2026-03-01",
    endsAt: "2026-06-30",
    description: null,
  })),
  getAdminTeams: vi.fn(async () => [
    {
      id: "team-1",
      name: "Vixen Norte",
      shortName: "VXN",
      photoUrl: null,
      captainName: "Ana",
      contactPhone: "+54 11 5555-1111",
      notes: null,
    },
  ]),
  getAdminAvailableTeams: vi.fn(async () => []),
  getAdminMatches: vi.fn(async () => []),
  getAdminViewers: vi.fn(async () => []),
}));

vi.mock("@/features/football-tournaments/actions", () => ({
  assignMatchViewer: vi.fn(),
  createMatch: vi.fn(),
  createTeam: vi.fn(),
  deleteTournament: vi.fn(),
  generateLeagueFixture: vi.fn(),
  updateMatchResult: vi.fn(),
  updateTournament: vi.fn(),
}));

describe("AdminTournamentWorkspacePage", () => {
  it("keeps tournament work inside a tabbed workspace", async () => {
    render(
      await AdminTournamentWorkspacePage({
        params: Promise.resolve({ id: "tournament-1" }),
        searchParams: Promise.resolve({ tab: "equipos" }),
      }),
    );

    expect(
      screen.getByRole("heading", { name: "Apertura 2026" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Secciones del torneo" }).className).toContain("rounded-[0.95rem]");
    expect(screen.getByRole("navigation", { name: "Secciones del torneo" }).className).toContain("bg-white/[0.035]");
    expect(screen.getByRole("link", { name: "Resumen" })).toHaveAttribute(
      "href",
      "/admin/torneos/tournament-1",
    );
    expect(screen.getByRole("link", { name: "Resumen" }).className).toContain(
      "rounded-[0.72rem]",
    );
    expect(screen.getByRole("link", { name: "Datos" })).toHaveAttribute(
      "href",
      "/admin/torneos/tournament-1?tab=datos",
    );
    expect(screen.getByRole("link", { name: "Equipos" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: "Partidos" })).toHaveAttribute(
      "href",
      "/admin/torneos/tournament-1?tab=partidos",
    );
    expect(screen.getByText("Vixen Norte")).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Ver partidos" }),
    ).not.toBeInTheDocument();
  });

  it("uses the shared pending-item pattern for the next tournament action", async () => {
    render(
      await AdminTournamentWorkspacePage({
        params: Promise.resolve({ id: "tournament-1" }),
        searchParams: Promise.resolve({ tab: "resumen" }),
      }),
    );

    const item = screen.getByTestId("admin-action-item");

    expect(screen.getByText("Completar equipos")).toBeInTheDocument();
    expect(item).toHaveAttribute(
      "href",
      "/admin/torneos/tournament-1?tab=equipos",
    );
  });
});
