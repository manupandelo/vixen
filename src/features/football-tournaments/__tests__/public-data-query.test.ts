import { describe, expect, it, vi } from "vitest";

const createSupabasePublicClientMock = vi.hoisted(() => vi.fn());
const fromMock = vi.hoisted(() => vi.fn());
const selectMock = vi.hoisted(() => vi.fn());
const eqMock = vi.hoisted(() => vi.fn());
const inMock = vi.hoisted(() => vi.fn());
const maybeSingleMock = vi.hoisted(() => vi.fn());
const orderMock = vi.hoisted(() => vi.fn());
const unstableCacheRegistrations = vi.hoisted(
  () =>
    [] as Array<{
      keyParts?: string[];
      options?: { revalidate?: number | false; tags?: string[] };
    }>,
);
const unstableCacheMock = vi.hoisted(() =>
  vi.fn((callback, keyParts, options) => {
    unstableCacheRegistrations.push({ keyParts, options });
    return callback;
  }),
);

vi.mock("@/lib/supabase/public", () => ({
  createSupabasePublicClient: createSupabasePublicClientMock,
}));

vi.mock("next/cache", () => ({
  unstable_cache: unstableCacheMock,
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
    createSupabasePublicClientMock.mockReturnValue({ from: fromMock });
  }

  it("registers public tournament reads with a shared persistent cache tag", () => {
    expect(unstableCacheMock).toHaveBeenCalled();
    expect(unstableCacheRegistrations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          keyParts: ["public-football-tournaments"],
          options: { revalidate: 60, tags: ["football-public"] },
        }),
        expect.objectContaining({
          keyParts: ["active-public-football-tournaments"],
          options: { revalidate: 60, tags: ["football-public"] },
        }),
        expect.objectContaining({
          keyParts: ["public-football-tournament-by-slug"],
          options: { revalidate: 60, tags: ["football-public"] },
        }),
      ]),
    );
  });

  it("uses the lightweight summary select for public tournament listings", async () => {
    mockListQuery();

    await getPublicFootballTournaments();

    const select = selectMock.mock.calls.at(-1)?.[0] as string;
    expect(select).toContain("group_id");
    expect(select).not.toContain("is_knockout");
    expect(select).not.toContain("photo_url");
  });

  it("keeps full team photo data on public tournament detail reads", async () => {
    maybeSingleMock.mockResolvedValue({ data: null, error: null });
    eqMock.mockReturnValue({ maybeSingle: maybeSingleMock });
    inMock.mockReturnValue({ eq: eqMock });
    selectMock.mockReturnValue({ in: inMock });
    fromMock.mockReturnValue({ select: selectMock });
    createSupabasePublicClientMock.mockReturnValue({ from: fromMock });

    await getPublicFootballTournamentBySlug("apertura-2026");

    const select = selectMock.mock.calls.at(-1)?.[0] as string;
    expect(select).toContain("photo_url");
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
    createSupabasePublicClientMock.mockReturnValue({ from: fromMock });

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
