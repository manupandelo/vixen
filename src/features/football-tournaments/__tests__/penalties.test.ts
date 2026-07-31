import { describe, expect, it } from "vitest";

import {
  formatPenaltyResult,
  wasDecidedOnPenalties,
} from "@/features/football-tournaments/penalties";

describe("wasDecidedOnPenalties", () => {
  it("reconoce un empate definido por penales", () => {
    expect(
      wasDecidedOnPenalties({
        homeScore: 1,
        awayScore: 1,
        homePenaltyScore: 4,
        awayPenaltyScore: 2,
      }),
    ).toBe(true);
  });

  it("reconoce un 0 a 0 definido por penales", () => {
    expect(
      wasDecidedOnPenalties({
        homeScore: 0,
        awayScore: 0,
        homePenaltyScore: 5,
        awayPenaltyScore: 4,
      }),
    ).toBe(true);
  });

  it("no marca penales si el partido no terminó empatado", () => {
    expect(
      wasDecidedOnPenalties({
        homeScore: 2,
        awayScore: 1,
        homePenaltyScore: 4,
        awayPenaltyScore: 2,
      }),
    ).toBe(false);
  });

  it("no marca penales si no hay tanda cargada", () => {
    expect(
      wasDecidedOnPenalties({ homeScore: 1, awayScore: 1 }),
    ).toBe(false);
  });

  it("no marca penales si el partido no se jugó", () => {
    expect(
      wasDecidedOnPenalties({
        homeScore: null,
        awayScore: null,
        homePenaltyScore: 4,
        awayPenaltyScore: 2,
      }),
    ).toBe(false);
  });
});

describe("formatPenaltyResult", () => {
  it("arma el texto de la tanda", () => {
    expect(
      formatPenaltyResult({
        homeScore: 1,
        awayScore: 1,
        homePenaltyScore: 4,
        awayPenaltyScore: 2,
      }),
    ).toBe("4-2 en penales");
  });

  it("devuelve null cuando no hubo penales", () => {
    expect(formatPenaltyResult({ homeScore: 2, awayScore: 0 })).toBeNull();
  });
});
