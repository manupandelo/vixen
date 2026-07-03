import { describe, expect, it, vi } from "vitest";

const createSupabaseServerClientMock = vi.hoisted(() => vi.fn());
const fromMock = vi.hoisted(() => vi.fn());
const selectMock = vi.hoisted(() => vi.fn());
const eqMock = vi.hoisted(() => vi.fn());
const inMock = vi.hoisted(() => vi.fn());
const maybeSingleMock = vi.hoisted(() => vi.fn());
const orderMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: createSupabaseServerClientMock,
}));

import {
  getActivePublicFootballTournaments,
  getPublicFootballTournamentBySlug,
  getPublicFootballTournaments,
} from "../data";

describe("getPublicFootballTournaments", () => {
  function mockListQuery() {
    orderMock.mockResolvedValue({ data: [], error: null });
    inMock.mockReturnValue({ order: orderMock });
    selectMock.mockReturnValue({ in: inMock });
    fromMock.mockReturnValue({ select: selectMock });
    createSupabaseServerClientMock.mockResolvedValue({ from: fromMock });
  }

  it("selects only columns that exist on football_matches", async () => {
    mockListQuery();

    await getPublicFootballTournaments();

    const select = selectMock.mock.calls[0]?.[0] as string;
    expect(select).toContain("group_id");
    expect(select).not.toContain("is_knockout");
  });

  it("loads active landing tournaments without archived or completed rows", async () => {
    mockListQuery();

    await getActivePublicFootballTournaments();

    expect(inMock).toHaveBeenCalledWith("status", ["published", "active"]);
  });

  it("loads a public tournament detail by slug without exposing archived rows", async () => {
    maybeSingleMock.mockResolvedValue({ data: null, error: null });
    eqMock.mockReturnValue({ maybeSingle: maybeSingleMock });
    inMock.mockReturnValue({ eq: eqMock });
    selectMock.mockReturnValue({ in: inMock });
    fromMock.mockReturnValue({ select: selectMock });
    createSupabaseServerClientMock.mockResolvedValue({ from: fromMock });

    const tournament = await getPublicFootballTournamentBySlug("apertura-2026");

    expect(tournament).toBeNull();
    expect(inMock).toHaveBeenCalledWith("status", [
      "published",
      "active",
      "completed",
    ]);
    expect(eqMock).toHaveBeenCalledWith("slug", "apertura-2026");
  });
});
