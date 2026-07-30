import { describe, expect, it } from "vitest";

import {
  findAdvancementBlock,
  resolveMatchWinner,
} from "@/features/football-tournaments/bracket-progression";

const baseMatch = {
  homeTeamId: "team-home",
  awayTeamId: "team-away",
  homeScore: null as number | null,
  awayScore: null as number | null,
};

describe("resolveMatchWinner", () => {
  it("devuelve el local cuando gana en el marcador", () => {
    expect(
      resolveMatchWinner({ ...baseMatch, homeScore: 2, awayScore: 1 }),
    ).toBe("team-home");
  });

  it("devuelve el visitante cuando gana en el marcador", () => {
    expect(
      resolveMatchWinner({ ...baseMatch, homeScore: 0, awayScore: 3 }),
    ).toBe("team-away");
  });

  it("desempata por penales cuando el marcador quedó igualado", () => {
    expect(
      resolveMatchWinner({
        ...baseMatch,
        homeScore: 1,
        awayScore: 1,
        homePenaltyScore: 3,
        awayPenaltyScore: 4,
      }),
    ).toBe("team-away");
  });

  it("resuelve un 0 a 0 definido por penales", () => {
    expect(
      resolveMatchWinner({
        ...baseMatch,
        homeScore: 0,
        awayScore: 0,
        homePenaltyScore: 5,
        awayPenaltyScore: 4,
      }),
    ).toBe("team-home");
  });

  it("no devuelve ganador si el empate no tiene penales", () => {
    expect(
      resolveMatchWinner({ ...baseMatch, homeScore: 2, awayScore: 2 }),
    ).toBeNull();
  });

  it("no devuelve ganador si el marcador está incompleto", () => {
    expect(
      resolveMatchWinner({ ...baseMatch, homeScore: 2, awayScore: null }),
    ).toBeNull();
  });

  it("no devuelve ganador si falta alguno de los equipos", () => {
    expect(
      resolveMatchWinner({
        ...baseMatch,
        awayTeamId: null,
        homeScore: 2,
        awayScore: 1,
      }),
    ).toBeNull();
  });

  it("no devuelve ganador si los penales quedaron iguales", () => {
    expect(
      resolveMatchWinner({
        ...baseMatch,
        homeScore: 1,
        awayScore: 1,
        homePenaltyScore: 3,
        awayPenaltyScore: 3,
      }),
    ).toBeNull();
  });
});

describe("findAdvancementBlock", () => {
  const pendingNext = {
    roundLabel: "Final",
    homeTeamId: null as string | null,
    awayTeamId: null as string | null,
    homeScore: null as number | null,
    awayScore: null as number | null,
    status: "scheduled",
  };

  it("deja avanzar cuando el slot está vacío", () => {
    expect(findAdvancementBlock(pendingNext, "home", "team-home")).toBeNull();
  });

  it("deja avanzar cuando el slot ya tiene al mismo equipo", () => {
    expect(
      findAdvancementBlock(
        { ...pendingNext, homeTeamId: "team-home" },
        "home",
        "team-home",
      ),
    ).toBeNull();
  });

  it("deja reemplazar el equipo si el partido siguiente no tiene resultado", () => {
    expect(
      findAdvancementBlock(
        { ...pendingNext, homeTeamId: "team-otro" },
        "home",
        "team-home",
      ),
    ).toBeNull();
  });

  it("bloquea si cambia el equipo y el partido siguiente ya tiene resultado", () => {
    expect(
      findAdvancementBlock(
        {
          ...pendingNext,
          homeTeamId: "team-otro",
          homeScore: 2,
          awayScore: 0,
          status: "completed",
        },
        "home",
        "team-home",
      ),
    ).toBe(
      "No se puede cambiar el ganador: Final ya tiene resultado cargado. Borrá ese resultado primero.",
    );
  });

  it("no bloquea si el equipo no cambia aunque el siguiente tenga resultado", () => {
    expect(
      findAdvancementBlock(
        {
          ...pendingNext,
          homeTeamId: "team-home",
          homeScore: 2,
          awayScore: 0,
          status: "completed",
        },
        "home",
        "team-home",
      ),
    ).toBeNull();
  });
});
