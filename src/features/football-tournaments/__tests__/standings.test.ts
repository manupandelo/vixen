import { describe, expect, it } from "vitest";
import { calculateStandings } from "../standings";
import type { FootballMatchForStandings, FootballTeam } from "../types";

const teams: FootballTeam[] = [
  { id: "a", name: "Atlas", shortName: "ATL" },
  { id: "b", name: "Barrio Norte", shortName: "BN" },
  { id: "c", name: "Club Sur", shortName: null },
];

const matches: FootballMatchForStandings[] = [
  {
    id: "m1",
    homeTeamId: "a",
    awayTeamId: "b",
    homeScore: 3,
    awayScore: 1,
    status: "completed",
  },
  {
    id: "m2",
    homeTeamId: "b",
    awayTeamId: "c",
    homeScore: 2,
    awayScore: 2,
    status: "completed",
  },
  {
    id: "m3",
    homeTeamId: "a",
    awayTeamId: "c",
    homeScore: null,
    awayScore: null,
    status: "scheduled",
  },
];

describe("calculateStandings", () => {
  it("calculates football table from completed matches only", () => {
    expect(calculateStandings(teams, matches)).toEqual([
      {
        teamId: "a",
        teamName: "Atlas",
        played: 1,
        won: 1,
        drawn: 0,
        lost: 0,
        goalsFor: 3,
        goalsAgainst: 1,
        goalDifference: 2,
        points: 3,
      },
      {
        teamId: "c",
        teamName: "Club Sur",
        played: 1,
        won: 0,
        drawn: 1,
        lost: 0,
        goalsFor: 2,
        goalsAgainst: 2,
        goalDifference: 0,
        points: 1,
      },
      {
        teamId: "b",
        teamName: "Barrio Norte",
        played: 2,
        won: 0,
        drawn: 1,
        lost: 1,
        goalsFor: 3,
        goalsAgainst: 5,
        goalDifference: -2,
        points: 1,
      },
    ]);
  });

  it("uses goal difference, goals for, then Spanish name order as tie breakers", () => {
    const tiedTeams: FootballTeam[] = [
      { id: "x", name: "Zulu", shortName: null },
      { id: "y", name: "Alfa", shortName: null },
    ];

    expect(calculateStandings(tiedTeams, [])).toEqual([
      expect.objectContaining({ teamName: "Alfa" }),
      expect.objectContaining({ teamName: "Zulu" }),
    ]);
  });

  it("ignores completed matches with incomplete scores", () => {
    expect(
      calculateStandings(teams, [
        {
          id: "m4",
          homeTeamId: "a",
          awayTeamId: "b",
          homeScore: 4,
          awayScore: null,
          status: "completed",
        },
      ]),
    ).toEqual([
      expect.objectContaining({ teamId: "a", played: 0, points: 0 }),
      expect.objectContaining({ teamId: "b", played: 0, points: 0 }),
      expect.objectContaining({ teamId: "c", played: 0, points: 0 }),
    ]);
  });
});
