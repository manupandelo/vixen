import { beforeEach, describe, expect, it, vi } from "vitest";

const redirectMock = vi.hoisted(() => vi.fn((path: string) => {
  throw new Error(`NEXT_REDIRECT:${path}`);
}));
const revalidatePathMock = vi.hoisted(() => vi.fn());
const requireAdminMock = vi.hoisted(() => vi.fn());
const requireViewerMock = vi.hoisted(() => vi.fn());
const getUserMock = vi.hoisted(() => vi.fn());
const signInWithPasswordMock = vi.hoisted(() => vi.fn());
const signOutMock = vi.hoisted(() => vi.fn());
const maybeSingleMock = vi.hoisted(() => vi.fn());
const eqMock = vi.hoisted(() => vi.fn());
const inMock = vi.hoisted(() => vi.fn());
const selectMock = vi.hoisted(() => vi.fn());
const singleMock = vi.hoisted(() => vi.fn());
const insertMock = vi.hoisted(() => vi.fn());
const updateMock = vi.hoisted(() => vi.fn());
const deleteMock = vi.hoisted(() => vi.fn());
const fromMock = vi.hoisted(() => vi.fn());
const storageFromMock = vi.hoisted(() => vi.fn());
const uploadMock = vi.hoisted(() => vi.fn());
const getPublicUrlMock = vi.hoisted(() => vi.fn());
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
  getAdminMatches: vi.fn(),
  getAdminTeams: vi.fn(),
  requireAdmin: requireAdminMock,
  requireViewer: requireViewerMock,
}));

import {
  assignMatchViewer,
  createMatch,
  createRosterEntry,
  createTeam,
  createTournament,
  deleteMatch,
  deleteRosterEntry,
  deleteTournament,
  generateBracketFixture,
  generateGroupPlayoffFixture,
  generateLeagueFixture,
  loginAdmin,
  logoutAdmin,
  pingAdminAccess,
  submitViewerMatchResult,
  updateMatch,
  updateMatchResult,
  updateRosterEntry,
  removeTeamFromTournament,
  updateTeam,
  updateTournament,
  type ActionState,
} from "@/features/football-tournaments/actions";
import {
  getAdminMatches,
  getAdminTeams,
} from "@/features/football-tournaments/data";

function formData(fields: Record<string, string>) {
  const data = new FormData();

  Object.entries(fields).forEach(([key, value]) => {
    data.set(key, value);
  });

  return data;
}

function createSupabaseMock() {
  const queryChain = {
    eq: eqMock,
    in: inMock,
    select: selectMock,
    maybeSingle: maybeSingleMock,
  };

  eqMock.mockReturnValue(queryChain);
  inMock.mockReturnValue({ maybeSingle: maybeSingleMock });
  selectMock.mockReturnValue({
    eq: eqMock,
    in: inMock,
    maybeSingle: maybeSingleMock,
  });
  updateMock.mockReturnValue({ eq: eqMock });
  deleteMock.mockReturnValue({ eq: eqMock });
  fromMock.mockReturnValue({
    insert: insertMock,
    select: selectMock,
    update: updateMock,
    delete: deleteMock,
  });

  const supabase = {
    auth: {
      getUser: getUserMock,
      signInWithPassword: signInWithPasswordMock,
      signOut: signOutMock,
    },
    from: fromMock,
    storage: {
      from: storageFromMock,
    },
  };

  storageFromMock.mockReturnValue({
    upload: uploadMock,
    getPublicUrl: getPublicUrlMock,
  });

  createSupabaseServerClientMock.mockResolvedValue(supabase);

  return supabase;
}

