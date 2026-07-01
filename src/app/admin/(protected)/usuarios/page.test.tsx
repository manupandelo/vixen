import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import AdminUsersPage from "./page";

vi.mock("@/features/football-tournaments/data", () => ({
  getCurrentAdmin: vi.fn(async () => ({
    id: "admin-1",
    email: "admin@vixen.test",
    role: "admin",
    status: "active",
    suspended_at: null,
    suspended_reason: null,
  })),
  getAdminStaffProfiles: vi.fn(async () => [
    {
      id: "admin-1",
      email: "admin@vixen.test",
      role: "admin",
      status: "active",
      suspended_at: null,
      suspended_reason: null,
    },
    {
      id: "viewer-1",
      email: "veedor@vixen.test",
      role: "viewer",
      status: "suspended",
      suspended_at: "2026-06-30T10:00:00Z",
      suspended_reason: "Carga incorrecta",
    },
  ]),
}));

vi.mock("@/features/football-tournaments/staff-actions", () => ({
  createStaffUser: vi.fn(),
}));

describe("AdminUsersPage", () => {
  it("shows admins and viewers in the staff section", async () => {
    render(await AdminUsersPage());

    expect(screen.getByRole("heading", { name: "Usuarios" })).toBeInTheDocument();
    expect(screen.getByText("admin@vixen.test")).toBeInTheDocument();
    expect(screen.getAllByText("Administrador").length).toBeGreaterThan(0);
    expect(screen.getByText("veedor@vixen.test")).toBeInTheDocument();
    expect(screen.getAllByText("Veedor").length).toBeGreaterThan(0);
    expect(screen.getByText("Activo")).toBeInTheDocument();
    expect(screen.getByText("Suspendido")).toBeInTheDocument();
    expect(screen.getByText("Carga incorrecta")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Ver detalle de veedor@vixen.test" }),
    ).toHaveAttribute("href", "/admin/usuarios/viewer-1");
    expect(
      screen.queryByRole("button", { name: "Actualizar" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Suspender" }),
    ).not.toBeInTheDocument();
  });
});
