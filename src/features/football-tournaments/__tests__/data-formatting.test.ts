import { describe, expect, it } from "vitest";

import { formatPublicTournament } from "../data";

describe("formatPublicTournament", () => {
  it("returns public team shape and tournament dates", () => {
    const tournament = formatPublicTournament({
      id: "tournament-1",
      name: "Apertura",
      slug: "apertura",
      season: "2026",
      category: "Primera",
      status: "published",
      starts_at: "2026-03-01",
      ends_at: "2026-05-30",
      description: "Torneo apertura",
      football_teams: [
        {
          id: "team-1",
          name: "Vixen Rojo",
          short_name: "VIX",
          contact_name: "Private contact",
        },
      ],
      football_matches: [],
    });

    expect(tournament).toMatchObject({
      id: "tournament-1",
      name: "Apertura",
      slug: "apertura",
      season: "2026",
      category: "Primera",
      status: "published",
      startsAt: "2026-03-01",
      endsAt: "2026-05-30",
      description: "Torneo apertura",
      teams: [{ id: "team-1", name: "Vixen Rojo", shortName: "VIX" }],
    });
  });

  it("omits private-looking fields from JSON output", () => {
    const tournament = formatPublicTournament({
      id: "tournament-1",
      name: "Apertura",
      slug: "apertura",
      season: "2026",
      category: "Primera",
      status: "active",
      starts_at: null,
      ends_at: null,
      description: null,
      internal_notes: "Do not expose",
      football_teams: [
        {
          id: "team-1",
          name: "Vixen Rojo",
          short_name: null,
          contact_name: "Private contact",
          contact_phone: "+54 11 5555-5555",
          admin_notes: "Needs invoice",
        },
      ],
      football_matches: [
        {
          id: "match-1",
          round_label: "Fecha 1",
          scheduled_at: "2026-03-02T18:00:00Z",
          home_team_id: "team-1",
          away_team_id: "team-1",
          home_score: null,
          away_score: null,
          status: "scheduled",
          referee_phone: "+54 11 4444-4444",
        },
      ],
    });

    const json = JSON.stringify(tournament);

    expect(json).not.toContain("contact_name");
    expect(json).not.toContain("contact_phone");
    expect(json).not.toContain("admin_notes");
    expect(json).not.toContain("internal_notes");
    expect(json).not.toContain("referee_phone");
    expect(json).not.toContain("+54");
  });

  it("formats completed matches with team names and standings", () => {
    const tournament = formatPublicTournament({
      id: "tournament-1",
      name: "Apertura",
      slug: "apertura",
      season: "2026",
      category: "Primera",
      status: "completed",
      starts_at: "2026-03-01",
      ends_at: "2026-05-30",
      description: null,
      football_teams: [
        { id: "team-1", name: "Vixen Rojo", short_name: "VIX" },
        { id: "team-2", name: "La Banda", short_name: "LBD" },
      ],
      football_matches: [
        {
          id: "match-1",
          round_label: "Final",
          scheduled_at: "2026-05-30T20:00:00Z",
          home_team_id: "team-1",
          away_team_id: "team-2",
          home_score: 3,
          away_score: 1,
          status: "completed",
        },
      ],
    });

    expect(tournament.matches).toEqual([
      {
        id: "match-1",
        roundLabel: "Final",
        scheduledAt: "2026-05-30T20:00:00Z",
        homeTeamId: "team-1",
        awayTeamId: "team-2",
        homeTeamName: "Vixen Rojo",
        awayTeamName: "La Banda",
        homeScore: 3,
        awayScore: 1,
        status: "completed",
      },
    ]);
    expect(tournament.standings).toEqual([
      expect.objectContaining({
        teamId: "team-1",
        teamName: "Vixen Rojo",
        played: 1,
        won: 1,
        goalsFor: 3,
        goalsAgainst: 1,
        goalDifference: 2,
        points: 3,
      }),
      expect.objectContaining({
        teamId: "team-2",
        teamName: "La Banda",
        played: 1,
        lost: 1,
        points: 0,
      }),
    ]);
  });
});
