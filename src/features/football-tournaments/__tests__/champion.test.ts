import { describe, expect, it } from "vitest";

import { resolveChampionTeamId } from "@/features/football-tournaments/champion";
import type { StandingRow } from "@/features/football-tournaments/types";

const emptyStandings: StandingRow[] = [];

function standing(teamId: string): StandingRow {
  return {
    teamId,
    teamName: teamId,
    played: 1,
    won: 1,
    drawn: 0,
    lost: 0,
    goalsFor: 1,
    goalsAgainst: 0,
    goalDifference: 1,
    points: 3,
  };
}

const semifinal = {
  id: "semi",
  isKnockout: true,
  nextMatchId: "final",
  homeTeamId: "a",
  awayTeamId: "b",
  homeScore: 2,
  awayScore: 0,
  status: "completed",
};

describe("resolveChampionTeamId en copa", () => {
  it("devuelve al ganador de la final", () => {
    expect(
      resolveChampionTeamId({
        format: "cup",
        standings: emptyStandings,
        matches: [
          semifinal,
          {
            id: "final",
            isKnockout: true,
            nextMatchId: null,
            homeTeamId: "a",
            awayTeamId: "c",
            homeScore: 1,
            awayScore: 3,
            status: "completed",
          },
        ],
      }),
    ).toBe("c");
  });

  it("resuelve la final por penales", () => {
    expect(
      resolveChampionTeamId({
        format: "cup",
        standings: emptyStandings,
        matches: [
          {
            id: "final",
            isKnockout: true,
            nextMatchId: null,
            homeTeamId: "a",
            awayTeamId: "c",
            homeScore: 1,
            awayScore: 1,
            homePenaltyScore: 4,
            awayPenaltyScore: 2,
            status: "completed",
          },
        ],
      }),
    ).toBe("a");
  });

  it("no devuelve campeón si la final no se jugó", () => {
    expect(
      resolveChampionTeamId({
        format: "cup",
        standings: emptyStandings,
        matches: [
          semifinal,
          {
            id: "final",
            isKnockout: true,
            nextMatchId: null,
            homeTeamId: "a",
            awayTeamId: null,
            homeScore: null,
            awayScore: null,
            status: "scheduled",
          },
        ],
      }),
    ).toBeNull();
  });
});

describe("resolveChampionTeamId en liga", () => {
  const playedMatch = {
    id: "m1",
    isKnockout: false,
    nextMatchId: null,
    homeTeamId: "a",
    awayTeamId: "b",
    homeScore: 1,
    awayScore: 0,
    status: "completed",
  };

  it("devuelve al primero de la tabla cuando se jugó todo", () => {
    expect(
      resolveChampionTeamId({
        format: "league",
        standings: [standing("a"), standing("b")],
        matches: [playedMatch],
      }),
    ).toBe("a");
  });

  it("no devuelve campeón si falta jugar algún partido", () => {
    expect(
      resolveChampionTeamId({
        format: "league",
        standings: [standing("a")],
        matches: [
          playedMatch,
          { ...playedMatch, id: "m2", homeScore: null, awayScore: null, status: "scheduled" },
        ],
      }),
    ).toBeNull();
  });

  it("ignora los partidos cancelados al decidir si terminó", () => {
    expect(
      resolveChampionTeamId({
        format: "league",
        standings: [standing("a")],
        matches: [
          playedMatch,
          { ...playedMatch, id: "m2", homeScore: null, awayScore: null, status: "cancelled" },
        ],
      }),
    ).toBe("a");
  });
});

describe("resolveChampionTeamId sin datos", () => {
  it("devuelve null sin partidos", () => {
    expect(
      resolveChampionTeamId({
        format: "cup",
        standings: emptyStandings,
        matches: [],
      }),
    ).toBeNull();
  });
});