describe("football tournament admin actions", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    redirectMock.mockImplementation((path: string) => {
      throw new Error(`NEXT_REDIRECT:${path}`);
    });
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
    expect(selectMock).toHaveBeenCalledWith("id, email, role, status");
    expect(eqMock).toHaveBeenCalledWith("id", "user-1");
    expect(eqMock).toHaveBeenCalledWith("status", "active");
    expect(inMock).toHaveBeenCalledWith("role", ["admin", "viewer"]);
    expect(signOutMock).toHaveBeenCalledTimes(1);
    expect(state).toEqual<ActionState>({
      ok: false,
      message: "Tu usuario no tiene permisos activos para este panel.",
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

  it("redirects viewers to the viewer dashboard after login", async () => {
    signInWithPasswordMock.mockResolvedValue({
      data: { user: { id: "viewer-1" } },
      error: null,
    });
    maybeSingleMock.mockResolvedValue({
      data: { id: "viewer-1", email: "veedor@vixen.test", role: "viewer" },
      error: null,
    });

    await expect(
      loginAdmin(
        { ok: false, message: "" },
        formData({ email: "veedor@vixen.test", password: "password" }),
      ),
    ).rejects.toThrow("NEXT_REDIRECT:/veedor");

    expect(redirectMock).toHaveBeenCalledWith("/veedor");
  });

  it("checks the current session before signing out and redirecting to login", async () => {
    getUserMock.mockResolvedValue({
      data: { user: { id: "admin-1" } },
      error: null,
    });

    await expect(logoutAdmin()).rejects.toThrow("NEXT_REDIRECT:/admin/login");

    expect(getUserMock).toHaveBeenCalledTimes(1);
    expect(signOutMock).toHaveBeenCalledTimes(1);
    expect(redirectMock).toHaveBeenCalledWith("/admin/login");
  });

  it("redirects logout requests without a session before touching auth state", async () => {
    getUserMock.mockResolvedValue({
      data: { user: null },
      error: null,
    });

    await expect(logoutAdmin()).rejects.toThrow("NEXT_REDIRECT:/admin/login");

    expect(getUserMock).toHaveBeenCalledTimes(1);
    expect(signOutMock).not.toHaveBeenCalled();
    expect(redirectMock).toHaveBeenCalledWith("/admin/login");
  });

  it("verifies admin access before revalidating the admin dashboard", async () => {
    requireAdminMock.mockResolvedValue({
      id: "admin-1",
      email: "admin@vixen.test",
      role: "admin",
    });

    await expect(pingAdminAccess()).resolves.toEqual({
      ok: true,
      message: "Acceso de administrador verificado.",
    } satisfies ActionState);

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

  it("creates a tournament with generated slug and season, then redirects to teams", async () => {
    requireAdminMock.mockResolvedValue({
      id: "admin-1",
      email: "admin@vixen.test",
      role: "admin",
    });
    insertMock.mockReturnValueOnce({ select: selectMock });
    selectMock.mockReturnValueOnce({ single: singleMock });
    singleMock.mockResolvedValueOnce({
      data: { id: "tournament-1" },
      error: null,
    });

    await expect(
      createTournament(
        { ok: false, message: "" },
        formData({
          name: "Apertura Vixen",
          category: "Libre",
          format: "league",
          status: "draft",
          startsAt: "2026-03-01",
          endsAt: "2026-06-30",
          description: " Torneo interno ",
        }),
      ),
    ).rejects.toThrow(
      "NEXT_REDIRECT:/admin/torneos/tournament-1?tab=equipos&notice=tournament-created",
    );

    expect(requireAdminMock).toHaveBeenCalledTimes(1);
    expect(fromMock).toHaveBeenCalledWith("football_tournaments");
    expect(insertMock).toHaveBeenCalledWith({
      name: "Apertura Vixen",
      slug: "apertura-vixen",
      season: "2026",
      category: "Libre",
      format: "league",
      status: "draft",
      starts_at: "2026-03-01",
      ends_at: "2026-06-30",
      description: "Torneo interno",
    });
    expect(selectMock).toHaveBeenCalledWith("id");
    expect(singleMock).toHaveBeenCalledTimes(1);
    expect(revalidatePathMock).toHaveBeenCalledWith("/admin/torneos");
    expect(redirectMock).toHaveBeenCalledWith(
      "/admin/torneos/tournament-1?tab=equipos&notice=tournament-created",
    );
  });

  it("returns the Supabase error message when tournament creation fails", async () => {
    requireAdminMock.mockResolvedValue({
      id: "admin-1",
      email: "admin@vixen.test",
      role: "admin",
    });
    insertMock.mockReturnValueOnce({ select: selectMock });
    selectMock.mockReturnValueOnce({ single: singleMock });
    singleMock.mockResolvedValueOnce({
      data: null,
      error: new Error("duplicate key value violates unique constraint"),
    });

    const state = await createTournament(
      { ok: false, message: "" },
      formData({
        name: "Apertura Vixen",
        category: "Libre",
        format: "league",
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

  it("uploads a team photo and stores its public URL", async () => {
    requireAdminMock.mockResolvedValue({
      id: "admin-1",
      email: "admin@vixen.test",
      role: "admin",
    });
    uploadMock.mockResolvedValue({
      data: { path: "teams/team.png" },
      error: null,
    });
    getPublicUrlMock.mockReturnValue({
      data: { publicUrl: "https://cdn.vixen.test/team.png" },
    });
    insertMock
      .mockReturnValueOnce({ select: selectMock })
      .mockResolvedValueOnce({ data: null, error: null })
      .mockResolvedValueOnce({ data: null, error: null });
    selectMock.mockReturnValueOnce({ single: singleMock });
    singleMock.mockResolvedValueOnce({
      data: { id: "team-1" },
      error: null,
    });

    const data = formData({
      name: "Deportivo Vixen",
      shortName: "DVX",
      captainName: "",
      contactPhone: "",
      notes: "",
    });
    data.set(
      "teamPhoto",
      new File(["image"], "equipo.png", { type: "image/png" }),
    );

    const state = await createTeam(
      "tournament-1",
      { ok: false, message: "" },
      data,
    );

    expect(state).toEqual<ActionState>({
      ok: true,
      message: "Equipo creado.",
    });
    expect(storageFromMock).toHaveBeenCalledWith("team-photos");
    expect(uploadMock).toHaveBeenCalledWith(
      expect.stringMatching(/^teams\/.+-equipo\.png$/),
      expect.any(File),
      { contentType: "image/png", upsert: true },
    );
    expect(insertMock).toHaveBeenNthCalledWith(1, {
      name: "Deportivo Vixen",
      short_name: "DVX",
      photo_url: "https://cdn.vixen.test/team.png",
    });
    expect(insertMock).toHaveBeenNthCalledWith(3, {
      tournament_id: "tournament-1",
      team_id: "team-1",
    });
  });

  it("updates a tournament and revalidates admin and public paths", async () => {
    requireAdminMock.mockResolvedValue({
      id: "admin-1",
      email: "admin@vixen.test",
      role: "admin",
    });
    maybeSingleMock.mockResolvedValue({
      data: { id: "tournament-1" },
      error: null,
    });

    await expect(
      updateTournament(
        "tournament-1",
        { ok: false, message: "" },
        formData({
          name: "Clausura Vixen",
          slug: "clausura-vixen",
          season: "2026",
          category: "Senior",
          format: "league_playoff",
          status: "published",
          startsAt: "2026-08-01",
          endsAt: "",
          description: "",
        }),
      ),
    ).resolves.toEqual({
      ok: true,
      message: "Torneo guardado.",
    } satisfies ActionState);

    expect(requireAdminMock).toHaveBeenCalledTimes(1);
    expect(fromMock).toHaveBeenCalledWith("football_tournaments");
    expect(updateMock).toHaveBeenCalledWith({
      name: "Clausura Vixen",
      slug: "clausura-vixen",
      season: "2026",
      category: "Senior",
      format: "league_playoff",
      status: "published",
      starts_at: "2026-08-01",
      ends_at: null,
      description: null,
    });
    expect(eqMock).toHaveBeenCalledWith("id", "tournament-1");
    expect(selectMock).toHaveBeenCalledWith("id");
    expect(maybeSingleMock).toHaveBeenCalledTimes(1);
    expect(fromMock).toHaveBeenCalledWith("football_audit_events");
    expect(insertMock).toHaveBeenCalledWith({
      tournament_id: "tournament-1",
      actor_profile_id: "admin-1",
      actor_email: "admin@vixen.test",
      entity_type: "tournament",
      entity_id: "tournament-1",
      action: "updated",
      summary: "Actualizó datos del torneo",
      metadata: {
        changedFields: [
          "name",
          "slug",
          "season",
          "category",
          "format",
          "status",
          "starts_at",
          "ends_at",
          "description",
        ],
      },
    });
    expect(revalidatePathMock).toHaveBeenCalledWith("/admin/torneos");
    expect(revalidatePathMock).toHaveBeenCalledWith(
      "/admin/torneos/tournament-1",
    );
    expect(revalidatePathMock).toHaveBeenCalledWith("/futbol");
  });

  it("reports when a tournament update did not touch any row", async () => {
    requireAdminMock.mockResolvedValue({
      id: "admin-1",
      email: "admin@vixen.test",
      role: "admin",
    });
    maybeSingleMock.mockResolvedValue({ data: null, error: null });

    await expect(
      updateTournament(
        "tournament-1",
        { ok: false, message: "" },
        formData({
          name: "Clausura Vixen",
          category: "Senior",
          format: "league_playoff",
          status: "published",
          startsAt: "2026-08-01",
          endsAt: "",
          description: "",
        }),
      ),
    ).resolves.toEqual({
      ok: false,
      message: "No pudimos guardar el torneo.",
    } satisfies ActionState);

    expect(revalidatePathMock).not.toHaveBeenCalled();
  });

  it("requires the tournament name before deleting a tournament", async () => {
    requireAdminMock.mockResolvedValue({
      id: "admin-1",
      email: "admin@vixen.test",
      role: "admin",
    });

    const state = await deleteTournament(
      "tournament-1",
      "Apertura Vixen",
      { ok: false, message: "" },
      formData({ confirmation: "Apertura" }),
    );

    expect(state).toEqual<ActionState>({
      ok: false,
      message: 'Escribí "Apertura Vixen" para borrar el torneo.',
    });
    expect(requireAdminMock).toHaveBeenCalledTimes(1);
    expect(deleteMock).not.toHaveBeenCalled();
  });

  it("deletes a tournament and redirects back to the tournament list", async () => {
    requireAdminMock.mockResolvedValue({
      id: "admin-1",
      email: "admin@vixen.test",
      role: "admin",
    });
    eqMock.mockResolvedValueOnce({ data: null, error: null });

    await expect(
      deleteTournament(
        "tournament-1",
        "Apertura Vixen",
        { ok: false, message: "" },
        formData({ confirmation: "Apertura Vixen" }),
      ),
    ).rejects.toThrow("NEXT_REDIRECT:/admin/torneos");

    expect(requireAdminMock).toHaveBeenCalledTimes(1);
    expect(fromMock).toHaveBeenCalledWith("football_tournaments");
    expect(deleteMock).toHaveBeenCalledTimes(1);
    expect(eqMock).toHaveBeenCalledWith("id", "tournament-1");
    expect(revalidatePathMock).toHaveBeenCalledWith("/admin");
    expect(revalidatePathMock).toHaveBeenCalledWith("/admin/torneos");
    expect(revalidatePathMock).toHaveBeenCalledWith(
      "/admin/torneos/tournament-1",
    );
    expect(revalidatePathMock).toHaveBeenCalledWith("/futbol");
    expect(redirectMock).toHaveBeenCalledWith("/admin/torneos");
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
      .mockResolvedValueOnce({ data: null, error: null })
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
      name: "Deportivo Vixen",
      short_name: "DVX",
      photo_url: null,
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
    expect(fromMock).toHaveBeenNthCalledWith(3, "football_tournament_teams");
    expect(insertMock).toHaveBeenNthCalledWith(3, {
      tournament_id: "tournament-1",
      team_id: "team-1",
    });
    expect(revalidatePathMock).toHaveBeenCalledWith(
      "/admin/torneos/tournament-1",
    );
    expect(revalidatePathMock).toHaveBeenCalledWith("/futbol");
  });

  it("adds an existing global team to a tournament without duplicating it", async () => {
    requireAdminMock.mockResolvedValue({
      id: "admin-1",
      email: "admin@vixen.test",
      role: "admin",
    });
    insertMock.mockResolvedValueOnce({ data: null, error: null });

    const state = await createTeam(
      "tournament-1",
      { ok: false, message: "" },
      formData({
        existingTeamId: "team-existing",
        name: "",
        shortName: "",
        captainName: "",
        contactPhone: "",
        notes: "",
      }),
    );

    expect(state).toEqual<ActionState>({
      ok: true,
      message: "Equipo agregado al torneo.",
    });
    expect(fromMock).toHaveBeenCalledWith("football_tournament_teams");
    expect(insertMock).toHaveBeenCalledTimes(1);
    expect(insertMock).toHaveBeenCalledWith({
      tournament_id: "tournament-1",
      team_id: "team-existing",
    });
    expect(storageFromMock).not.toHaveBeenCalled();
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
      "/admin/torneos/tournament-1",
    );
    expect(revalidatePathMock).not.toHaveBeenCalledWith("/futbol");
  });

  it("updates a team and its private admin details", async () => {
    requireAdminMock.mockResolvedValue({
      id: "admin-1",
      email: "admin@vixen.test",
      role: "admin",
    });
    maybeSingleMock
      .mockResolvedValueOnce({ data: { id: "team-1" }, error: null })
      .mockResolvedValueOnce({ data: { team_id: "team-1" }, error: null });

    const state = await updateTeam(
      "tournament-1",
      "team-1",
      { ok: false, message: "" },
      formData({
        existingTeamId: "",
        name: "  Deportivo Vixen  ",
        shortName: "  DVX  ",
        captainName: "  Ana Perez  ",
        contactPhone: "  11 5555-1212  ",
        notes: "  Nueva nota  ",
      }),
    );

    expect(state).toEqual<ActionState>({
      ok: true,
      message: "Equipo guardado.",
    });
    expect(fromMock).toHaveBeenNthCalledWith(1, "football_teams");
    expect(updateMock).toHaveBeenNthCalledWith(1, {
      name: "Deportivo Vixen",
      short_name: "DVX",
    });
    expect(eqMock).toHaveBeenCalledWith("id", "team-1");
    expect(fromMock).toHaveBeenNthCalledWith(
      2,
      "football_team_admin_details",
    );
    expect(updateMock).toHaveBeenNthCalledWith(2, {
      captain_name: "Ana Perez",
      contact_phone: "11 5555-1212",
      notes: "Nueva nota",
    });
    expect(eqMock).toHaveBeenCalledWith("team_id", "team-1");
    expect(revalidatePathMock).toHaveBeenCalledWith(
      "/admin/torneos/tournament-1",
    );
    expect(revalidatePathMock).toHaveBeenCalledWith("/futbol");
  });

  it("reports when a team update did not touch any team", async () => {
    requireAdminMock.mockResolvedValue({
      id: "admin-1",
      email: "admin@vixen.test",
      role: "admin",
    });
    maybeSingleMock.mockResolvedValueOnce({ data: null, error: null });

    const state = await updateTeam(
      "tournament-1",
      "missing-team",
      { ok: false, message: "" },
      formData({
        existingTeamId: "",
        name: "Deportivo Vixen",
        shortName: "DVX",
        captainName: "",
        contactPhone: "",
        notes: "",
      }),
    );

    expect(state).toEqual<ActionState>({
      ok: false,
      message: "No pudimos guardar el equipo.",
    });
    expect(revalidatePathMock).not.toHaveBeenCalled();
  });

  it("removes a team from a tournament when it has no matches there", async () => {
    requireAdminMock.mockResolvedValue({
      id: "admin-1",
      email: "admin@vixen.test",
      role: "admin",
    });
    vi.mocked(getAdminMatches).mockResolvedValue([]);
    maybeSingleMock.mockResolvedValueOnce({
      data: { team_id: "team-1" },
      error: null,
    });

    const state = await removeTeamFromTournament(
      "tournament-1",
      "team-1",
      { ok: false, message: "" },
      formData({}),
    );

    expect(state).toEqual<ActionState>({
      ok: true,
      message: "Equipo quitado del torneo.",
    });
    expect(fromMock).toHaveBeenCalledWith("football_tournament_teams");
    expect(deleteMock).toHaveBeenCalledTimes(1);
    expect(eqMock).toHaveBeenCalledWith("tournament_id", "tournament-1");
    expect(eqMock).toHaveBeenCalledWith("team_id", "team-1");
    expect(selectMock).toHaveBeenCalledWith("team_id");
    expect(revalidatePathMock).toHaveBeenCalledWith(
      "/admin/torneos/tournament-1",
    );
    expect(revalidatePathMock).toHaveBeenCalledWith("/futbol");
  });

  it("does not remove a team that already has tournament matches", async () => {
    requireAdminMock.mockResolvedValue({
      id: "admin-1",
      email: "admin@vixen.test",
      role: "admin",
    });
    vi.mocked(getAdminMatches).mockResolvedValue([
      {
        id: "match-1",
        roundLabel: "Fecha 1",
        scheduledAt: null,
        homeTeamId: "team-1",
        awayTeamId: "team-2",
        homeScore: null,
        awayScore: null,
        status: "scheduled",
        assignedViewerId: null,
        resultLockedAt: null,
        resultSubmittedBy: null, isKnockout: false,
      },
    ]);

    const state = await removeTeamFromTournament(
      "tournament-1",
      "team-1",
      { ok: false, message: "" },
      formData({}),
    );

    expect(state).toEqual<ActionState>({
      ok: false,
      message:
        "No podés quitar un equipo que ya tiene partidos en este torneo.",
    });
    expect(deleteMock).not.toHaveBeenCalled();
  });

  it("creates a new player without requiring document number and adds them to a roster", async () => {
    requireAdminMock.mockResolvedValue({
      id: "admin-1",
      email: "admin@vixen.test",
      role: "admin",
    });
    insertMock
      .mockReturnValueOnce({ select: selectMock })
      .mockReturnValueOnce({ select: selectMock });
    selectMock
      .mockReturnValueOnce({ single: singleMock })
      .mockReturnValueOnce({ single: singleMock });
    singleMock
      .mockResolvedValueOnce({ data: { id: "player-1" }, error: null })
      .mockResolvedValueOnce({ data: { id: "roster-1" }, error: null });

    const state = await createRosterEntry(
      "tournament-1",
      "team-1",
      { ok: false, message: "" },
      formData({
        mode: "new",
        firstName: "  Juan  ",
        lastName: "  Perez  ",
        publicName: "",
        documentNumber: "",
        birthDate: "",
        phone: "  11 5555-1111  ",
        playerNotes: "  Zurdo  ",
        shirtNumber: "10",
        status: "active",
        medicalStatus: "pending",
        insuranceStatus: "approved",
        rosterNotes: "  Titular  ",
      }),
    );

    expect(state).toEqual<ActionState>({
      ok: true,
      message: "Jugador agregado al plantel.",
    });
    expect(fromMock).toHaveBeenNthCalledWith(1, "football_players");
    expect(insertMock).toHaveBeenNthCalledWith(1, {
      first_name: "Juan",
      last_name: "Perez",
      public_name: null,
      document_number: null,
      birth_date: null,
      phone: "11 5555-1111",
      notes: "Zurdo",
    });
    expect(fromMock).toHaveBeenNthCalledWith(2, "football_roster_entries");
    expect(insertMock).toHaveBeenNthCalledWith(2, {
      tournament_id: "tournament-1",
      team_id: "team-1",
      player_id: "player-1",
      shirt_number: 10,
      status: "active",
      medical_status: "pending",
      insurance_status: "approved",
      notes: "Titular",
    });
    expect(revalidatePathMock).toHaveBeenCalledWith(
      "/admin/torneos/tournament-1",
    );
    expect(revalidatePathMock).not.toHaveBeenCalledWith("/futbol");
  });

  it("adds an existing player to a roster without duplicating the player record", async () => {
    requireAdminMock.mockResolvedValue({
      id: "admin-1",
      email: "admin@vixen.test",
      role: "admin",
    });
    insertMock.mockReturnValueOnce({ select: selectMock });
    selectMock.mockReturnValueOnce({ single: singleMock });
    singleMock.mockResolvedValueOnce({ data: { id: "roster-1" }, error: null });

    const state = await createRosterEntry(
      "tournament-1",
      "team-1",
      { ok: false, message: "" },
      formData({
        mode: "existing",
        playerId: "player-1",
        shirtNumber: "",
        status: "active",
        medicalStatus: "approved",
        insuranceStatus: "approved",
        rosterNotes: "",
      }),
    );

    expect(state).toEqual<ActionState>({
      ok: true,
      message: "Jugador agregado al plantel.",
    });
    expect(fromMock).toHaveBeenCalledWith("football_roster_entries");
    expect(insertMock).toHaveBeenCalledTimes(1);
    expect(insertMock).toHaveBeenCalledWith({
      tournament_id: "tournament-1",
      team_id: "team-1",
      player_id: "player-1",
      shirt_number: null,
      status: "active",
      medical_status: "approved",
      insurance_status: "approved",
      notes: null,
    });
  });

  it("updates roster entry status and documentation fields", async () => {
    requireAdminMock.mockResolvedValue({
      id: "admin-1",
      email: "admin@vixen.test",
      role: "admin",
    });
    maybeSingleMock.mockResolvedValueOnce({
      data: { id: "roster-1" },
      error: null,
    });

    const state = await updateRosterEntry(
      "tournament-1",
      "roster-1",
      { ok: false, message: "" },
      formData({
        shirtNumber: "7",
        status: "suspended",
        medicalStatus: "expired",
        insuranceStatus: "pending",
        rosterNotes: "  Falta actualizar seguro  ",
      }),
    );

    expect(state).toEqual<ActionState>({
      ok: true,
      message: "Jugador del plantel guardado.",
    });
    expect(fromMock).toHaveBeenCalledWith("football_roster_entries");
    expect(updateMock).toHaveBeenCalledWith({
      shirt_number: 7,
      status: "suspended",
      medical_status: "expired",
      insurance_status: "pending",
      notes: "Falta actualizar seguro",
    });
    expect(eqMock).toHaveBeenCalledWith("id", "roster-1");
    expect(eqMock).toHaveBeenCalledWith("tournament_id", "tournament-1");
    expect(revalidatePathMock).toHaveBeenCalledWith(
      "/admin/torneos/tournament-1",
    );
  });

  it("removes a roster entry from a tournament", async () => {
    requireAdminMock.mockResolvedValue({
      id: "admin-1",
      email: "admin@vixen.test",
      role: "admin",
    });
    maybeSingleMock.mockResolvedValueOnce({
      data: { id: "roster-1" },
      error: null,
    });

    const state = await deleteRosterEntry(
      "tournament-1",
      "roster-1",
      { ok: false, message: "" },
      formData({}),
    );

    expect(state).toEqual<ActionState>({
      ok: true,
      message: "Jugador quitado del plantel.",
    });
    expect(fromMock).toHaveBeenCalledWith("football_roster_entries");
    expect(deleteMock).toHaveBeenCalledTimes(1);
    expect(eqMock).toHaveBeenCalledWith("id", "roster-1");
    expect(eqMock).toHaveBeenCalledWith("tournament_id", "tournament-1");
    expect(selectMock).toHaveBeenCalledWith("id");
    expect(revalidatePathMock).toHaveBeenCalledWith(
      "/admin/torneos/tournament-1",
    );
  });

  it("requires admin access before rejecting invalid match data", async () => {
    requireAdminMock.mockResolvedValue({
      id: "admin-1",
      email: "admin@vixen.test",
      role: "admin",
    });

    const state = await createMatch(
      "tournament-1",
      { ok: false, message: "" },
      formData({
        roundLabel: "",
        scheduledAt: "",
        homeTeamId: "team-1",
        awayTeamId: "team-1",
        status: "scheduled",
        homeScore: "",
        awayScore: "",
      }),
    );

    expect(requireAdminMock).toHaveBeenCalledTimes(1);
    expect(insertMock).not.toHaveBeenCalled();
    expect(state).toEqual<ActionState>({
      ok: false,
      message: "Revisá los datos del partido.",
    });
  });

  it("creates a completed match with normalized datetime and scores", async () => {
    requireAdminMock.mockResolvedValue({
      id: "admin-1",
      email: "admin@vixen.test",
      role: "admin",
    });
    insertMock.mockResolvedValue({ data: null, error: null });

    const state = await createMatch(
      "tournament-1",
      { ok: false, message: "" },
      formData({
        roundLabel: " Fecha 1 ",
        scheduledAt: "2026-03-01T20:30",
        homeTeamId: "team-1",
        awayTeamId: "team-2",
        status: "completed",
        homeScore: "3",
        awayScore: "1",
      }),
    );

    expect(state).toEqual<ActionState>({
      ok: true,
      message: "Partido guardado.",
    });
    expect(requireAdminMock).toHaveBeenCalledTimes(1);
    expect(fromMock).toHaveBeenCalledWith("football_matches");
    expect(insertMock).toHaveBeenCalledWith({
      tournament_id: "tournament-1",
      round_label: "Fecha 1",
      scheduled_at: "2026-03-01T20:30:00-03:00",
      home_team_id: "team-1",
      away_team_id: "team-2",
      home_score: 3,
      away_score: 1,
      status: "completed",
    });
    expect(revalidatePathMock).toHaveBeenCalledWith(
      "/admin/torneos/tournament-1",
    );
    expect(revalidatePathMock).toHaveBeenCalledWith("/futbol");
  });

  it("clears submitted scores when creating a scheduled match", async () => {
    requireAdminMock.mockResolvedValue({
      id: "admin-1",
      email: "admin@vixen.test",
      role: "admin",
    });
    insertMock.mockResolvedValue({ data: null, error: null });

    const state = await createMatch(
      "tournament-1",
      { ok: false, message: "" },
      formData({
        roundLabel: "Fecha 2",
        scheduledAt: "",
        homeTeamId: "team-1",
        awayTeamId: "team-2",
        status: "scheduled",
        homeScore: "5",
        awayScore: "4",
      }),
    );

    expect(state).toEqual<ActionState>({
      ok: true,
      message: "Partido guardado.",
    });
    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        scheduled_at: null,
        home_score: null,
        away_score: null,
        status: "scheduled",
      }),
    );
  });

  it("generates a league fixture only when the tournament has no matches", async () => {
    vi.mocked(getAdminTeams).mockResolvedValue([
      {
        id: "team-1",
        name: "Vixen Norte",
        shortName: "VXN",
        photoUrl: null,
        captainName: null,
        contactPhone: null,
        notes: null,
      },
      {
        id: "team-2",
        name: "Vixen Sur",
        shortName: "VXS",
        photoUrl: null,
        captainName: null,
        contactPhone: null,
        notes: null,
      },
      {
        id: "team-3",
        name: "Vixen Este",
        shortName: "VXE",
        photoUrl: null,
        captainName: null,
        contactPhone: null,
        notes: null,
      },
    ]);
    vi.mocked(getAdminMatches).mockResolvedValue([]);
    requireAdminMock.mockResolvedValue({
      id: "admin-1",
      email: "admin@vixen.test",
      role: "admin",
    });
    insertMock.mockResolvedValue({ data: null, error: null });

    const state = await generateLeagueFixture(
      "tournament-1",
      { ok: false, message: "" },
      formData({
        legs: "1",
        startsAt: "2026-03-01",
        kickoffTime: "20:30",
        daysBetweenRounds: "7",
      }),
    );

    expect(state).toEqual<ActionState>({
      ok: true,
      message: "Fixture generado con 3 partidos.",
    });
    expect(requireAdminMock).toHaveBeenCalledTimes(1);
    expect(insertMock).toHaveBeenCalledWith([
      expect.objectContaining({
        tournament_id: "tournament-1",
        round_label: "Fecha 1",
        scheduled_at: "2026-03-01T20:30:00-03:00",
      }),
      expect.objectContaining({
        tournament_id: "tournament-1",
        round_label: "Fecha 2",
        scheduled_at: "2026-03-08T20:30:00-03:00",
      }),
      expect.objectContaining({
        tournament_id: "tournament-1",
        round_label: "Fecha 3",
        scheduled_at: "2026-03-15T20:30:00-03:00",
      }),
    ]);
    expect(revalidatePathMock).toHaveBeenCalledWith(
      "/admin/torneos/tournament-1",
    );
    expect(revalidatePathMock).toHaveBeenCalledWith("/futbol");
  });

  it("does not generate a fixture over existing matches", async () => {
    vi.mocked(getAdminTeams).mockResolvedValue([
      {
        id: "team-1",
        name: "Vixen Norte",
        shortName: "VXN",
        photoUrl: null,
        captainName: null,
        contactPhone: null,
        notes: null,
      },
      {
        id: "team-2",
        name: "Vixen Sur",
        shortName: "VXS",
        photoUrl: null,
        captainName: null,
        contactPhone: null,
        notes: null,
      },
    ]);
    vi.mocked(getAdminMatches).mockResolvedValue([
      {
        id: "match-1",
        roundLabel: "Fecha 1",
        scheduledAt: null,
        homeTeamId: "team-1",
        awayTeamId: "team-2",
        homeScore: null,
        awayScore: null,
        status: "scheduled",
        assignedViewerId: null,
        resultLockedAt: null,
        resultSubmittedBy: null, isKnockout: false,
      },
    ]);
    requireAdminMock.mockResolvedValue({
      id: "admin-1",
      email: "admin@vixen.test",
      role: "admin",
    });

    const state = await generateLeagueFixture(
      "tournament-1",
      { ok: false, message: "" },
      formData({
        legs: "1",
        startsAt: "",
        kickoffTime: "",
        daysBetweenRounds: "7",
      }),
    );

    expect(state).toEqual<ActionState>({
      ok: false,
      message: "Este torneo ya tiene partidos cargados.",
    });
    expect(insertMock).not.toHaveBeenCalled();
  });

  it("explains when the bracket migration is missing from Supabase", async () => {
    vi.mocked(getAdminMatches).mockResolvedValue([]);
    requireAdminMock.mockResolvedValue({
      id: "admin-1",
      email: "admin@vixen.test",
      role: "admin",
    });
    insertMock.mockResolvedValue({
      data: null,
      error: {
        message:
          "Could not find the 'next_match_id' column of 'football_matches' in the schema cache",
      },
    });

    const state = await generateBracketFixture(
      "tournament-1",
      { ok: false, message: "" },
      formData({
        bracketData: JSON.stringify({
          startsAt: "2026-03-01",
          daysBetweenRounds: 7,
          initialMatches: [
            {
              id: "match-1",
              roundLabel: "Semifinales",
              depth: 1,
              homeTeamId: "team-1",
              awayTeamId: "team-2",
              nextMatchId: "match-3",
            },
            {
              id: "match-2",
              roundLabel: "Semifinales",
              depth: 1,
              homeTeamId: "team-3",
              awayTeamId: "team-4",
              nextMatchId: "match-3",
            },
            {
              id: "match-3",
              roundLabel: "Final",
              depth: 0,
              homeTeamId: null,
              awayTeamId: null,
              nextMatchId: null,
            },
          ],
        }),
      }),
    );

    expect(state).toEqual<ActionState>({
      ok: false,
      message:
        "Falta aplicar la migración de llaves de copa en Supabase. Ejecutá la migración 20260701020000_update_football_matches_for_brackets.sql y recargá el schema cache.",
    });
  });

  it("maps temporary bracket node ids to database UUIDs before inserting", async () => {
    vi.mocked(getAdminMatches).mockResolvedValue([]);
    requireAdminMock.mockResolvedValue({
      id: "admin-1",
      email: "admin@vixen.test",
      role: "admin",
    });
    insertMock.mockResolvedValue({ data: null, error: null });

    const state = await generateBracketFixture(
      "tournament-1",
      { ok: false, message: "" },
      formData({
        bracketData: JSON.stringify({
          startsAt: "2026-03-01",
          daysBetweenRounds: 7,
          initialMatches: [
            {
              id: "ezgbmft",
              roundLabel: "Semifinales",
              depth: 1,
              homeTeamId: "team-1",
              awayTeamId: "team-2",
              nextMatchId: "finaltemp",
            },
            {
              id: "abc1234",
              roundLabel: "Semifinales",
              depth: 1,
              homeTeamId: "team-3",
              awayTeamId: "team-4",
              nextMatchId: "finaltemp",
            },
            {
              id: "finaltemp",
              roundLabel: "Final",
              depth: 0,
              homeTeamId: null,
              awayTeamId: null,
              nextMatchId: null,
            },
          ],
        }),
      }),
    );

    expect(state).toEqual<ActionState>({
      ok: true,
      message: "Llave generada con 3 partidos.",
    });

    const uuidPattern =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const insertedMatches = insertMock.mock.calls[0][0] as Array<{
      id: string;
      round_label: string;
      next_match_id: string | null;
    }>;
    const finalMatch = insertedMatches.find(
      (match) => match.round_label === "Final",
    );

    expect(insertedMatches).toHaveLength(3);
    expect(insertedMatches.map((match) => match.id)).not.toContain("ezgbmft");
    expect(insertedMatches.every((match) => uuidPattern.test(match.id))).toBe(
      true,
    );
    expect(finalMatch?.id).toEqual(expect.stringMatching(uuidPattern));
    expect(
      insertedMatches
        .filter((match) => match.round_label === "Semifinales")
        .every((match) => match.next_match_id === finalMatch?.id),
    ).toBe(true);
  });

  it("generates zones plus playoff fixtures for league playoff tournaments", async () => {
    vi.mocked(getAdminTeams).mockResolvedValue([
      {
        id: "team-1",
        name: "Vixen Norte",
        shortName: null,
        photoUrl: null,
        captainName: null,
        contactPhone: null,
        notes: null,
      },
      {
        id: "team-2",
        name: "Vixen Sur",
        shortName: null,
        photoUrl: null,
        captainName: null,
        contactPhone: null,
        notes: null,
      },
      {
        id: "team-3",
        name: "Vixen Este",
        shortName: null,
        photoUrl: null,
        captainName: null,
        contactPhone: null,
        notes: null,
      },
      {
        id: "team-4",
        name: "Vixen Oeste",
        shortName: null,
        photoUrl: null,
        captainName: null,
        contactPhone: null,
        notes: null,
      },
    ]);
    vi.mocked(getAdminMatches).mockResolvedValue([]);
    requireAdminMock.mockResolvedValue({
      id: "admin-1",
      email: "admin@vixen.test",
      role: "admin",
    });
    insertMock.mockResolvedValue({ data: null, error: null });

    const state = await generateGroupPlayoffFixture(
      "tournament-1",
      { ok: false, message: "" },
      formData({
        groupCount: "2",
        qualifiersPerGroup: "1",
        startsAt: "2026-03-01",
        kickoffTime: "20:30",
        daysBetweenGroupRounds: "7",
        daysBetweenPlayoffRounds: "7",
      }),
    );

    expect(state).toEqual<ActionState>({
      ok: true,
      message: "Fixture zonas + playoff generado con 3 partidos.",
    });
    expect(fromMock).toHaveBeenNthCalledWith(1, "football_tournament_groups");
    expect(fromMock).toHaveBeenNthCalledWith(
      2,
      "football_tournament_group_teams",
    );
    expect(fromMock).toHaveBeenNthCalledWith(3, "football_matches");

    const groupRows = insertMock.mock.calls[0][0] as Array<{
      id: string;
      tournament_id: string;
      name: string;
      position: number;
    }>;
    expect(groupRows).toEqual([
      {
        id: expect.any(String),
        tournament_id: "tournament-1",
        name: "Zona A",
        position: 1,
      },
      {
        id: expect.any(String),
        tournament_id: "tournament-1",
        name: "Zona B",
        position: 2,
      },
    ]);

    const groupTeamRows = insertMock.mock.calls[1][0] as Array<{
      group_id: string;
      team_id: string;
      seed: number;
    }>;
    expect(groupTeamRows).toEqual([
      { group_id: groupRows[0].id, team_id: "team-1", seed: 1 },
      { group_id: groupRows[0].id, team_id: "team-3", seed: 2 },
      { group_id: groupRows[1].id, team_id: "team-2", seed: 1 },
      { group_id: groupRows[1].id, team_id: "team-4", seed: 2 },
    ]);

    const matchRows = insertMock.mock.calls[2][0] as Array<{
      tournament_id: string;
      round_label: string;
      group_id: string | null;
      home_team_id: string | null;
      away_team_id: string | null;
      next_match_id: string | null;
    }>;
    expect(matchRows).toHaveLength(3);
    expect(matchRows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          tournament_id: "tournament-1",
          round_label: "Zona A - Fecha 1",
          group_id: groupRows[0].id,
          home_team_id: "team-1",
          away_team_id: "team-3",
        }),
        expect.objectContaining({
          tournament_id: "tournament-1",
          round_label: "Zona B - Fecha 1",
          group_id: groupRows[1].id,
          home_team_id: "team-2",
          away_team_id: "team-4",
        }),
        expect.objectContaining({
          tournament_id: "tournament-1",
          round_label: "Final",
          group_id: null,
          home_team_id: null,
          away_team_id: null,
          next_match_id: null,
        }),
      ]),
    );
    expect(revalidatePathMock).toHaveBeenCalledWith(
      "/admin/torneos/tournament-1",
    );
    expect(revalidatePathMock).toHaveBeenCalledWith("/futbol");
  });

  it("rejects zones plus playoff generation over existing matches", async () => {
    vi.mocked(getAdminTeams).mockResolvedValue([
      {
        id: "team-1",
        name: "Vixen Norte",
        shortName: null,
        photoUrl: null,
        captainName: null,
        contactPhone: null,
        notes: null,
      },
      {
        id: "team-2",
        name: "Vixen Sur",
        shortName: null,
        photoUrl: null,
        captainName: null,
        contactPhone: null,
        notes: null,
      },
    ]);
    vi.mocked(getAdminMatches).mockResolvedValue([
      {
        id: "match-1",
        roundLabel: "Zona A - Fecha 1",
        scheduledAt: null,
        homeTeamId: "team-1",
        awayTeamId: "team-2",
        homeScore: null,
        awayScore: null,
        status: "scheduled",
        assignedViewerId: null,
        resultLockedAt: null,
        resultSubmittedBy: null, isKnockout: false,
      },
    ]);
    requireAdminMock.mockResolvedValue({
      id: "admin-1",
      email: "admin@vixen.test",
      role: "admin",
    });

    const state = await generateGroupPlayoffFixture(
      "tournament-1",
      { ok: false, message: "" },
      formData({
        groupCount: "2",
        qualifiersPerGroup: "1",
        startsAt: "",
        kickoffTime: "",
        daysBetweenGroupRounds: "7",
        daysBetweenPlayoffRounds: "7",
      }),
    );

    expect(state).toEqual<ActionState>({
      ok: false,
      message: "Este torneo ya tiene partidos cargados.",
    });
    expect(insertMock).not.toHaveBeenCalled();
  });

  it("lets admins assign or clear a viewer for a match", async () => {
    requireAdminMock.mockResolvedValue({
      id: "admin-1",
      email: "admin@vixen.test",
      role: "admin",
    });
    maybeSingleMock.mockResolvedValue({
      data: { id: "match-1" },
      error: null,
    });

    const state = await assignMatchViewer(
      "tournament-1",
      "match-1",
      { ok: false, message: "" },
      formData({ assignedViewerId: "viewer-1" }),
    );

    expect(state).toEqual<ActionState>({
      ok: true,
      message: "Veedor asignado.",
    });
    expect(requireAdminMock).toHaveBeenCalledTimes(1);
    expect(fromMock).toHaveBeenCalledWith("football_matches");
    expect(updateMock).toHaveBeenCalledWith({
      assigned_viewer_id: "viewer-1",
    });
    expect(eqMock).toHaveBeenCalledWith("id", "match-1");
    expect(eqMock).toHaveBeenCalledWith("tournament_id", "tournament-1");
    expect(revalidatePathMock).toHaveBeenCalledWith(
      "/admin/torneos/tournament-1",
    );
    expect(revalidatePathMock).toHaveBeenCalledWith("/veedor");
  });

  it("reports when assigning a viewer did not touch any match", async () => {
    requireAdminMock.mockResolvedValue({
      id: "admin-1",
      email: "admin@vixen.test",
      role: "admin",
    });
    maybeSingleMock.mockResolvedValue({ data: null, error: null });

    const state = await assignMatchViewer(
      "tournament-1",
      "missing-match",
      { ok: false, message: "" },
      formData({ assignedViewerId: "viewer-1" }),
    );

    expect(state).toEqual<ActionState>({
      ok: false,
      message: "No pudimos guardar el partido.",
    });
    expect(revalidatePathMock).not.toHaveBeenCalled();
  });

  it("lets admins update a match schedule and status", async () => {
    requireAdminMock.mockResolvedValue({
      id: "admin-1",
      email: "admin@vixen.test",
      role: "admin",
    });
    maybeSingleMock.mockResolvedValue({
      data: { id: "match-1" },
      error: null,
    });

    const state = await updateMatch(
      "tournament-1",
      "match-1",
      { ok: false, message: "" },
      formData({
        roundLabel: " Fecha 3 ",
        scheduledAt: "2026-03-15T21:00",
        homeTeamId: "team-1",
        awayTeamId: "team-2",
        status: "postponed",
        homeScore: "4",
        awayScore: "2",
      }),
    );

    expect(state).toEqual<ActionState>({
      ok: true,
      message: "Partido guardado.",
    });
    expect(updateMock).toHaveBeenCalledWith({
      round_label: "Fecha 3",
      scheduled_at: "2026-03-15T21:00:00-03:00",
      home_team_id: "team-1",
      away_team_id: "team-2",
      home_score: null,
      away_score: null,
      status: "postponed",
    });
    expect(eqMock).toHaveBeenCalledWith("id", "match-1");
    expect(eqMock).toHaveBeenCalledWith("tournament_id", "tournament-1");
    expect(selectMock).toHaveBeenCalledWith("id");
    expect(maybeSingleMock).toHaveBeenCalledTimes(1);
    expect(revalidatePathMock).toHaveBeenCalledWith(
      "/admin/torneos/tournament-1",
    );
    expect(revalidatePathMock).toHaveBeenCalledWith("/veedor");
    expect(revalidatePathMock).toHaveBeenCalledWith("/futbol");
  });

  it("lets admins delete a match from a tournament", async () => {
    requireAdminMock.mockResolvedValue({
      id: "admin-1",
      email: "admin@vixen.test",
      role: "admin",
    });
    maybeSingleMock.mockResolvedValue({
      data: { id: "match-1" },
      error: null,
    });

    const state = await deleteMatch(
      "tournament-1",
      "match-1",
      { ok: false, message: "" },
      formData({}),
    );

    expect(state).toEqual<ActionState>({
      ok: true,
      message: "Partido eliminado.",
    });
    expect(fromMock).toHaveBeenCalledWith("football_matches");
    expect(deleteMock).toHaveBeenCalledTimes(1);
    expect(eqMock).toHaveBeenCalledWith("id", "match-1");
    expect(eqMock).toHaveBeenCalledWith("tournament_id", "tournament-1");
    expect(selectMock).toHaveBeenCalledWith("id");
    expect(revalidatePathMock).toHaveBeenCalledWith(
      "/admin/torneos/tournament-1",
    );
    expect(revalidatePathMock).toHaveBeenCalledWith("/veedor");
    expect(revalidatePathMock).toHaveBeenCalledWith("/futbol");
  });

  it("lets admins update a locked match result", async () => {
    requireAdminMock.mockResolvedValue({
      id: "admin-1",
      email: "admin@vixen.test",
      role: "admin",
    });
    maybeSingleMock.mockResolvedValueOnce({
      data: {
        id: "match-1",
        tournament_id: "tournament-1",
        category_id: "category-1",
        home_team_id: "team-home",
        away_team_id: "team-away",
        group_id: "group-1",
        next_match_id: null,
        result_locked_at: "2026-07-02T12:00:00-03:00",
        football_tournaments: { format: "league" },
      },
      error: null,
    });
    maybeSingleMock.mockResolvedValueOnce({
      data: { id: "match-1" },
      error: null,
    });

    const state = await updateMatchResult(
      "tournament-1",
      "match-1",
      { ok: false, message: "" },
      formData({ homeScore: "4", awayScore: "2" }),
    );

    expect(state).toEqual<ActionState>({
      ok: true,
      message: "Resultado guardado.",
    });
    expect(updateMock).toHaveBeenCalledWith({
      home_score: 4,
      away_score: 2,
      home_penalty_score: null,
      away_penalty_score: null,
      status: "completed",
    });
    expect(eqMock).toHaveBeenCalledWith("id", "match-1");
    expect(eqMock).toHaveBeenCalledWith("tournament_id", "tournament-1");
  });

  it("reports when updating a match result did not touch any match", async () => {
    requireAdminMock.mockResolvedValue({
      id: "admin-1",
      email: "admin@vixen.test",
      role: "admin",
    });
    maybeSingleMock.mockResolvedValueOnce({
      data: {
        id: "missing-match",
        tournament_id: "tournament-1",
        category_id: "category-1",
        home_team_id: "team-home",
        away_team_id: "team-away",
        group_id: "group-1",
        next_match_id: null,
        result_locked_at: null,
        football_tournaments: { format: "league" },
      },
      error: null,
    });
    maybeSingleMock.mockResolvedValueOnce({ data: null, error: null });

    const state = await updateMatchResult(
      "tournament-1",
      "missing-match",
      { ok: false, message: "" },
      formData({ homeScore: "4", awayScore: "2" }),
    );

    expect(state).toEqual<ActionState>({
      ok: false,
      message: "No pudimos guardar el partido.",
    });
    expect(revalidatePathMock).not.toHaveBeenCalled();
  });

  it("lets an assigned viewer submit a final result once and lock it", async () => {
    requireViewerMock.mockResolvedValue({
      id: "viewer-1",
      email: "veedor@vixen.test",
      role: "viewer",
    });
    maybeSingleMock.mockResolvedValue({
      data: {
        id: "match-1",
        tournament_id: "tournament-1",
        category_id: "category-1",
        home_team_id: "team-home",
        away_team_id: "team-away",
        group_id: "group-1",
        next_match_id: null,
        result_locked_at: null,
        football_tournaments: { format: "league" },
      },
      error: null,
    });

    const state = await submitViewerMatchResult(
      "match-1",
      { ok: false, message: "" },
      formData({ homeScore: "2", awayScore: "0" }),
    );

    expect(state).toEqual<ActionState>({
      ok: true,
      message: "Resultado final cargado.",
    });
    expect(requireViewerMock).toHaveBeenCalledTimes(1);
    expect(selectMock).toHaveBeenCalledWith(
      "id, tournament_id, category_id, home_team_id, away_team_id, group_id, next_match_id, result_locked_at, football_tournaments(format)",
    );
    expect(eqMock).toHaveBeenCalledWith("id", "match-1");
    expect(eqMock).toHaveBeenCalledWith("assigned_viewer_id", "viewer-1");
    expect(updateMock).toHaveBeenCalledWith({
      home_score: 2,
      away_score: 0,
      home_penalty_score: null,
      away_penalty_score: null,
      status: "completed",
      result_locked_at: expect.any(String),
      result_submitted_by: "viewer-1",
    });
    expect(revalidatePathMock).toHaveBeenCalledWith("/veedor");
    expect(revalidatePathMock).toHaveBeenCalledWith("/futbol");
    expect(revalidatePathMock).toHaveBeenCalledWith(
      "/admin/torneos/tournament-1",
    );
  });

  it("prevents viewers from editing a locked result", async () => {
    requireViewerMock.mockResolvedValue({
      id: "viewer-1",
      email: "veedor@vixen.test",
      role: "viewer",
    });
    maybeSingleMock.mockResolvedValue({
      data: {
        id: "match-1",
        tournament_id: "tournament-1",
        result_locked_at: "2026-06-29T20:00:00Z",
      },
      error: null,
    });

    const state = await submitViewerMatchResult(
      "match-1",
      { ok: false, message: "" },
      formData({ homeScore: "3", awayScore: "1" }),
    );

    expect(state).toEqual<ActionState>({
      ok: false,
      message: "Este resultado ya fue cargado. Pedile a un administrador que lo corrija.",
    });
    expect(updateMock).not.toHaveBeenCalled();
  });
});
