import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import AdminTournamentsPage from "./page";

vi.mock("@/features/football-tournaments/data", () => ({
  getAdminTournaments: vi.fn(async () => [
    {
      id: "tournament-1",
      name: "Torneo Apertura 2026",
      slug: "torneo-apertura-2026",
      season: "2026",
      category: "1 A",
      format: "league",
      status: "draft",
      startsAt: "2026-07-01",
      endsAt: "2026-12-31",
      description: null,
    },
  ]),
}));

describe("AdminTournamentsPage", () => {
  it("uses the tournament row as the primary link to the workspace", async () => {
    render(await AdminTournamentsPage());

    const tournamentLink = screen.getByRole("link", {
      name: /Torneo Apertura 2026/i,
    });

    expect(tournamentLink).toHaveAttribute(
      "href",
      "/admin/torneos/tournament-1",
    );
    expect(tournamentLink.className).toContain("grid");
    expect(screen.queryByRole("link", { name: "Editar" })).not.toBeInTheDocument();
  });
});
