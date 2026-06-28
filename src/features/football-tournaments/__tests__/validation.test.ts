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
        status: "published",
        startsAt: "2026-03-01",
        endsAt: "",
        description: "Torneo de futbol 7.",
      }),
    ).toMatchObject({
      name: "Apertura 2026",
      slug: "apertura-2026",
      status: "published",
      endsAt: null,
    });
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
      name: "Atlas",
      shortName: null,
      captainName: null,
      contactPhone: null,
      notes: "Equipo confirmado",
    });
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
