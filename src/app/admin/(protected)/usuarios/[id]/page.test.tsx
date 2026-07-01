import { render, screen } from "@testing-library/react";
import { notFound } from "next/navigation";
import { describe, expect, it, vi } from "vitest";

import AdminUserDetailPage from "./page";

const getAdminStaffProfileDetailMock = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", async () => {
  const actual = await vi.importActual<typeof import("next/navigation")>(
    "next/navigation",
  );

  return {
    ...actual,
    notFound: vi.fn(() => {
      throw new Error("NEXT_NOT_FOUND");
    }),
  };
});

vi.mock("@/features/football-tournaments/data", () => ({
  getCurrentAdmin: vi.fn(async () => ({
    id: "admin-1",
    email: "admin@vixen.test",
    role: "admin",
    status: "active",
    suspended_at: null,
    suspended_reason: null,
  })),
  getAdminStaffProfileDetail: getAdminStaffProfileDetailMock,
}));

vi.mock("@/features/football-tournaments/staff-actions", () => ({
  deleteStaffUser: vi.fn(),
  reactivateStaffUser: vi.fn(),
  suspendStaffUser: vi.fn(),
  updateStaffRole: vi.fn(),
}));

describe("AdminUserDetailPage", () => {
  it("shows profile controls and the staff member activity", async () => {
    getAdminStaffProfileDetailMock.mockResolvedValue({
      profile: {
        id: "viewer-1",
        email: "veedor@vixen.test",
        role: "viewer",
        status: "active",
        suspended_at: null,
        suspended_reason: null,
      },
      metrics: {
        assignedMatches: 3,
        submittedResults: 2,
        pendingMatches: 1,
      },
      submittedMatches: [
        {
          id: "match-1",
          tournamentName: "Apertura Vixen",
          roundLabel: "Fecha 1",
          scheduledAt: "2026-06-30T18:00:00-03:00",
          homeTeamName: "Norte",
          awayTeamName: "Sur",
          homeScore: 2,
          awayScore: 1,
          status: "completed",
        },
      ],
      assignedMatches: [
        {
          id: "match-2",
          tournamentName: "Apertura Vixen",
          roundLabel: "Fecha 2",
          scheduledAt: null,
          homeTeamName: "Este",
          awayTeamName: "Oeste",
          homeScore: null,
          awayScore: null,
          status: "scheduled",
        },
      ],
    });

    render(
      await AdminUserDetailPage({
        params: Promise.resolve({ id: "viewer-1" }),
      }),
    );

    expect(
      screen.getByRole("heading", { name: "veedor@vixen.test" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Resumen operativo")).toBeInTheDocument();
    expect(screen.getByText("Panel de acciones")).toBeInTheDocument();
    expect(screen.getByText("Perfil del acceso")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getAllByText("Apertura Vixen").length).toBeGreaterThan(0);
    expect(screen.getByText("Norte 2 - 1 Sur")).toBeInTheDocument();
    expect(screen.getByText("Este vs Oeste")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Actualizar" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Suspender" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Eliminar" })).toBeInTheDocument();
  });

  it("renders not found when the staff member does not exist", async () => {
    getAdminStaffProfileDetailMock.mockResolvedValue(null);

    await expect(
      AdminUserDetailPage({
        params: Promise.resolve({ id: "missing" }),
      }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
    expect(notFound).toHaveBeenCalledTimes(1);
  });
});
