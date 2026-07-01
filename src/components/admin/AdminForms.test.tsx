import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { AdminToastProvider } from "./AdminToast";
import {
  FixtureGeneratorDialog,
  MatchDeleteDialog,
  MatchEditDialog,
  MatchResultForm,
  MatchViewerAssignmentForm,
  TeamCreatePanel,
  TeamEditDialog,
  TeamForm,
  TeamRemoveDialog,
  TournamentForm,
} from "./AdminForms";

describe("TournamentForm", () => {
  it("uses a guided create flow with a live summary and format choices", async () => {
    const user = userEvent.setup();
    const action = vi.fn(async () => ({
      ok: false,
      message: "",
    }));

    render(
      <TournamentForm
        action={action}
        submitLabel="Crear torneo"
        layout="stepped"
      />,
    );

    expect(screen.getByText("Paso 1 de 4")).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toBeInTheDocument();

    await user.type(screen.getByLabelText("Nombre del torneo"), "Apertura");
    await user.click(screen.getByRole("button", { name: "Continuar" }));

    expect(screen.getByText("Formato del torneo")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Liga con playoff" }),
    ).toBeInTheDocument();
  });

  it("does not submit the tournament on the final wizard step until explicitly confirmed", async () => {
    const user = userEvent.setup();
    const action = vi.fn(async () => ({
      ok: false,
      message: "",
    }));

    render(
      <TournamentForm
        action={action}
        submitLabel="Crear torneo"
        layout="stepped"
      />,
    );

    await user.type(screen.getByLabelText("Nombre del torneo"), "Apertura");
    await user.click(screen.getByRole("button", { name: "Continuar" }));
    await user.click(screen.getByRole("button", { name: "Liga" }));
    await user.click(screen.getByRole("button", { name: "Continuar" }));
    await user.type(screen.getByLabelText("Fecha de inicio"), "2026-03-01");
    await user.type(screen.getByLabelText("Fecha de fin"), "2026-06-30");
    await user.click(screen.getByRole("button", { name: "Continuar" }));

    const submitButton = screen.getByRole("button", { name: "Crear torneo" });

    expect(screen.getByText("Paso 4 de 4")).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
    expect(action).not.toHaveBeenCalled();

    await user.click(
      screen.getByRole("checkbox", {
        name: "Confirmo que quiero crear este torneo",
      }),
    );

    expect(submitButton).toBeEnabled();
  });
});

