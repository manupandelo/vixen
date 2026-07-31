import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import AdminTournamentWorkspacePage from "./page";
import {
  getAdminFixtureStructureState,
  getAdminMatches,
  getAdminTeams,
  getAdminTournament,
} from "@/features/football-tournaments/data";

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
  getAdminFixtureStructureState: vi.fn(async () => ({
    matchCount: 0,
    groupCount: 0,
    hasStructure: false,
  })),
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
    // El plantel salió de la card: ahora se abre en un drawer aparte.
    const rosterButton = screen.getByRole("button", { name: /ver plantel/i });
    expect(rosterButton).toBeInTheDocument();
    expect(screen.getByText("1 jugador")).toBeInTheDocument();

    await userEvent.click(rosterButton);

    expect(
      await screen.findByRole("dialog", { name: /plantel de vixen norte/i }),
    ).toBeInTheDocument();
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

  it("routes league plus playoff tournaments to the zones plus playoff generator", async () => {
    vi.mocked(getAdminTournament).mockResolvedValueOnce({
      id: "tournament-1",
      name: "Apertura 2026",
      slug: "apertura-2026",
      season: "2026",
      category: "Primera",
      format: "league_playoff",
      status: "draft",
      startsAt: "2026-03-01",
      endsAt: "2026-06-30",
      description: null,
    });
    vi.mocked(getAdminTeams).mockResolvedValueOnce([
      {
        id: "team-1",
        name: "Vixen Norte",
        shortName: "VXN",
        photoUrl: null,
        captainName: "Ana",
        contactPhone: "+54 11 5555-1111",
        notes: null,
      },
      {
        id: "team-2",
        name: "Vixen Sur",
        shortName: "VXS",
        photoUrl: null,
        captainName: "Luis",
        contactPhone: "+54 11 5555-2222",
        notes: null,
      },
    ]);

    render(
      await AdminTournamentWorkspacePage({
        params: Promise.resolve({ id: "tournament-1" }),
        searchParams: Promise.resolve({ tab: "partidos" }),
      }),
    );

    expect(
      screen.getByRole("button", { name: "Generar zonas + playoff" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Armar Llave" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(/partidos manuales/i),
    ).not.toBeInTheDocument();
  });

  it("disables fixture generation when a category already has structure", async () => {
    vi.mocked(getAdminFixtureStructureState).mockResolvedValueOnce({
      matchCount: 0,
      groupCount: 2,
      hasStructure: true,
    });

    render(
      await AdminTournamentWorkspacePage({
        params: Promise.resolve({ id: "tournament-1" }),
        searchParams: Promise.resolve({ tab: "partidos" }),
      }),
    );

    expect(
      screen.getByText("Ya existe una estructura inicial para esta categoría."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Generar fixture" }),
    ).toBeDisabled();
  });

  it("shows category scoring and discipline stats in the matches tab", async () => {
    vi.mocked(getAdminMatches).mockResolvedValueOnce([
      {
        id: "match-1",
        categoryId: "category-1",
        roundLabel: "Fecha 1",
        scheduledAt: "2026-07-06T20:00:00-03:00",
        homeTeamId: "team-1",
        awayTeamId: "team-2",
        homeScore: 2,
        awayScore: 1,
        homePenaltyScore: null,
        awayPenaltyScore: null,
        status: "completed",
        assignedViewerId: null,
        resultLockedAt: null,
        resultSubmittedBy: null,
        nextMatchId: null,
        isKnockout: false,
        events: [
          {
            rosterEntryId: "roster-1",
            playerId: "player-1",
            teamId: "team-1",
            eventType: "goal",
            quantity: 2,
          },
          {
            rosterEntryId: "roster-1",
            playerId: "player-1",
            teamId: "team-1",
            eventType: "yellow_card",
            quantity: 1,
          },
        ],
      },
    ]);

    render(
      await AdminTournamentWorkspacePage({
        params: Promise.resolve({ id: "tournament-1" }),
        searchParams: Promise.resolve({ tab: "partidos" }),
      }),
    );

    expect(screen.getByText("Estadísticas de categoría")).toBeInTheDocument();
    expect(screen.getByText("Goleadores")).toBeInTheDocument();
    expect(screen.getByText("Disciplina")).toBeInTheDocument();
    expect(screen.getAllByText("Juan Perez")).toHaveLength(2);
    expect(screen.getByText("2 goles")).toBeInTheDocument();
    expect(screen.getByText("1 amarilla")).toBeInTheDocument();
  });
});
