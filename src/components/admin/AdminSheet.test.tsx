import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { AdminSheet } from "@/components/admin/AdminSheet";

describe("AdminSheet", () => {
  it("muestra titulo y contenido cuando esta abierto", () => {
    render(
      <AdminSheet open onOpenChange={() => {}} title="Plantel de Boca">
        <p>Contenido del panel</p>
      </AdminSheet>,
    );

    expect(
      screen.getByRole("dialog", { name: "Plantel de Boca" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Contenido del panel")).toBeInTheDocument();
  });

  it("no renderiza nada cuando esta cerrado", () => {
    render(
      <AdminSheet open={false} onOpenChange={() => {}} title="Plantel de Boca">
        <p>Contenido del panel</p>
      </AdminSheet>,
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("avisa que se cerro al apretar Escape", async () => {
    const onOpenChange = vi.fn();
    const user = userEvent.setup();

    render(
      <AdminSheet open onOpenChange={onOpenChange} title="Plantel de Boca">
        <p>Contenido del panel</p>
      </AdminSheet>,
    );

    await user.keyboard("{Escape}");

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("cierra desde el boton de cerrar", async () => {
    const onOpenChange = vi.fn();
    const user = userEvent.setup();

    render(
      <AdminSheet open onOpenChange={onOpenChange} title="Plantel de Boca">
        <p>Contenido del panel</p>
      </AdminSheet>,
    );

    await user.click(screen.getByRole("button", { name: "Cerrar" }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
