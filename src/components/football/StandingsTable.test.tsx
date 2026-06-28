import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { StandingsTable } from "./StandingsTable";
import type { StandingRow } from "@/features/football-tournaments/types";

const standings: StandingRow[] = [
  {
    teamId: "team-1",
    teamName: "Vixen Rojo",
    played: 2,
    won: 2,
    drawn: 0,
    lost: 0,
    goalsFor: 6,
    goalsAgainst: 2,
    goalDifference: 4,
    points: 6,
  },
];

describe("StandingsTable", () => {
  it("shows a fallback when there are no standings", () => {
    render(<StandingsTable rows={[]} />);

    expect(
      screen.getByText(
        "La tabla se va a completar cuando haya resultados cargados.",
      ),
    ).toBeInTheDocument();
  });

  it("renders the standings columns and team metrics", () => {
    render(<StandingsTable rows={standings} />);

    expect(screen.getByRole("columnheader", { name: "#" })).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: "Equipo" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: "PTS" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("cell", { name: "Vixen Rojo" }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("cell", { name: "6" })).toHaveLength(2);
    expect(screen.getByRole("cell", { name: "+4" })).toBeInTheDocument();
  });
});
