import { describe, expect, it } from "vitest";

import { buildGroupPlayoffFixture, buildLeagueFixture } from "../fixture";

const teams = [
  { id: "team-1", name: "Vixen Norte" },
  { id: "team-2", name: "Vixen Sur" },
  { id: "team-3", name: "Vixen Este" },
  { id: "team-4", name: "Vixen Oeste" },
];

describe("buildLeagueFixture", () => {
  it("creates one-leg round-robin rounds without duplicated pairings", () => {
    const fixture = buildLeagueFixture(teams, {
      legs: 1,
      startsAt: null,
      kickoffTime: null,
      daysBetweenRounds: 7,
    });

    expect(fixture).toHaveLength(3);
    expect(fixture.flatMap((round) => round.matches)).toHaveLength(6);
    expect(fixture.map((round) => round.label)).toEqual([
      "Fecha 1",
      "Fecha 2",
      "Fecha 3",
    ]);

    const pairings = fixture
      .flatMap((round) => round.matches)
      .map((match) => [match.homeTeamId, match.awayTeamId].sort().join("-"));

    expect(new Set(pairings).size).toBe(6);
  });

  it("adds byes for odd team counts and never schedules the bye team", () => {
    const fixture = buildLeagueFixture(teams.slice(0, 3), {
      legs: 1,
      startsAt: "2026-03-01",
      kickoffTime: "20:30",
      daysBetweenRounds: 7,
    });

    expect(fixture).toHaveLength(3);
    expect(fixture.flatMap((round) => round.matches)).toHaveLength(3);
    expect(fixture.map((round) => round.scheduledAt)).toEqual([
      "2026-03-01T20:30:00-03:00",
      "2026-03-08T20:30:00-03:00",
      "2026-03-15T20:30:00-03:00",
    ]);
    expect(
      fixture.every((round) =>
        round.matches.every(
          (match) => match.homeTeamId !== "bye" && match.awayTeamId !== "bye",
        ),
      ),
    ).toBe(true);
  });
});

describe("buildGroupPlayoffFixture", () => {
  it("distributes teams into balanced groups and generates group matches", () => {
    const fixture = buildGroupPlayoffFixture(
      [
        ...teams,
        { id: "team-5", name: "Vixen Centro" },
        { id: "team-6", name: "Vixen Sur B" },
      ],
      {
        groupCount: 2,
        qualifiersPerGroup: 2,
        startsAt: "2026-03-01",
        kickoffTime: "20:30",
        daysBetweenGroupRounds: 7,
        daysBetweenPlayoffRounds: 7,
      },
    );

    expect(fixture.groups).toEqual([
      {
        id: "group-1",
        name: "Zona A",
        position: 1,
        teams: [
          { id: "team-1", name: "Vixen Norte", seed: 1 },
          { id: "team-3", name: "Vixen Este", seed: 2 },
          { id: "team-5", name: "Vixen Centro", seed: 3 },
        ],
      },
      {
        id: "group-2",
        name: "Zona B",
        position: 2,
        teams: [
          { id: "team-2", name: "Vixen Sur", seed: 1 },
          { id: "team-4", name: "Vixen Oeste", seed: 2 },
          { id: "team-6", name: "Vixen Sur B", seed: 3 },
        ],
      },
    ]);
    expect(fixture.groupRounds).toHaveLength(6);
    expect(fixture.groupRounds[0]).toMatchObject({
      groupId: "group-1",
      label: "Zona A - Fecha 1",
      scheduledAt: "2026-03-01T20:30:00-03:00",
    });
    expect(fixture.groupRounds.flatMap((round) => round.matches)).toHaveLength(
      6,
    );
  });

  it("creates a placeholder playoff sized from total qualifiers", () => {
    const fixture = buildGroupPlayoffFixture(teams, {
      groupCount: 2,
      qualifiersPerGroup: 1,
      startsAt: "2026-03-01",
      kickoffTime: "20:30",
      daysBetweenGroupRounds: 7,
      daysBetweenPlayoffRounds: 14,
    });

    expect(fixture.playoffMatches).toHaveLength(1);
    expect(fixture.playoffMatches[0]).toMatchObject({
      roundLabel: "Final",
      scheduledAt: "2026-03-15T20:30:00-03:00",
      homeTeamId: null,
      awayTeamId: null,
      nextMatchId: null,
    });
  });

  it("rejects invalid group playoff options", () => {
    expect(() =>
      buildGroupPlayoffFixture(teams, {
        groupCount: 5,
        qualifiersPerGroup: 1,
        startsAt: null,
        kickoffTime: null,
        daysBetweenGroupRounds: 7,
        daysBetweenPlayoffRounds: 7,
      }),
    ).toThrow("No puede haber más zonas que equipos.");
  });
});
