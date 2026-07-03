import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import TournamentsPage from "./page";
import type { PublicFootballTournament } from "@/features/football-tournaments/types";

function tournament(
  status: PublicFootballTournament["status"],
  name: string,
): PublicFootballTournament {
  return {
    id: name,
    name,
    slug: name.toLowerCase().replaceAll(" ", "-"),
    season: "2026",
    category: "Primera",
    format: "league",
    status,
    startsAt: null,
    endsAt: null,
    description: null,
    teams: [],
    matches: [],
    standings: [],
  };
}

vi.mock("@/features/football-tournaments/data", () => ({
  getPublicFootballTournaments: vi.fn(async () => [
    tournament("active", "Apertura Activo"),
    tournament("completed", "Clausura Finalizado"),
  ]),
}));

describe("TournamentsPage", () => {
  it("groups active and completed public tournaments without archived rows", async () => {
    render(await TournamentsPage());

    expect(
      screen.getByRole("heading", { name: "Torneos de fútbol" }),
    ).toBeInTheDocument();
    expect(screen.getAllByText("En juego").length).toBeGreaterThan(0);
    expect(screen.getByText("Historial")).toBeInTheDocument();
    expect(screen.getByText("Apertura Activo")).toBeInTheDocument();
    expect(screen.getByText("Clausura Finalizado")).toBeInTheDocument();
    expect(screen.queryByText(/archivad/i)).not.toBeInTheDocument();
  });
});
