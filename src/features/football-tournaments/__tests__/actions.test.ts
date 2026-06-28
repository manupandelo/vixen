import { beforeEach, describe, expect, it, vi } from "vitest";

const redirectMock = vi.hoisted(() => vi.fn((path: string) => {
  throw new Error(`NEXT_REDIRECT:${path}`);
}));
const revalidatePathMock = vi.hoisted(() => vi.fn());
const requireAdminMock = vi.hoisted(() => vi.fn());
const signInWithPasswordMock = vi.hoisted(() => vi.fn());
const signOutMock = vi.hoisted(() => vi.fn());
const maybeSingleMock = vi.hoisted(() => vi.fn());
const eqMock = vi.hoisted(() => vi.fn());
const selectMock = vi.hoisted(() => vi.fn());
const singleMock = vi.hoisted(() => vi.fn());
const insertMock = vi.hoisted(() => vi.fn());
const updateMock = vi.hoisted(() => vi.fn());
const fromMock = vi.hoisted(() => vi.fn());
const createSupabaseServerClientMock = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

vi.mock("next/cache", () => ({
  revalidatePath: revalidatePathMock,
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: createSupabaseServerClientMock,
}));

vi.mock("@/features/football-tournaments/data", () => ({
  requireAdmin: requireAdminMock,
}));

import {
  createTeam,
  createTournament,
  loginAdmin,
  logoutAdmin,
  pingAdminAccess,
  updateTournament,
  type ActionState,
} from "@/features/football-tournaments/actions";

function formData(fields: Record<string, string>) {
  const data = new FormData();

  Object.entries(fields).forEach(([key, value]) => {
    data.set(key, value);
  });

  return data;
}

function createSupabaseMock() {
  eqMock.mockReturnValue({ eq: eqMock, maybeSingle: maybeSingleMock });
  selectMock.mockReturnValue({ eq: eqMock });
  updateMock.mockReturnValue({ eq: eqMock });
  fromMock.mockReturnValue({
    insert: insertMock,
    select: selectMock,
    update: updateMock,
  });

  const supabase = {
    auth: {
      signInWithPassword: signInWithPasswordMock,
      signOut: signOutMock,
    },
    from: fromMock,
  };

  createSupabaseServerClientMock.mockResolvedValue(supabase);

  return supabase;
}

