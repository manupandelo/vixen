import { notFound, redirect } from "next/navigation";
import { describe, expect, it, vi } from "vitest";

import TournamentDetailPage from "./page";
import type { PublicFootballTournament } from "@/features/football-tournaments/types";
import type { AdminTournamentCategory } from "@/features/football-tournaments/data";

const getPublicFootballTournamentWithCategoriesBySlugMock = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
  redirect: vi.fn(() => {
    throw new Error("NEXT_REDIRECT");
  }),
}));

vi.mock("@/features/football-tournaments/data", () => ({
  getPublicFootballTournamentWithCategoriesBySlug: getPublicFootballTournamentWithCategoriesBySlugMock,
}));

const tournament: PublicFootballTournament = {
  id: "tournament-1",
  name: "Apertura Vixen",
  slug: "apertura-vixen",
  season: "2026",
  category: "Primera",
  format: "league",
  status: "completed",
  startsAt: null,
  endsAt: null,
  description: "Torneo finalizado.",
  teams: [],
  matches: [],
  standings: [],
};

const category: AdminTournamentCategory = {
  id: "category-1",
  tournamentId: "tournament-1",
  name: "Primera",
  slug: "primera",
  status: "published",
  position: 0,
  startsAt: null,
  endsAt: null,
};

describe("TournamentDetailPage", () => {
  it("redirects to the first category", async () => {
    getPublicFootballTournamentWithCategoriesBySlugMock.mockResolvedValue([tournament, [category]]);

    await expect(
      TournamentDetailPage({
        params: Promise.resolve({ slug: "apertura-vixen" }),
      }),
    ).rejects.toThrow("NEXT_REDIRECT");

    expect(redirect).toHaveBeenCalledWith("/futbol/torneos/apertura-vixen/primera");
  });

  it("uses notFound when the slug is not publicly visible", async () => {
    getPublicFootballTournamentWithCategoriesBySlugMock.mockResolvedValue(null);

    await expect(
      TournamentDetailPage({
        params: Promise.resolve({ slug: "torneo-archivado" }),
      }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
    expect(notFound).toHaveBeenCalled();
  });
});
