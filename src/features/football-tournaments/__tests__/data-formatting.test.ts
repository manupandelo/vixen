import { afterEach, describe, expect, it, vi } from "vitest";

import {
  formatAuditEvent,
  formatAdminTournamentCategories,
  formatAdminAvailablePlayers,
  formatAdminDashboardSummary,
  formatAdminRosterEntries,
  formatAdminRosteredPlayerIds,
  formatPublicTournament,
  formatPublicTournamentWithCategories,
  formatPublicTournamentRows,
} from "../data";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("formatAuditEvent", () => {
  it("maps database audit rows to the admin activity shape", () => {
    const event = formatAuditEvent({
      id: "audit-1",
      tournament_id: "tournament-1",
      actor_profile_id: "admin-1",
      actor_email: "admin@vixen.test",
      entity_type: "tournament",
      entity_id: "tournament-1",
      action: "updated",
      summary: "Actualizó datos del torneo",
      metadata: { changedFields: ["status"] },
      created_at: "2026-07-01T12:30:00-03:00",
    });

    expect(event).toEqual({
      id: "audit-1",
      tournamentId: "tournament-1",
      actorProfileId: "admin-1",
      actorEmail: "admin@vixen.test",
      entityType: "tournament",
      entityId: "tournament-1",
      action: "updated",
      summary: "Actualizó datos del torneo",
      metadata: { changedFields: ["status"] },
      createdAt: "2026-07-01T12:30:00-03:00",
    });
  });
});

describe("formatAdminDashboardSummary", () => {
  it("calculates match progress, upcoming date and setup attention items", () => {
    const summary = formatAdminDashboardSummary(
      [
        {
          id: "tournament-1",
          name: "Apertura",
          slug: "apertura",
          season: "2026",
          category: "Primera",
          format: "league",
          status: "active",
          starts_at: "2026-03-01",
          ends_at: "2026-06-30",
          description: null,
          football_tournament_teams: [
            { team_id: "team-1" },
            { team_id: "team-2" },
          ],
          football_matches: [
            {
              id: "match-1",
              round_label: "Fecha 1",
              scheduled_at: "2026-06-20T20:00:00-03:00",
              home_team_id: "team-1",
              away_team_id: "team-2",
              home_score: 2,
              away_score: 1,
              status: "completed",
            },
            {
              id: "match-2",
              round_label: "Fecha 2",
              scheduled_at: "2026-06-29T20:00:00-03:00",
              home_team_id: "team-1",
              away_team_id: "team-2",
              home_score: null,
              away_score: null,
              status: "scheduled",
            },
            {
              id: "match-3",
              round_label: "Fecha 3",
              scheduled_at: "2026-07-02T20:00:00-03:00",
              home_team_id: "team-2",
              away_team_id: "team-1",
              home_score: null,
              away_score: null,
              status: "scheduled",
            },
          ],
        },
        {
          id: "tournament-2",
          name: "Clausura",
          slug: "clausura",
          season: "2026",
          category: "Primera",
          format: "cup",
          status: "draft",
          starts_at: null,
          ends_at: null,
          description: null,
          football_tournament_teams: [{ team_id: "team-3" }],
          football_matches: [],
        },
      ],
      [
        {
          id: "admin-1",
          email: "admin@vixen.test",
          role: "admin",
          status: "active",
          suspended_at: null,
          suspended_reason: null,
        },
        {
          id: "viewer-1",
          email: "veedor@vixen.test",
          role: "viewer",
          status: "active",
          suspended_at: null,
          suspended_reason: null,
        },
      ],
      new Date("2026-06-30T12:00:00-03:00"),
    );

    expect(summary.metrics).toMatchObject({
      totalTournaments: 2,
      activeTournaments: 1,
      publishedTournaments: 0,
      draftTournaments: 1,
      totalMatches: 3,
      completedMatches: 1,
      pendingResults: 2,
      overdueResults: 1,
      resultProgress: 33,
      activeViewers: 1,
      admins: 1,
    });
    expect(summary.nextMatch).toMatchObject({
      tournamentName: "Apertura",
      roundLabel: "Fecha 3",
      scheduledAt: "2026-07-02T20:00:00-03:00",
    });
    expect(summary.attentionItems).toEqual([
      expect.objectContaining({
        title: "Cargar resultados pendientes",
        href: "/admin/torneos/tournament-1?tab=partidos",
      }),
      expect.objectContaining({
        title: "Completar equipos",
        href: "/admin/torneos/tournament-2?tab=equipos",
      }),
      expect.objectContaining({
        title: "Crear fixture",
        href: "/admin/torneos/tournament-2?tab=partidos",
      }),
    ]);
  });
});

