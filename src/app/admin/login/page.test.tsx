import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const redirectMock = vi.hoisted(() =>
  vi.fn((path: string) => {
    throw new Error(`NEXT_REDIRECT:${path}`);
  }),
);
const getCurrentStaffDashboardPathMock = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

vi.mock("@/features/football-tournaments/data", () => ({
  getCurrentStaffDashboardPath: getCurrentStaffDashboardPathMock,
}));

vi.mock("./LoginForm", () => ({
  LoginForm: () => <form aria-label="Login privado" />,
}));

import AdminLoginPage from "./page";

describe("AdminLoginPage", () => {
  async function resolveLoginPage() {
    return AdminLoginPage();
  }

  it("renders the login form when no active staff session exists", async () => {
    getCurrentStaffDashboardPathMock.mockResolvedValue(null);

    render(await AdminLoginPage());

    expect(
      screen.getByRole("heading", { name: "Administración" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("form", { name: "Login privado" })).toBeInTheDocument();
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it("redirects authenticated admins away from the login page", async () => {
    getCurrentStaffDashboardPathMock.mockResolvedValue("/admin");

    await expect(resolveLoginPage()).rejects.toThrow("NEXT_REDIRECT:/admin");

    expect(redirectMock).toHaveBeenCalledWith("/admin");
  });

  it("redirects authenticated viewers away from the admin login page", async () => {
    getCurrentStaffDashboardPathMock.mockResolvedValue("/veedor");

    await expect(resolveLoginPage()).rejects.toThrow("NEXT_REDIRECT:/veedor");

    expect(redirectMock).toHaveBeenCalledWith("/veedor");
  });
});
