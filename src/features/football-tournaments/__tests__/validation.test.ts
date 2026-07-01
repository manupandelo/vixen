import { describe, expect, it } from "vitest";
import {
  matchFormSchema,
  teamFormSchema,
  tournamentFormSchema,
} from "../validation";

describe("football tournament validation", () => {
  it("accepts a valid tournament form", () => {
    expect(
      tournamentFormSchema.parse({
        name: "Apertura 2026",
        slug: "apertura-2026",
        season: "2026",
        category: "Masculino",
        format: "league",
        status: "published",
        startsAt: "2026-03-01",
        endsAt: "",
        description: "Torneo de futbol 7.",
      }),
    ).toMatchObject({
      name: "Apertura 2026",
      status: "published",
      format: "league",
      endsAt: null,
    });
  });

  it("rejects invalid tournament calendar dates", () => {
    expect(() =>
      tournamentFormSchema.parse({
        name: "Apertura 2026",
        slug: "apertura-2026",
        season: "2026",
        category: "Masculino",
        format: "league",
        status: "published",
        startsAt: "2026-02-30",
        endsAt: "",
        description: "",
      }),
    ).toThrow();
  });

  it("rejects a tournament ending before it starts", () => {
    expect(() =>
      tournamentFormSchema.parse({
        name: "Apertura 2026",
        slug: "apertura-2026",
        season: "2026",
        category: "Masculino",
        format: "league",
        status: "published",
        startsAt: "2026-03-10",
        endsAt: "2026-03-01",
        description: "",
      }),
    ).toThrow();
  });

  it("normalizes optional team text fields to null", () => {
    expect(
      teamFormSchema.parse({
        name: "Atlas",
        shortName: "",
        captainName: "  ",
        contactPhone: "",
        notes: "Equipo confirmado",
      }),
    ).toEqual({
      existingTeamId: null,
      name: "Atlas",
      shortName: null,
      captainName: null,
      contactPhone: null,
      notes: "Equipo confirmado",
    });
  });

  it("accepts an existing team registration without a new team name", () => {
    expect(
      teamFormSchema.parse({
        existingTeamId: "team-1",
        name: "",
        shortName: "",
        captainName: "",
        contactPhone: "",
        notes: "",
      }),
    ).toEqual({
      existingTeamId: "team-1",
      name: null,
      shortName: null,
      captainName: null,
      contactPhone: null,
      notes: null,
    });
  });

  it("rejects team short names longer than three characters", () => {
    expect(() =>
      teamFormSchema.parse({
        existingTeamId: "",
        name: "Deportivo Vixen",
        shortName: "VIXEN",
        captainName: "",
        contactPhone: "",
        notes: "",
      }),
    ).toThrow("El nombre corto no puede superar 3 caracteres.");
  });

  it("rejects a completed match without scores", () => {
    expect(() =>
      matchFormSchema.parse({
        roundLabel: "Fecha 1",
        scheduledAt: "2026-03-01T20:00",
        homeTeamId: "team-a",
        awayTeamId: "team-b",
        status: "completed",
        homeScore: "",
        awayScore: "",
      }),
    ).toThrow();
  });

  it("normalizes datetime-local scheduled values to Argentina offset", () => {
    expect(
      matchFormSchema.parse({
        roundLabel: "Fecha 1",
        scheduledAt: "2026-03-01T20:00",
        homeTeamId: "team-a",
        awayTeamId: "team-b",
        status: "scheduled",
        homeScore: "",
        awayScore: "",
      }),
    ).toMatchObject({
      scheduledAt: "2026-03-01T20:00:00-03:00",
    });
  });

  it("accepts scheduled values that already include a timezone", () => {
    expect(
      matchFormSchema.parse({
        roundLabel: "Fecha 1",
        scheduledAt: "2026-03-01T23:00:00Z",
        homeTeamId: "team-a",
        awayTeamId: "team-b",
        status: "scheduled",
        homeScore: "",
        awayScore: "",
      }),
    ).toMatchObject({
      scheduledAt: "2026-03-01T23:00:00Z",
    });
  });

  it("rejects invalid scheduled calendar dates", () => {
    expect(() =>
      matchFormSchema.parse({
        roundLabel: "Fecha 1",
        scheduledAt: "2026-02-30T20:00:00Z",
        homeTeamId: "team-a",
        awayTeamId: "team-b",
        status: "scheduled",
        homeScore: "",
        awayScore: "",
      }),
    ).toThrow();
  });

  it("rejects a match where both sides are the same team", () => {
    expect(() =>
      matchFormSchema.parse({
        roundLabel: "Fecha 1",
        scheduledAt: "",
        homeTeamId: "team-a",
        awayTeamId: "team-a",
        status: "scheduled",
        homeScore: "",
        awayScore: "",
      }),
    ).toThrow();
  });

  it("clears scores for non-completed matches", () => {
    expect(
      matchFormSchema.parse({
        roundLabel: "Fecha 1",
        scheduledAt: "",
        homeTeamId: "team-a",
        awayTeamId: "team-b",
        status: "postponed",
        homeScore: "2",
        awayScore: 1,
      }),
    ).toMatchObject({
      status: "postponed",
      homeScore: null,
      awayScore: null,
    });
  });

  it("rejects negative scores", () => {
    expect(() =>
      matchFormSchema.parse({
        roundLabel: "Fecha 1",
        scheduledAt: "",
        homeTeamId: "team-a",
        awayTeamId: "team-b",
        status: "completed",
        homeScore: -1,
        awayScore: 1,
      }),
    ).toThrow();
  });
});