describe("football tournament admin actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createSupabaseMock();
  });

  it("returns a Spanish validation message when credentials are missing", async () => {
    const state = await loginAdmin(
      { ok: false, message: "" },
      formData({}),
    );

    expect(state).toEqual<ActionState>({
      ok: false,
      message: "Ingresá email y contraseña.",
    });
    expect(signInWithPasswordMock).not.toHaveBeenCalled();
  });

  it("trims email, preserves password exactly, and reports rejected credentials", async () => {
    signInWithPasswordMock.mockResolvedValue({
      data: { user: null },
      error: new Error("Invalid login credentials"),
    });

    const state = await loginAdmin(
      { ok: false, message: "" },
      formData({
        email: "  admin@vixen.test  ",
        password: "  spaced-password  ",
      }),
    );

    expect(signInWithPasswordMock).toHaveBeenCalledWith({
      email: "admin@vixen.test",
      password: "  spaced-password  ",
    });
    expect(state).toEqual<ActionState>({
      ok: false,
      message: "No pudimos iniciar sesión. Revisá email y contraseña.",
    });
  });

  it("signs out and rejects a signed-in user without an admin profile", async () => {
    signInWithPasswordMock.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });
    maybeSingleMock.mockResolvedValue({ data: null, error: null });

    const state = await loginAdmin(
      { ok: false, message: "" },
      formData({ email: "user@vixen.test", password: "password" }),
    );

    expect(fromMock).toHaveBeenCalledWith("admin_profiles");
    expect(selectMock).toHaveBeenCalledWith("id, email, role");
    expect(eqMock).toHaveBeenCalledWith("id", "user-1");
    expect(eqMock).toHaveBeenCalledWith("role", "admin");
    expect(signOutMock).toHaveBeenCalledTimes(1);
    expect(state).toEqual<ActionState>({
      ok: false,
      message: "Tu usuario no tiene permisos de administrador.",
    });
  });

  it("redirects to the admin dashboard when the signed-in user is an admin", async () => {
    signInWithPasswordMock.mockResolvedValue({
      data: { user: { id: "admin-1" } },
      error: null,
    });
    maybeSingleMock.mockResolvedValue({
      data: { id: "admin-1", email: "admin@vixen.test", role: "admin" },
      error: null,
    });

    await expect(
      loginAdmin(
        { ok: false, message: "" },
        formData({ email: "admin@vixen.test", password: "password" }),
      ),
    ).rejects.toThrow("NEXT_REDIRECT:/admin");

    expect(redirectMock).toHaveBeenCalledWith("/admin");
  });

  it("allows any current session to sign out and redirects to login", async () => {
    await expect(logoutAdmin()).rejects.toThrow("NEXT_REDIRECT:/admin/login");

    expect(signOutMock).toHaveBeenCalledTimes(1);
    expect(redirectMock).toHaveBeenCalledWith("/admin/login");
  });

  it("verifies admin access before revalidating the admin dashboard", async () => {
    requireAdminMock.mockResolvedValue({
      id: "admin-1",
      email: "admin@vixen.test",
      role: "admin",
    });

    await expect(pingAdminAccess()).resolves.toEqual<ActionState>({
      ok: true,
      message: "Acceso de administrador verificado.",
    });

    expect(requireAdminMock).toHaveBeenCalledTimes(1);
    expect(revalidatePathMock).toHaveBeenCalledWith("/admin");
  });

  it("requires admin access before rejecting invalid tournament data", async () => {
    requireAdminMock.mockResolvedValue({
      id: "admin-1",
      email: "admin@vixen.test",
      role: "admin",
    });

    const state = await createTournament(
      { ok: false, message: "" },
      formData({ name: "" }),
    );

    expect(requireAdminMock).toHaveBeenCalledTimes(1);
    expect(insertMock).not.toHaveBeenCalled();
    expect(state).toEqual<ActionState>({
      ok: false,
      message: "Revisá los datos del torneo.",
    });
  });

  it("creates a tournament with validated snake_case fields and redirects to the list", async () => {
    requireAdminMock.mockResolvedValue({
      id: "admin-1",
      email: "admin@vixen.test",
      role: "admin",
    });
    insertMock.mockResolvedValue({ data: null, error: null });

    await expect(
      createTournament(
        { ok: false, message: "" },
        formData({
          name: "Apertura Vixen",
          slug: "apertura-vixen",
          season: "2026",
          category: "Libre",
          status: "draft",
          startsAt: "2026-03-01",
          endsAt: "2026-06-30",
          description: " Torneo interno ",
        }),
      ),
    ).rejects.toThrow("NEXT_REDIRECT:/admin/torneos");

    expect(requireAdminMock).toHaveBeenCalledTimes(1);
    expect(fromMock).toHaveBeenCalledWith("football_tournaments");
    expect(insertMock).toHaveBeenCalledWith({
      name: "Apertura Vixen",
      slug: "apertura-vixen",
      season: "2026",
      category: "Libre",
      status: "draft",
      starts_at: "2026-03-01",
      ends_at: "2026-06-30",
      description: "Torneo interno",
    });
    expect(revalidatePathMock).toHaveBeenCalledWith("/admin/torneos");
    expect(redirectMock).toHaveBeenCalledWith("/admin/torneos");
  });

  it("returns the Supabase error message when tournament creation fails", async () => {
    requireAdminMock.mockResolvedValue({
      id: "admin-1",
      email: "admin@vixen.test",
      role: "admin",
    });
    insertMock.mockResolvedValue({
      data: null,
      error: new Error("duplicate key value violates unique constraint"),
    });

    const state = await createTournament(
      { ok: false, message: "" },
      formData({
        name: "Apertura Vixen",
        slug: "apertura-vixen",
        season: "2026",
        category: "Libre",
        status: "draft",
        startsAt: "",
        endsAt: "",
        description: "",
      }),
    );

    expect(state).toEqual<ActionState>({
      ok: false,
      message: "duplicate key value violates unique constraint",
    });
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it("updates a tournament and revalidates admin and public paths", async () => {
    requireAdminMock.mockResolvedValue({
      id: "admin-1",
      email: "admin@vixen.test",
      role: "admin",
    });
    eqMock.mockResolvedValue({ data: null, error: null });

    await expect(
      updateTournament(
        "tournament-1",
        { ok: false, message: "" },
        formData({
          name: "Clausura Vixen",
          slug: "clausura-vixen",
          season: "2026",
          category: "Senior",
          status: "published",
          startsAt: "2026-08-01",
          endsAt: "",
          description: "",
        }),
      ),
    ).resolves.toEqual<ActionState>({
      ok: true,
      message: "Torneo guardado.",
    });

    expect(requireAdminMock).toHaveBeenCalledTimes(1);
    expect(fromMock).toHaveBeenCalledWith("football_tournaments");
    expect(updateMock).toHaveBeenCalledWith({
      name: "Clausura Vixen",
      slug: "clausura-vixen",
      season: "2026",
      category: "Senior",
      status: "published",
      starts_at: "2026-08-01",
      ends_at: null,
      description: null,
    });
    expect(eqMock).toHaveBeenCalledWith("id", "tournament-1");
    expect(revalidatePathMock).toHaveBeenCalledWith("/admin/torneos");
    expect(revalidatePathMock).toHaveBeenCalledWith(
      "/admin/torneos/tournament-1",
    );
    expect(revalidatePathMock).toHaveBeenCalledWith("/futbol");
  });

  it("requires admin access before rejecting invalid team data", async () => {
    requireAdminMock.mockResolvedValue({
      id: "admin-1",
      email: "admin@vixen.test",
      role: "admin",
    });

    const state = await createTeam(
      "tournament-1",
      { ok: false, message: "" },
      formData({ name: "" }),
    );

    expect(requireAdminMock).toHaveBeenCalledTimes(1);
    expect(insertMock).not.toHaveBeenCalled();
    expect(state).toEqual<ActionState>({
      ok: false,
      message: "Revisá los datos del equipo.",
    });
  });

  it("creates a team and private admin details in separate tables", async () => {
    requireAdminMock.mockResolvedValue({
      id: "admin-1",
      email: "admin@vixen.test",
      role: "admin",
    });
    insertMock
      .mockReturnValueOnce({ select: selectMock })
      .mockResolvedValueOnce({ data: null, error: null });
    selectMock.mockReturnValueOnce({ single: singleMock });
    singleMock.mockResolvedValueOnce({
      data: { id: "team-1" },
      error: null,
    });

    const state = await createTeam(
      "tournament-1",
      { ok: false, message: "" },
      formData({
        name: "  Deportivo Vixen  ",
        shortName: "  DVX  ",
        captainName: "  Ana Perez  ",
        contactPhone: "  11 5555-1212  ",
        notes: "  Paga por transferencia  ",
      }),
    );

    expect(state).toEqual<ActionState>({
      ok: true,
      message: "Equipo creado.",
    });
    expect(fromMock).toHaveBeenNthCalledWith(1, "football_teams");
    expect(insertMock).toHaveBeenNthCalledWith(1, {
      tournament_id: "tournament-1",
      name: "Deportivo Vixen",
      short_name: "DVX",
    });
    expect(selectMock).toHaveBeenCalledWith("id");
    expect(singleMock).toHaveBeenCalledTimes(1);
    expect(fromMock).toHaveBeenNthCalledWith(
      2,
      "football_team_admin_details",
    );
    expect(insertMock).toHaveBeenNthCalledWith(2, {
      team_id: "team-1",
      captain_name: "Ana Perez",
      contact_phone: "11 5555-1212",
      notes: "Paga por transferencia",
    });
    expect(revalidatePathMock).toHaveBeenCalledWith(
      "/admin/torneos/tournament-1/equipos",
    );
    expect(revalidatePathMock).toHaveBeenCalledWith("/futbol");
  });

  it("returns the Supabase error message when private team details fail", async () => {
    requireAdminMock.mockResolvedValue({
      id: "admin-1",
      email: "admin@vixen.test",
      role: "admin",
    });
    insertMock
      .mockReturnValueOnce({ select: selectMock })
      .mockResolvedValueOnce({
        data: null,
        error: new Error("violates row-level security policy"),
      });
    selectMock.mockReturnValueOnce({ single: singleMock });
    singleMock.mockResolvedValueOnce({
      data: { id: "team-1" },
      error: null,
    });

    const state = await createTeam(
      "tournament-1",
      { ok: false, message: "" },
      formData({
        name: "Deportivo Vixen",
        shortName: "",
        captainName: "",
        contactPhone: "",
        notes: "",
      }),
    );

    expect(state).toEqual<ActionState>({
      ok: false,
      message: "violates row-level security policy",
    });
    expect(insertMock).toHaveBeenCalledTimes(2);
    expect(revalidatePathMock).not.toHaveBeenCalledWith(
      "/admin/torneos/tournament-1/equipos",
    );
    expect(revalidatePathMock).not.toHaveBeenCalledWith("/futbol");
  });
});
