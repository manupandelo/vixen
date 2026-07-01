import { describe, expect, it } from "vitest";

import { buildLeagueFixture } from "../fixture";

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
