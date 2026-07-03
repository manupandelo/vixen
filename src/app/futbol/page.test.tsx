import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import FutbolPage from "./page";
import type { PublicFootballTournament } from "@/features/football-tournaments/types";

const activeTournament: PublicFootballTournament = {
  id: "tournament-1",
  name: "Apertura Vixen",
  slug: "apertura-vixen",
  season: "2026",
  category: "Primera",
  format: "league",
  status: "active",
  startsAt: "2026-03-01",
  endsAt: null,
  description: null,
  teams: [{ id: "team-1", name: "Vixen Rojo", shortName: null }],
  matches: [],
  standings: [],
};

vi.mock("@/features/football-tournaments/data", () => ({
  getActivePublicFootballTournaments: vi.fn(async () => [activeTournament]),
}));

describe("FutbolPage", () => {
  it("keeps the landing page focused with active tournament summaries", async () => {
    render(await FutbolPage());

    expect(
      screen.getByRole("img", { name: "Partido de fútbol 7 en Vixen Club" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Inscripción 2026 Abierta")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ver torneos activos" })).toHaveAttribute(
      "href",
      "#torneos",
    );
    expect(screen.getByText("Torneos activos")).toBeInTheDocument();
    expect(
      screen
        .getByText("Torneos activos")
        .compareDocumentPosition(screen.getByText(/masculino y femenino/i)) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(screen.getByText("Apertura Vixen")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Ver todos los torneos" }),
    ).toHaveAttribute("href", "/futbol/torneos");
    expect(screen.queryByText("Fixture y posiciones")).not.toBeInTheDocument();
  });
});