describe("TeamForm", () => {
  it("shows the short name counter and disables submit when it is too long", async () => {
    const user = userEvent.setup();
    const action = vi.fn(async () => ({
      ok: false,
      message: "",
    }));

    render(<TeamForm action={action} />);

    await user.type(screen.getByLabelText("Nombre"), "Deportivo Vixen");
    await user.type(screen.getByLabelText("Nombre corto"), "VIXEN");

    expect(screen.getByText("5/3")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Crear equipo" })).toBeDisabled();
  });

  it("closes the create dialog and shows a toast after a successful team creation", async () => {
    const user = userEvent.setup();
    const action = vi.fn(async () => ({
      ok: true,
      message: "Equipo creado.",
    }));

    render(
      <AdminToastProvider>
        <TeamCreatePanel action={action} />
      </AdminToastProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Agregar equipo" }));
    await user.type(screen.getByLabelText("Nombre"), "Deportivo Vixen");
    await user.click(screen.getByRole("button", { name: "Crear equipo" }));

    expect(await screen.findByText("Equipo creado.")).toBeInTheDocument();
    await waitFor(() => {
      expect(
        screen.queryByRole("dialog", { name: "Agregar equipo" }),
      ).not.toBeInTheDocument();
    });
  });

  it("edits an existing team with its current private details", async () => {
    const user = userEvent.setup();
    const action = vi.fn(async () => ({
      ok: true,
      message: "Equipo guardado.",
    }));

    render(
      <AdminToastProvider>
        <TeamEditDialog
          action={action}
          team={{
            id: "team-1",
            name: "Vixen Norte",
            shortName: "VXN",
            photoUrl: null,
            captainName: "Ana",
            contactPhone: "11 5555-1111",
            notes: "Seña paga",
          }}
        />
      </AdminToastProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Editar equipo" }));
    expect(screen.getByRole("dialog", { name: "Editar equipo" })).toBeInTheDocument();
    expect(screen.getByLabelText("Nombre")).toHaveValue("Vixen Norte");

    await user.clear(screen.getByLabelText("Nombre corto"));
    await user.type(screen.getByLabelText("Nombre corto"), "VN");
    await user.click(screen.getByRole("button", { name: "Guardar equipo" }));

    expect(action).toHaveBeenCalledTimes(1);
    expect(await screen.findByText("Equipo guardado.")).toBeInTheDocument();
  });

  it("requires team name confirmation before removing a team from the tournament", async () => {
    const user = userEvent.setup();
    const action = vi.fn(async () => ({
      ok: true,
      message: "Equipo quitado del torneo.",
    }));

    render(
      <AdminToastProvider>
        <TeamRemoveDialog action={action} teamName="Vixen Norte" />
      </AdminToastProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Quitar del torneo" }));

    const removeButton = screen.getByRole("button", {
      name: "Quitar definitivamente",
    });

    expect(removeButton).toBeDisabled();

    await user.type(screen.getByLabelText("Escribí el equipo para confirmar"), "Vixen Norte");
    await user.click(removeButton);

    expect(action).toHaveBeenCalledTimes(1);
  });
});

describe("match management forms", () => {
  it("previews generated league fixture before saving it", async () => {
    const user = userEvent.setup();
    const action = vi.fn(async () => ({
      ok: true,
      message: "Fixture generado con 3 partidos.",
    }));

    render(
      <AdminToastProvider>
        <FixtureGeneratorDialog
          action={action}
          teams={[
            { id: "team-1", name: "Vixen Norte" },
            { id: "team-2", name: "Vixen Sur" },
            { id: "team-3", name: "Vixen Este" },
          ]}
        />
      </AdminToastProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Generar fixture" }));
    await user.type(screen.getByLabelText("Inicio"), "2026-03-01");
    await user.type(screen.getByLabelText("Hora"), "20:30");

    expect(screen.getByText("Vista previa")).toBeInTheDocument();
    expect(screen.getAllByText(/Fecha [123]/)).toHaveLength(3);
    expect(screen.getByText("Fixture de 3 partidos")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Guardar fixture" }));

    expect(action).toHaveBeenCalledTimes(1);
    expect(await screen.findByText("Fixture generado con 3 partidos.")).toBeInTheDocument();
    await waitFor(() => {
      expect(
        screen.queryByRole("dialog", { name: "Generar fixture" }),
      ).not.toBeInTheDocument();
    });
  });

  it("shows a toast after assigning a viewer", async () => {
    const user = userEvent.setup();
    const action = vi.fn(async () => ({
      ok: true,
      message: "Veedor asignado.",
    }));

    render(
      <AdminToastProvider>
        <MatchViewerAssignmentForm
          action={action}
          viewers={[{ id: "viewer-1", email: "veedor@vixen.test" }]}
          assignedViewerId={null}
        />
      </AdminToastProvider>,
    );

    await user.selectOptions(screen.getByLabelText("Veedor"), "viewer-1");
    await user.click(screen.getByRole("button", { name: "Asignar" }));

    expect(await screen.findByText("Veedor asignado.")).toBeInTheDocument();
  });

  it("shows a toast after saving a match result", async () => {
    const user = userEvent.setup();
    const action = vi.fn(async () => ({
      ok: true,
      message: "Resultado guardado.",
    }));

    render(
      <AdminToastProvider>
        <MatchResultForm action={action} homeScore={null} awayScore={null} />
      </AdminToastProvider>,
    );

    await user.type(screen.getByLabelText("Local"), "2");
    await user.type(screen.getByLabelText("Visitante"), "1");
    await user.click(
      screen.getByRole("button", { name: "Guardar resultado" }),
    );

    expect(await screen.findByText("Resultado guardado.")).toBeInTheDocument();
  });

  it("edits an existing match with its current values", async () => {
    const user = userEvent.setup();
    const action = vi.fn(async () => ({
      ok: true,
      message: "Partido guardado.",
    }));

    render(
      <AdminToastProvider>
        <MatchEditDialog
          action={action}
          match={{
            id: "match-1",
            roundLabel: "Fecha 2",
            scheduledAt: "2026-03-08T20:30:00-03:00",
            homeTeamId: "team-1",
            awayTeamId: "team-2",
            homeScore: null,
            awayScore: null,
            status: "scheduled",
            assignedViewerId: null,
            resultLockedAt: null,
            resultSubmittedBy: null,
          }}
          teams={[
            { id: "team-1", name: "Vixen Norte" },
            { id: "team-2", name: "Vixen Sur" },
          ]}
        />
      </AdminToastProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Editar partido" }));
    expect(screen.getByRole("dialog", { name: "Editar partido" })).toBeInTheDocument();
    expect(screen.getByLabelText("Ronda")).toHaveValue("Fecha 2");

    await user.clear(screen.getByLabelText("Ronda"));
    await user.type(screen.getByLabelText("Ronda"), "Fecha 3");
    await user.click(screen.getByRole("button", { name: "Guardar partido" }));

    expect(action).toHaveBeenCalledTimes(1);
    expect(await screen.findByText("Partido guardado.")).toBeInTheDocument();
  });

  it("requires the match label before deleting a match", async () => {
    const user = userEvent.setup();
    const action = vi.fn(async () => ({
      ok: true,
      message: "Partido eliminado.",
    }));

    render(
      <AdminToastProvider>
        <MatchDeleteDialog action={action} matchLabel="Fecha 2" />
      </AdminToastProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Eliminar partido" }));

    const deleteButton = screen.getByRole("button", {
      name: "Eliminar definitivamente",
    });

    expect(deleteButton).toBeDisabled();

    await user.type(screen.getByLabelText("Escribí la ronda para confirmar"), "Fecha 2");
    await user.click(deleteButton);

    expect(action).toHaveBeenCalledTimes(1);
  });
});
