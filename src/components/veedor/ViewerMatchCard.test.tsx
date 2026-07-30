import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { AdminToastProvider } from "@/components/admin/AdminToast";
import { ViewerMatchCard } from "@/components/veedor/ViewerMatchCard";

const baseMatch = {
  id: "match-1",
  tournamentName: "Torneo Prueba 2",
  roundLabel: "Semifinal",
  scheduledAt: null,
  homeTeamId: "team-home",
  awayTeamId: "team-away",
  homeTeamName: "Roma",
  awayTeamName: "Boca Juniors",
  homeScore: null,
  awayScore: null,
  homePenaltyScore: null,
  awayPenaltyScore: null,
  isKnockout: true,
  resultLockedAt: null,
  rosterEntries: [],
};

function renderCard(match: unknown, submitAction = vi.fn()) {
  return render(
    <AdminToastProvider>
      <ViewerMatchCard match={match as never} submitAction={submitAction} />
    </AdminToastProvider>,
  );
}

describe("ViewerMatchCard", () => {
  it("pide confirmacion antes de bloquear el resultado", async () => {
    const submitAction = vi.fn(async () => ({ ok: true, message: "" }));
    const user = userEvent.setup();

    renderCard(baseMatch, submitAction);

    await user.click(screen.getByRole("button", { name: "Cargar final" }));

    expect(
      await screen.findByText(/solo un administrador puede corregirlo/i),
    ).toBeInTheDocument();
    expect(submitAction).not.toHaveBeenCalled();
  });

  it("no deja cargar cuando falta definir un equipo", () => {
    renderCard({
      ...baseMatch,
      homeTeamId: null,
      // data.ts rellena el nombre igual; el card debe ignorarlo.
      homeTeamName: "Equipo local",
    });

    expect(screen.getByText("Por definirse")).toBeInTheDocument();
    expect(screen.queryByText("Equipo local")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cargar final" })).toBeDisabled();
  });

  it("muestra el resultado bloqueado sin formulario", () => {
    renderCard({
      ...baseMatch,
      homeScore: 2,
      awayScore: 1,
      resultLockedAt: "2026-07-30T12:00:00-03:00",
    });

    expect(screen.getByText("2 - 1")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Cargar final" }),
    ).not.toBeInTheDocument();
  });
});
