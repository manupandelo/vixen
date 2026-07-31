import { describe, expect, it } from "vitest";

import { reconstructTreeFromMatches } from "@/lib/tree-reconstructor";

describe("reconstructTreeFromMatches", () => {
  it("ubica arriba al alimentador del slot home sin importar el orden de los ids", () => {
    // El feeder "home" tiene un id que ordena DESPUÉS que el "away":
    // si se ordenara por id, quedaría abajo.
    const tree = reconstructTreeFromMatches([
      { id: "final", nextMatchId: null, roundLabel: "Final" },
      {
        id: "zz-semi-home",
        nextMatchId: "final",
        nextMatchSlot: "home",
        roundLabel: "Semifinal",
      },
      {
        id: "aa-semi-away",
        nextMatchId: "final",
        nextMatchSlot: "away",
        roundLabel: "Semifinal",
      },
    ]);

    const home = tree.find((node) => node.id === "zz-semi-home");
    const away = tree.find((node) => node.id === "aa-semi-away");

    expect(home?.isHomeSlotInNextMatch).toBe(true);
    expect(away?.isHomeSlotInNextMatch).toBe(false);
    expect(home?.gridRowStart).toBeLessThan(away?.gridRowStart as number);
  });

  it("cae al orden por id cuando no hay slot cargado", () => {
    const tree = reconstructTreeFromMatches([
      { id: "final", nextMatchId: null, roundLabel: "Final" },
      { id: "bb-semi", nextMatchId: "final", roundLabel: "Semifinal" },
      { id: "aa-semi", nextMatchId: "final", roundLabel: "Semifinal" },
    ]);

    const first = tree.find((node) => node.id === "aa-semi");
    const second = tree.find((node) => node.id === "bb-semi");

    expect(first?.gridRowStart).toBeLessThan(second?.gridRowStart as number);
  });
});
