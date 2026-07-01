import { beforeEach, describe, expect, it, vi } from "vitest";

const requireAdminMock = vi.hoisted(() => vi.fn());
const revalidatePathMock = vi.hoisted(() => vi.fn());
const createStaffAuthUserMock = vi.hoisted(() => vi.fn());
const deleteStaffAuthUserMock = vi.hoisted(() => vi.fn());
const setStaffAuthBanMock = vi.hoisted(() => vi.fn());
const createStaffProfileMock = vi.hoisted(() => vi.fn());
const setStaffRoleMock = vi.hoisted(() => vi.fn());
const suspendStaffProfileMock = vi.hoisted(() => vi.fn());
const activateStaffProfileMock = vi.hoisted(() => vi.fn());
const getStaffMatchHistoryCountMock = vi.hoisted(() => vi.fn());

vi.mock("next/cache", () => ({
  revalidatePath: revalidatePathMock,
}));

vi.mock("@/features/football-tournaments/data", () => ({
  requireAdmin: requireAdminMock,
}));

vi.mock("../staff-admin.server", () => ({
  activateStaffProfile: activateStaffProfileMock,
  createStaffAuthUser: createStaffAuthUserMock,
  createStaffProfile: createStaffProfileMock,
  deleteStaffAuthUser: deleteStaffAuthUserMock,
  getStaffMatchHistoryCount: getStaffMatchHistoryCountMock,
  setStaffAuthBan: setStaffAuthBanMock,
  setStaffRole: setStaffRoleMock,
  suspendStaffProfile: suspendStaffProfileMock,
}));

import {
  createStaffUser,
  deleteStaffUser,
  reactivateStaffUser,
  suspendStaffUser,
  updateStaffRole,
} from "../staff-actions";
import type { ActionState } from "../actions";

function formData(fields: Record<string, string>) {
  const data = new FormData();

  Object.entries(fields).forEach(([key, value]) => {
    data.set(key, value);
  });

  return data;
}

describe("staff admin actions", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    requireAdminMock.mockResolvedValue({
      id: "admin-1",
      email: "admin@vixen.test",
      role: "admin",
      status: "active",
    });
    createStaffAuthUserMock.mockResolvedValue({
      data: { user: { id: "viewer-1" } },
      error: null,
    });
    createStaffProfileMock.mockResolvedValue({ data: null, error: null });
    deleteStaffAuthUserMock.mockResolvedValue({ data: {}, error: null });
    setStaffRoleMock.mockResolvedValue({ data: null, error: null });
    suspendStaffProfileMock.mockResolvedValue({ data: null, error: null });
    activateStaffProfileMock.mockResolvedValue({ data: null, error: null });
    setStaffAuthBanMock.mockResolvedValue({ data: { user: {} }, error: null });
    getStaffMatchHistoryCountMock.mockResolvedValue(0);
  });

  it("creates an auth user and matching active staff profile", async () => {
    const state = await createStaffUser(
      { ok: false, message: "" },
      formData({
        email: "  veedor@vixen.test  ",
        password: "temporary-password",
        role: "viewer",
      }),
    );

    expect(state).toEqual<ActionState>({
      ok: true,
      message: "Usuario creado.",
    });
    expect(requireAdminMock).toHaveBeenCalledTimes(1);
    expect(createStaffAuthUserMock).toHaveBeenCalledWith({
      email: "veedor@vixen.test",
      password: "temporary-password",
    });
    expect(createStaffProfileMock).toHaveBeenCalledWith({
      id: "viewer-1",
      email: "veedor@vixen.test",
      role: "viewer",
    });
    expect(revalidatePathMock).toHaveBeenCalledWith("/admin/usuarios");
  });

  it("rolls back the auth user if staff profile creation fails", async () => {
    createStaffProfileMock.mockResolvedValue({
      data: null,
      error: new Error("duplicate profile"),
    });

    const state = await createStaffUser(
      { ok: false, message: "" },
      formData({
        email: "veedor@vixen.test",
        password: "temporary-password",
        role: "viewer",
      }),
    );

    expect(state).toEqual<ActionState>({
      ok: false,
      message: "duplicate profile",
    });
    expect(deleteStaffAuthUserMock).toHaveBeenCalledWith("viewer-1");
  });

  it("prevents admins from changing their own role", async () => {
    const state = await updateStaffRole(
      "admin-1",
      { ok: false, message: "" },
      formData({ role: "viewer" }),
    );

    expect(state).toEqual<ActionState>({
      ok: false,
      message: "No podés cambiar tu propio rol.",
    });
    expect(setStaffRoleMock).not.toHaveBeenCalled();
  });

  it("updates another staff member role", async () => {
    const state = await updateStaffRole(
      "viewer-1",
      { ok: false, message: "" },
      formData({ role: "admin" }),
    );

    expect(state).toEqual<ActionState>({
      ok: true,
      message: "Rol actualizado.",
    });
    expect(setStaffRoleMock).toHaveBeenCalledWith("viewer-1", "admin");
  });

  it("suspends another staff member and bans auth access", async () => {
    const state = await suspendStaffUser(
      "viewer-1",
      { ok: false, message: "" },
      formData({ reason: "Carga incorrecta reiterada" }),
    );

    expect(state).toEqual<ActionState>({
      ok: true,
      message: "Usuario suspendido.",
    });
    expect(suspendStaffProfileMock).toHaveBeenCalledWith({
      userId: "viewer-1",
      suspendedAt: expect.any(String),
      reason: "Carga incorrecta reiterada",
    });
    expect(setStaffAuthBanMock).toHaveBeenCalledWith("viewer-1", "876000h");
  });

  it("reactivates another staff member and clears auth ban", async () => {
    const state = await reactivateStaffUser("viewer-1");

    expect(state).toEqual<ActionState>({
      ok: true,
      message: "Usuario reactivado.",
    });
    expect(activateStaffProfileMock).toHaveBeenCalledWith("viewer-1");
    expect(setStaffAuthBanMock).toHaveBeenCalledWith("viewer-1", "none");
  });

  it("blocks deleting staff with assigned or submitted match history", async () => {
    getStaffMatchHistoryCountMock.mockResolvedValue(1);

    const state = await deleteStaffUser(
      "viewer-1",
      "veedor@vixen.test",
      { ok: false, message: "" },
      formData({ confirmation: "veedor@vixen.test" }),
    );

    expect(state).toEqual<ActionState>({
      ok: false,
      message: "No se puede eliminar un usuario con historial de partidos.",
    });
    expect(deleteStaffAuthUserMock).not.toHaveBeenCalled();
  });

  it("deletes staff without match history after email confirmation", async () => {
    const state = await deleteStaffUser(
      "viewer-1",
      "veedor@vixen.test",
      { ok: false, message: "" },
      formData({ confirmation: "veedor@vixen.test" }),
    );

    expect(state).toEqual<ActionState>({
      ok: true,
      message: "Usuario eliminado.",
    });
    expect(deleteStaffAuthUserMock).toHaveBeenCalledWith("viewer-1");
    expect(revalidatePathMock).toHaveBeenCalledWith("/admin/usuarios");
  });
});
