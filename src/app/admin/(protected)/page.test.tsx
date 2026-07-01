import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import AdminDashboardPage from "./page";

vi.mock("@/features/football-tournaments/data", () => ({
  getAdminDashboardSummary: vi.fn(async () => ({
    metrics: {
      totalTournaments: 2,
      activeTournaments: 1,
      publishedTournaments: 1,
      draftTournaments: 0,
      totalMatches: 4,
      completedMatches: 2,
      pendingResults: 2,
      overdueResults: 1,
      resultProgress: 50,
      activeViewers: 2,
      admins: 1,
    },
    nextMatch: {
      id: "match-3",
      tournamentId: "tournament-1",
      tournamentName: "Apertura 2026",
      roundLabel: "Fecha 3",
      scheduledAt: "2026-07-02T20:00:00-03:00",
    },
    recentTournaments: [
      {
        id: "tournament-1",
        name: "Apertura 2026",
        slug: "apertura-2026",
        season: "2026",
        category: "Primera",
        format: "league",
        status: "active",
        startsAt: "2026-03-01",
        endsAt: "2026-06-30",
        description: null,
      },
    ],
    attentionItems: [
      {
        title: "Cargar resultados pendientes",
        description: "Hay 1 partido pasado sin resultado final.",
        href: "/admin/torneos/tournament-1?tab=partidos",
        tone: "warning",
      },
    ],
  })),
}));

vi.mock("@/features/football-tournaments/actions", () => ({
  pingAdminAccess: vi.fn(),
}));

describe("AdminDashboardPage", () => {
  it("shows an operational dashboard with calculated tournament metrics", async () => {
    render(await AdminDashboardPage());

    expect(
      screen.getByRole("heading", { name: "Torneos de fútbol" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Resultados cargados")).toBeInTheDocument();
    expect(screen.getByText("2/4")).toBeInTheDocument();
    expect(screen.getAllByText(/50%/).length).toBeGreaterThan(0);
    expect(screen.getByText("Estado del día")).toBeInTheDocument();
    expect(screen.getByText("Hay resultados para cargar")).toBeInTheDocument();
    expect(screen.getByText("Próxima fecha")).toBeInTheDocument();
    expect(screen.getAllByText("Fecha 3").length).toBeGreaterThan(0);
    expect(screen.getByText("Qué revisar")).toBeInTheDocument();
    expect(screen.getByText("Cargar resultados pendientes")).toBeInTheDocument();
    expect(
      screen.getByText("Hay 1 partido pasado sin resultado final."),
    ).toBeInTheDocument();
    expect(screen.getByTestId("admin-action-item")).toHaveAttribute(
      "href",
      "/admin/torneos/tournament-1?tab=partidos",
    );
    expect(
      screen.queryByText("Cargar sin saltearse etapas"),
    ).not.toBeInTheDocument();
  });
});