describe("admin roster formatting", () => {
  it("formats roster entries with nested player names", () => {
    const entries = formatAdminRosterEntries([
      {
        id: "entry-1",
        tournament_id: "tournament-1",
        team_id: "team-1",
        player_id: "player-1",
        shirt_number: 10,
        status: "active",
        medical_status: "approved",
        insurance_status: "pending",
        registered_at: "2026-07-02T12:00:00-03:00",
        notes: "Trae apto el lunes.",
        football_players: {
          id: "player-1",
          first_name: "Juan",
          last_name: "Perez",
          public_name: null,
          document_number: null,
          birth_date: null,
          phone: null,
          notes: null,
        },
      },
    ]);

    expect(entries).toEqual([
      {
        id: "entry-1",
        tournamentId: "tournament-1",
        teamId: "team-1",
        playerId: "player-1",
        shirtNumber: 10,
        status: "active",
        medicalStatus: "approved",
        insuranceStatus: "pending",
        registeredAt: "2026-07-02T12:00:00-03:00",
        notes: "Trae apto el lunes.",
        player: {
          id: "player-1",
          firstName: "Juan",
          lastName: "Perez",
          publicName: null,
          documentNumber: null,
          birthDate: null,
          phone: null,
          notes: null,
        },
      },
    ]);
  });

  it("filters existing players already present in a tournament", () => {
    const players = formatAdminAvailablePlayers(
      [
        {
          id: "player-1",
          first_name: "Juan",
          last_name: "Perez",
          public_name: null,
          document_number: null,
          birth_date: null,
          phone: null,
          notes: null,
        },
        {
          id: "player-2",
          first_name: "Ana",
          last_name: "Lopez",
          public_name: "Anita",
          document_number: "123",
          birth_date: null,
          phone: null,
          notes: null,
        },
      ],
      new Set(["player-1"]),
    );

    expect(players).toEqual([
      {
        id: "player-2",
        firstName: "Ana",
        lastName: "Lopez",
        publicName: "Anita",
        documentNumber: "123",
        birthDate: null,
        phone: null,
        notes: null,
      },
    ]);
  });

  it("filters rostered players from raw roster rows when player hydration is missing", () => {
    const rosteredPlayerIds = formatAdminRosteredPlayerIds([
      { player_id: "player-1" },
      { player_id: null },
    ]);

    const players = formatAdminAvailablePlayers(
      [
        {
          id: "player-1",
          first_name: "Juan",
          last_name: "Perez",
          public_name: null,
          document_number: null,
          birth_date: null,
          phone: null,
          notes: null,
        },
        {
          id: "player-2",
          first_name: "Ana",
          last_name: "Lopez",
          public_name: null,
          document_number: null,
          birth_date: null,
          phone: null,
          notes: null,
        },
      ],
      rosteredPlayerIds,
    );

    expect(players.map((player) => player.id)).toEqual(["player-2"]);
  });
});

