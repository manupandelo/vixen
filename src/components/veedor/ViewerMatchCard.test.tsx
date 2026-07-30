import { render, screen, waitFor } from "@testing-library/react";
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

  it("manda el resultado despues de confirmar", async () => {
    const submitAction = vi.fn(async () => ({
      ok: true,
      message: "Resultado final cargado.",
    }));
    const user = userEvent.setup();

    renderCard(baseMatch, submitAction);

    await user.click(screen.getByRole("button", { name: "Cargar final" }));
    await user.click(
      await screen.findByRole("button", { name: "Confirmar y cargar" }),
    );

    await waitFor(() => expect(submitAction).toHaveBeenCalledTimes(1));

    const [, submitted] = submitAction.mock.calls[0] as unknown as [
      unknown,
      FormData,
    ];
    expect(submitted.get("homeScore")).toBe("0");
    expect(submitted.get("awayScore")).toBe("0");
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
    // Sin los dos equipos no se muestra formulario: solo el estado de espera.
    expect(
      screen.queryByRole("button", { name: "Cargar final" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(/se habilita cuando se cargue la ronda anterior/i),
    ).toBeInTheDocument();
  });

  it("muestra el resultado bloqueado sin formulario", () => {
    renderCard({
      ...baseMatch,
      homeScore: 2,
      awayScore: 1,
      resultLockedAt: "2026-07-30T12:00:00-03:00",
    });

    // El marcador cargado se lee como scoreboard: cada equipo con su número.
    expect(screen.getByText("Roma")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("Boca Juniors")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Cargar final" }),
    ).not.toBeInTheDocument();
  });

  it("marca al ganador en la fila del equipo", () => {
    renderCard({
      ...baseMatch,
      homeScore: 2,
      awayScore: 1,
      resultLockedAt: "2026-07-30T12:00:00-03:00",
    });

    const winnerRow = screen.getByText("Roma").closest("div");
    const loserRow = screen.getByText("Boca Juniors").closest("div");

    expect(winnerRow?.className).toContain("bg-white/[0.03]");
    expect(loserRow?.className).not.toContain("bg-white/[0.03]");
  });
});
