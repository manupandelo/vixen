import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import AdminTournamentWorkspacePage from "./page";

vi.mock("next/navigation", async () => {
  const actual = await vi.importActual<typeof import("next/navigation")>(
    "next/navigation",
  );

  return {
    ...actual,
    notFound: vi.fn(() => {
      throw new Error("NEXT_NOT_FOUND");
    }),
    usePathname: vi.fn(() => "/admin/torneos/tournament-1"),
    useRouter: vi.fn(() => ({
      replace: vi.fn(),
    })),
    useSearchParams: vi.fn(() => new URLSearchParams()),
  };
});

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
  getAdminTournamentCategories: vi.fn(async () => [
    {
      id: "category-1",
      tournamentId: "tournament-1",
      name: "Primera",
      slug: "primera",
      status: "active",
      position: 1,
      startsAt: "2026-03-01",
      endsAt: "2026-06-30",
    },
  ]),
  getAdminRosterEntries: vi.fn(async () => [
    {
      id: "roster-1",
      tournamentId: "tournament-1",
      teamId: "team-1",
      playerId: "player-1",
      shirtNumber: 10,
      status: "active",
      medicalStatus: "pending",
      insuranceStatus: "approved",
      registeredAt: "2026-07-02T12:00:00-03:00",
      notes: null,
      player: {
        id: "player-1",
        firstName: "Juan",
        lastName: "Perez",
        publicName: null,
        documentNumber: null,
        birthDate: null,
        phone: null,
        notes: null,
      },
    },
  ]),
  formatMatchResultRosterEntry: vi.fn((entry) => ({
    id: entry.id,
    teamId: entry.teamId,
    playerId: entry.playerId,
    shirtNumber: entry.shirtNumber,
    displayName: entry.player.publicName ?? `${entry.player.firstName} ${entry.player.lastName}`,
  })),
  getAdminAvailablePlayers: vi.fn(async () => []),
  getAdminMatches: vi.fn(async () => []),
  getTournamentAuditEvents: vi.fn(async () => [
    {
      id: "audit-1",
      tournamentId: "tournament-1",
      actorProfileId: "admin-1",
      actorEmail: "admin@vixen.test",
      entityType: "tournament",
      entityId: "tournament-1",
      action: "updated",
      summary: "Actualizó datos del torneo",
      metadata: { changedFields: ["status"] },
      createdAt: "2026-07-01T12:30:00-03:00",
    },
  ]),
  getAdminViewers: vi.fn(async () => []),
}));

vi.mock("@/features/football-tournaments/actions", () => ({
  assignMatchViewer: vi.fn(),
  createMatch: vi.fn(),
  createTournamentCategory: vi.fn(),
  createRosterEntry: vi.fn(),
  createTeam: vi.fn(),
  deleteTournamentCategory: vi.fn(),
  removeTeamFromTournament: vi.fn(),
  deleteRosterEntry: vi.fn(),
  deleteTournament: vi.fn(),
  generateLeagueFixture: vi.fn(),
  generateBracketFixture: vi.fn(),
  generateGroupPlayoffFixture: vi.fn(),
  updateMatchResult: vi.fn(),
  updateMatch: vi.fn(),
  updateTournamentCategory: vi.fn(),
  updateRosterEntry: vi.fn(),
  deleteMatch: vi.fn(),
  updateTeam: vi.fn(),
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
      "/admin/torneos/tournament-1?category=primera",
    );
    expect(screen.getByRole("link", { name: "Resumen" }).className).toContain(
      "rounded-[0.72rem]",
    );
    expect(screen.getByRole("link", { name: "Equipos" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: "Partidos" })).toHaveAttribute(
      "href",
      "/admin/torneos/tournament-1?tab=partidos&category=primera",
    );
    expect(screen.getByRole("link", { name: "Actividad" })).toHaveAttribute(
      "href",
      "/admin/torneos/tournament-1?tab=actividad&category=primera",
    );
    expect(screen.getByText("Vixen Norte")).toBeInTheDocument();
    expect(screen.getByText("Plantel")).toBeInTheDocument();
    expect(screen.getByText("Juan Perez")).toBeInTheDocument();
    expect(screen.getByText("#10")).toBeInTheDocument();
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
      "/admin/torneos/tournament-1?tab=equipos&category=primera",
    );
  });

  it("shows tournament audit events in the activity tab", async () => {
    render(
      await AdminTournamentWorkspacePage({
        params: Promise.resolve({ id: "tournament-1" }),
        searchParams: Promise.resolve({ tab: "actividad" }),
      }),
    );

    expect(screen.getByText("Historial de cambios")).toBeInTheDocument();
    expect(screen.getByText("Actualizó datos del torneo")).toBeInTheDocument();
    expect(screen.getByText("admin@vixen.test")).toBeInTheDocument();
  });

  it("does not expose manual single-match creation from the matches tab", async () => {
    render(
      await AdminTournamentWorkspacePage({
        params: Promise.resolve({ id: "tournament-1" }),
        searchParams: Promise.resolve({ tab: "partidos" }),
      }),
    );

    expect(
      screen.queryByRole("button", { name: "Nuevo partido" }),
    ).not.toBeInTheDocument();
  });
});