describe("formatPublicTournament", () => {
  it("formats admin tournament categories in position order", () => {
    const categories = formatAdminTournamentCategories([
      {
        id: "category-2",
        tournament_id: "tournament-1",
        name: "Reserva",
        slug: "reserva",
        status: "active",
        position: 2,
        starts_at: null,
        ends_at: null,
      },
      {
        id: "category-1",
        tournament_id: "tournament-1",
        name: "Primera",
        slug: "primera",
        status: "published",
        position: 1,
        starts_at: "2026-03-01",
        ends_at: null,
      },
    ]);

    expect(categories.map((category) => category.slug)).toEqual([
      "primera",
      "reserva",
    ]);
  });

  it("formats a public tournament with visible categories only", () => {
    const tournament = formatPublicTournamentWithCategories({
      id: "tournament-1",
      name: "Apertura",
      slug: "apertura",
      season: "2026",
      category: "Primera",
      format: "league",
      status: "active",
      starts_at: "2026-03-01",
      ends_at: null,
      description: null,
      football_tournament_categories: [
        {
          id: "category-1",
          tournament_id: "tournament-1",
          name: "Primera",
          slug: "primera",
          status: "active",
          position: 1,
          starts_at: null,
          ends_at: null,
          football_tournament_teams: [],
          football_matches: [],
        },
        {
          id: "category-2",
          tournament_id: "tournament-1",
          name: "Menores",
          slug: "menores",
          status: "archived",
          position: 2,
          starts_at: null,
          ends_at: null,
          football_tournament_teams: [],
          football_matches: [],
        },
      ],
    });

    expect(tournament.categories.map((category) => category.slug)).toEqual([
      "primera",
    ]);
  });

  it("formats teams from tournament registrations when teams are reused", () => {
    const row: Parameters<typeof formatPublicTournament>[0] = {
      id: "tournament-1",
      name: "Apertura",
      slug: "apertura",
      season: "2026",
      category: "Primera",
      format: "league",
      status: "published",
      starts_at: "2026-03-01",
      ends_at: "2026-05-30",
      description: null,
      football_teams: null,
      football_tournament_teams: [
        {
          football_teams: {
            id: "team-1",
            name: "Vixen Rojo",
            short_name: "VIX",
            photo_url: "https://cdn.vixen.test/vixen-rojo.webp",
          },
        },
      ],
      football_matches: [],
    };

    const tournament = formatPublicTournament(row);

    expect(tournament.teams).toEqual([
      {
        id: "team-1",
        name: "Vixen Rojo",
        shortName: "VIX",
        photoUrl: "https://cdn.vixen.test/vixen-rojo.webp",
      },
    ]);
  });

  it("returns public team shape and tournament dates", () => {
    const tournament = formatPublicTournament({
      id: "tournament-1",
      name: "Apertura",
      slug: "apertura",
      season: "2026",
      category: "Primera",
      format: "league",
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
      format: "league",
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
      format: "league",
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
      format: "cup",
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
        homeTeamShortName: "VIX",
        awayTeamShortName: "LBD",
        homeScore: 3,
        awayScore: 1,
        status: "completed",
        isKnockout: true,
        nextMatchId: null,
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

  it("derives playoff matches from format and group membership", () => {
    const tournament = formatPublicTournament({
      id: "tournament-1",
      name: "Apertura",
      slug: "apertura",
      season: "2026",
      category: "Primera",
      format: "league_playoff",
      status: "active",
      starts_at: null,
      ends_at: null,
      description: null,
      football_teams: [
        { id: "team-1", name: "Vixen Rojo", short_name: "VIX" },
        { id: "team-2", name: "La Banda", short_name: "LBD" },
      ],
      football_matches: [
        {
          id: "group-match",
          round_label: "Zona A",
          scheduled_at: "2026-03-02T18:00:00Z",
          home_team_id: "team-1",
          away_team_id: "team-2",
          home_score: null,
          away_score: null,
          status: "scheduled",
          group_id: "group-a",
          next_match_id: null,
        },
        {
          id: "playoff-match",
          round_label: "Final",
          scheduled_at: "2026-03-09T18:00:00Z",
          home_team_id: null,
          away_team_id: null,
          home_score: null,
          away_score: null,
          status: "scheduled",
          group_id: null,
          next_match_id: null,
        },
      ],
    });

    expect(tournament.matches).toEqual([
      expect.objectContaining({
        id: "group-match",
        isKnockout: false,
      }),
      expect.objectContaining({
        id: "playoff-match",
        isKnockout: true,
      }),
    ]);
  });

  it("sorts teams by name and matches deterministically", () => {
    const tournament = formatPublicTournament({
      id: "tournament-1",
      name: "Apertura",
      slug: "apertura",
      season: "2026",
      category: "Primera",
      format: "league_playoff",
      status: "published",
      starts_at: "2026-03-01",
      ends_at: "2026-05-30",
      description: null,
      football_teams: [
        { id: "team-3", name: "Zeta", short_name: null },
        { id: "team-1", name: "Águilas", short_name: "AGU" },
        { id: "team-2", name: "Boca", short_name: "BOC" },
      ],
      football_matches: [
        {
          id: "match-null-b",
          round_label: "Fecha 2",
          scheduled_at: null,
          home_team_id: "team-2",
          away_team_id: "team-3",
          home_score: null,
          away_score: null,
          status: "scheduled",
        },
        {
          id: "match-late",
          round_label: "Fecha 1",
          scheduled_at: "2026-03-04T18:00:00Z",
          home_team_id: "team-3",
          away_team_id: "team-1",
          home_score: null,
          away_score: null,
          status: "scheduled",
        },
        {
          id: "match-early-b",
          round_label: "Fecha 2",
          scheduled_at: "2026-03-02T18:00:00Z",
          home_team_id: "team-1",
          away_team_id: "team-2",
          home_score: null,
          away_score: null,
          status: "scheduled",
        },
        {
          id: "match-early-a",
          round_label: "Fecha 1",
          scheduled_at: "2026-03-02T18:00:00Z",
          home_team_id: "team-2",
          away_team_id: "team-1",
          home_score: null,
          away_score: null,
          status: "scheduled",
        },
        {
          id: "match-null-a",
          round_label: "Fecha 1",
          scheduled_at: null,
          home_team_id: "team-1",
          away_team_id: "team-3",
          home_score: null,
          away_score: null,
          status: "scheduled",
        },
      ],
    });

    expect(tournament.teams.map((team) => team.name)).toEqual([
      "Águilas",
      "Boca",
      "Zeta",
    ]);
    expect(tournament.matches.map((match) => match.id)).toEqual([
      "match-early-a",
      "match-early-b",
      "match-late",
      "match-null-a",
      "match-null-b",
    ]);
  });

  it("throws when a completed match references a missing team", () => {
    expect(() =>
      formatPublicTournament({
        id: "tournament-1",
        name: "Apertura",
        slug: "apertura",
        season: "2026",
        category: "Primera",
        format: "league",
        status: "active",
        starts_at: null,
        ends_at: null,
        description: null,
        football_teams: [
          { id: "team-1", name: "Vixen Rojo", short_name: "VIX" },
        ],
        football_matches: [
          {
            id: "match-1",
            round_label: "Fecha 1",
            scheduled_at: "2026-03-02T18:00:00Z",
            home_team_id: "team-1",
            away_team_id: "missing-team",
            home_score: 2,
            away_score: 1,
            status: "completed",
          },
        ],
      }),
    ).toThrow("missing-team");
  });
});

describe("formatPublicTournamentRows", () => {
  it("skips malformed tournament rows and logs their identity", () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    const tournaments = formatPublicTournamentRows([
      {
        id: "valid-tournament",
        name: "Apertura",
        slug: "apertura",
        season: "2026",
        category: "Primera",
        format: "league",
        status: "published",
        starts_at: null,
        ends_at: null,
        description: null,
        football_teams: [
          { id: "team-1", name: "Vixen Rojo", short_name: "VIX" },
        ],
        football_matches: [],
      },
      {
        id: "broken-tournament",
        name: "Clausura",
        slug: "clausura",
        season: "2026",
        category: "Primera",
        format: "league",
        status: "active",
        starts_at: null,
        ends_at: null,
        description: null,
        football_teams: [
          { id: "team-1", name: "Vixen Rojo", short_name: "VIX" },
        ],
        football_matches: [
          {
            id: "match-1",
            round_label: "Fecha 1",
            scheduled_at: null,
            home_team_id: "team-1",
            away_team_id: "missing-team",
            home_score: 1,
            away_score: 0,
            status: "completed",
          },
        ],
      },
    ]);

    expect(tournaments).toHaveLength(1);
    expect(tournaments[0]?.id).toBe("valid-tournament");
    expect(consoleError).toHaveBeenCalledWith(
      "Skipping malformed public football tournament row.",
      expect.objectContaining({
        id: "broken-tournament",
        slug: "clausura",
        name: "Clausura",
      }),
    );
  });
});
