import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AdminShell } from "./AdminShell";

vi.mock("@/features/football-tournaments/actions", () => ({
  logoutAdmin: vi.fn(),
}));

describe("AdminShell", () => {
  it("renders the admin navigation and a clear logout action", () => {
    render(
      <AdminShell>
        <p>Contenido privado</p>
      </AdminShell>,
    );

    expect(
      screen.getByRole("link", { name: "Vixen Club Admin" }),
    ).toHaveAttribute("href", "/admin");
    expect(screen.getByRole("link", { name: "Inicio" })).toHaveAttribute(
      "href",
      "/admin",
    );
    expect(screen.getByRole("link", { name: "Torneos" })).toHaveAttribute(
      "href",
      "/admin/torneos",
    );
    expect(screen.getByRole("link", { name: "Usuarios" })).toHaveAttribute(
      "href",
      "/admin/usuarios",
    );
    expect(
      screen.getByRole("button", { name: "Cerrar sesión" }),
    ).toBeInTheDocument();
  });
});
