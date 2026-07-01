"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";

import {
  getAdminMatches,
  getAdminTeams,
  requireAdmin,
  requireViewer,
} from "./data";
import { buildLeagueFixture } from "./fixture";
import { teamPhotoMaxBytes, teamPhotoMaxLabel } from "./limits";
import {
  fixtureGenerationSchema,
  matchFormSchema,
  matchResultFormSchema,
  matchViewerAssignmentSchema,
  teamFormSchema,
  tournamentFormSchema,
} from "./validation";

export type ActionState = {
  ok: boolean;
  message: string;
};

function slugify(value: string) {
  const slug = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || "torneo";
}

function deriveSeason(startsAt: string | null) {
  if (startsAt) return startsAt.slice(0, 4);

  return String(new Date().getFullYear());
}

function getTeamPhotoFile(formData: FormData) {
  const value = formData.get("teamPhoto");

  if (!(value instanceof File) || value.size === 0) return null;

  return value;
}

function getStoragePath(file: File) {
  const fallbackExtension = file.type.split("/")[1] || "bin";
  const extension = file.name.includes(".")
    ? file.name.split(".").pop()
    : fallbackExtension;
  const basename = file.name.replace(/\.[^.]+$/, "");

  return `teams/${crypto.randomUUID()}-${slugify(basename)}.${extension}`;
}

export async function loginAdmin(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return {
      ok: false,
      message: "Ingresá email y contraseña.",
    };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    return {
      ok: false,
      message: "No pudimos iniciar sesión. Revisá email y contraseña.",
    };
  }

  const { data: staffProfile } = await supabase
    .from("admin_profiles")
    .select("id, email, role, status")
    .eq("id", data.user.id)
    .eq("status", "active")
    .in("role", ["admin", "viewer"])
    .maybeSingle();

  if (!staffProfile) {
    await supabase.auth.signOut();

    return {
      ok: false,
      message: "Tu usuario no tiene permisos activos para este panel.",
    };
  }

  redirect(staffProfile.role === "viewer" ? "/veedor" : "/admin");
}

export async function logoutAdmin() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  await supabase.auth.signOut();
  redirect("/admin/login");
}

export async function pingAdminAccess(): Promise<ActionState> {
  await requireAdmin();
  revalidatePath("/admin");

  return {
    ok: true,
    message: "Acceso de administrador verificado.",
  };
}

function getTournamentPayload(formData: FormData) {
  const parsed = tournamentFormSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) return null;

  return {
    name: parsed.data.name,
    slug: slugify(parsed.data.name),
    season: deriveSeason(parsed.data.startsAt),
    category: parsed.data.category ?? "Libre",
    format: parsed.data.format,
    status: parsed.data.status,
    starts_at: parsed.data.startsAt,
    ends_at: parsed.data.endsAt,
    description: parsed.data.description,
  };
}

async function uploadTeamPhoto(
  formData: FormData,
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
) {
  const file = getTeamPhotoFile(formData);

  if (!file) return { photoUrl: null, error: null };

  if (file.size > teamPhotoMaxBytes) {
    return {
      photoUrl: null,
      error: new Error(`La imagen no puede superar ${teamPhotoMaxLabel}.`),
    };
  }

  const path = getStoragePath(file);
  const bucket = supabase.storage.from("team-photos");
  const { error } = await bucket.upload(path, file, {
    contentType: file.type || "application/octet-stream",
    upsert: true,
  });

  if (error) return { photoUrl: null, error };

  const {
    data: { publicUrl },
  } = bucket.getPublicUrl(path);

  return { photoUrl: publicUrl, error: null };
}

function getTeamPayload(formData: FormData, photoUrl: string | null) {
  const parsed = teamFormSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) return null;

  if (parsed.data.existingTeamId) {
    return {
      kind: "existing" as const,
      teamId: parsed.data.existingTeamId,
    };
  }

  return {
    kind: "new" as const,
    publicTeam: {
      name: parsed.data.name ?? "",
      short_name: parsed.data.shortName,
      photo_url: photoUrl,
    },
    adminDetails: {
      captain_name: parsed.data.captainName,
      contact_phone: parsed.data.contactPhone,
      notes: parsed.data.notes,
    },
  };
}

function getMatchPayload(formData: FormData) {
  const parsed = matchFormSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) return null;

  return {
    round_label: parsed.data.roundLabel,
    scheduled_at: parsed.data.scheduledAt,
    home_team_id: parsed.data.homeTeamId,
    away_team_id: parsed.data.awayTeamId,
    home_score: parsed.data.homeScore,
    away_score: parsed.data.awayScore,
    status: parsed.data.status,
  };
}

function getMatchResultPayload(formData: FormData) {
  const parsed = matchResultFormSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) return null;

  return {
    home_score: parsed.data.homeScore,
    away_score: parsed.data.awayScore,
    status: "completed" as const,
  };
}

function getViewerAssignmentPayload(formData: FormData) {
  const parsed = matchViewerAssignmentSchema.safeParse(
    Object.fromEntries(formData),
  );

  if (!parsed.success) return null;

  return {
    assigned_viewer_id: parsed.data.assignedViewerId,
  };
}

function getFixtureGenerationPayload(formData: FormData) {
  const parsed = fixtureGenerationSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) return null;

  return parsed.data;
}

export async function createTournament(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const payload = getTournamentPayload(formData);

  if (!payload) {
    return {
      ok: false,
      message: "Revisá los datos del torneo.",
    };
  }

  const supabase = await createSupabaseServerClient();
  const { data: tournament, error } = await supabase
    .from("football_tournaments")
    .insert(payload)
    .select("id")
    .single();

  if (error) {
    return {
      ok: false,
      message: error.message,
    };
  }

  if (!tournament?.id) {
    return {
      ok: false,
      message: "No pudimos crear el torneo.",
    };
  }

  revalidatePath("/admin/torneos");
  redirect(`/admin/torneos/${tournament.id}?tab=equipos&notice=tournament-created`);
}

export async function updateTournament(
  id: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const payload = getTournamentPayload(formData);

  if (!payload) {
    return {
      ok: false,
      message: "Revisá los datos del torneo.",
    };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("football_tournaments")
    .update(payload)
    .eq("id", id);

  if (error) {
    return {
      ok: false,
      message: error.message,
    };
  }

  revalidatePath("/admin/torneos");
  revalidatePath(`/admin/torneos/${id}`);
  revalidatePath("/futbol");

  return {
    ok: true,
    message: "Torneo guardado.",
  };
}

export async function deleteTournament(
  id: string,
  expectedName: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const confirmation = String(formData.get("confirmation") ?? "").trim();

  if (confirmation !== expectedName.trim()) {
    return {
      ok: false,
      message: `Escribí "${expectedName}" para borrar el torneo.`,
    };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("football_tournaments")
    .delete()
    .eq("id", id);

  if (error) {
    return {
      ok: false,
      message: error.message,
    };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/torneos");
  revalidatePath(`/admin/torneos/${id}`);
  revalidatePath("/futbol");
  redirect("/admin/torneos");
}

export async function createTeam(
  tournamentId: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const initialPayload = getTeamPayload(formData, null);

  if (!initialPayload) {
    return {
      ok: false,
      message: "Revisá los datos del equipo.",
    };
  }

  const supabase = await createSupabaseServerClient();

  if (initialPayload.kind === "existing") {
    const { error } = await supabase.from("football_tournament_teams").insert({
      tournament_id: tournamentId,
      team_id: initialPayload.teamId,
    });

    if (error) {
      return {
        ok: false,
        message: error.message,
      };
    }

    revalidatePath(`/admin/torneos/${tournamentId}`);
    revalidatePath("/futbol");

    return {
      ok: true,
      message: "Equipo agregado al torneo.",
    };
  }

  const { photoUrl, error: photoError } = await uploadTeamPhoto(
    formData,
    supabase,
  );

  if (photoError) {
    return {
      ok: false,
      message: photoError.message,
    };
  }

  const payload = getTeamPayload(formData, photoUrl);

  if (!payload || payload.kind !== "new") {
    return {
      ok: false,
      message: "Revisá los datos del equipo.",
    };
  }

  const { data: team, error: teamError } = await supabase
    .from("football_teams")
    .insert(payload.publicTeam)
    .select("id")
    .single();

  if (teamError) {
    return {
      ok: false,
      message: teamError.message,
    };
  }

  if (!team?.id) {
    return {
      ok: false,
      message: "No pudimos crear el equipo.",
    };
  }

  const { error: detailsError } = await supabase
    .from("football_team_admin_details")
    .insert({
      team_id: team.id,
      ...payload.adminDetails,
    });

  if (detailsError) {
    return {
      ok: false,
      message: detailsError.message,
    };
  }

  const { error: registrationError } = await supabase
    .from("football_tournament_teams")
    .insert({
      tournament_id: tournamentId,
      team_id: team.id,
    });

  if (registrationError) {
    return {
      ok: false,
      message: registrationError.message,
    };
  }

  revalidatePath(`/admin/torneos/${tournamentId}`);
  revalidatePath("/futbol");

  return {
    ok: true,
    message: "Equipo creado.",
  };
}

export async function createMatch(
  tournamentId: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const payload = getMatchPayload(formData);

  if (!payload) {
    return {
      ok: false,
      message: "Revisá los datos del partido.",
    };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("football_matches").insert({
    tournament_id: tournamentId,
    ...payload,
  });

  if (error) {
    return {
      ok: false,
      message: error.message,
    };
  }

  revalidatePath(`/admin/torneos/${tournamentId}`);
  revalidatePath("/futbol");

  return {
    ok: true,
    message: "Partido guardado.",
  };
}

export async function generateLeagueFixture(
  tournamentId: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const payload = getFixtureGenerationPayload(formData);

  if (!payload) {
    return {
      ok: false,
      message: "Revisá los datos del fixture.",
    };
  }

  const [teams, existingMatches] = await Promise.all([
    getAdminTeams(tournamentId),
    getAdminMatches(tournamentId),
  ]);

  if (teams.length < 2) {
    return {
      ok: false,
      message: "Necesitás al menos dos equipos para generar fixture.",
    };
  }

  if (existingMatches.length > 0) {
    return {
      ok: false,
      message: "Este torneo ya tiene partidos cargados.",
    };
  }

  const rounds = buildLeagueFixture(
    teams.map((team) => ({ id: team.id, name: team.name })),
    payload,
  );
  const matches = rounds.flatMap((round) =>
    round.matches.map((match) => ({
      tournament_id: tournamentId,
      round_label: match.roundLabel,
      scheduled_at: match.scheduledAt,
      home_team_id: match.homeTeamId,
      away_team_id: match.awayTeamId,
      home_score: null,
      away_score: null,
      status: "scheduled" as const,
    })),
  );

  if (matches.length === 0) {
    return {
      ok: false,
      message: "No pudimos armar partidos con estos equipos.",
    };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("football_matches").insert(matches);

  if (error) {
    return {
      ok: false,
      message: error.message,
    };
  }

  revalidatePath(`/admin/torneos/${tournamentId}`);
  revalidatePath("/futbol");

  return {
    ok: true,
    message: `Fixture generado con ${matches.length} partidos.`,
  };
}

export async function assignMatchViewer(
  tournamentId: string,
  matchId: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const payload = getViewerAssignmentPayload(formData);

  if (!payload) {
    return {
      ok: false,
      message: "Revisá el veedor asignado.",
    };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("football_matches")
    .update(payload)
    .eq("id", matchId)
    .eq("tournament_id", tournamentId);

  if (error) {
    return {
      ok: false,
      message: error.message,
    };
  }

  revalidatePath(`/admin/torneos/${tournamentId}`);
  revalidatePath("/veedor");

  return {
    ok: true,
    message: "Veedor asignado.",
  };
}

export async function updateMatchResult(
  tournamentId: string,
  matchId: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const payload = getMatchResultPayload(formData);

  if (!payload) {
    return {
      ok: false,
      message: "Revisá el resultado.",
    };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("football_matches")
    .update(payload)
    .eq("id", matchId)
    .eq("tournament_id", tournamentId);

  if (error) {
    return {
      ok: false,
      message: error.message,
    };
  }

  revalidatePath(`/admin/torneos/${tournamentId}`);
  revalidatePath("/veedor");
  revalidatePath("/futbol");

  return {
    ok: true,
    message: "Resultado guardado.",
  };
}

export async function submitViewerMatchResult(
  matchId: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const viewer = await requireViewer();
  const payload = getMatchResultPayload(formData);

  if (!payload) {
    return {
      ok: false,
      message: "Revisá el resultado.",
    };
  }

  const supabase = await createSupabaseServerClient();
  const { data: match, error: matchError } = await supabase
    .from("football_matches")
    .select("id, tournament_id, result_locked_at")
    .eq("id", matchId)
    .eq("assigned_viewer_id", viewer.id)
    .maybeSingle();

  if (matchError || !match) {
    return {
      ok: false,
      message: "No tenés permiso para cargar este partido.",
    };
  }

  if (match.result_locked_at) {
    return {
      ok: false,
      message:
        "Este resultado ya fue cargado. Pedile a un administrador que lo corrija.",
    };
  }

  const { error } = await supabase
    .from("football_matches")
    .update({
      ...payload,
      result_locked_at: new Date().toISOString(),
      result_submitted_by: viewer.id,
    })
    .eq("id", matchId)
    .eq("assigned_viewer_id", viewer.id);

  if (error) {
    return {
      ok: false,
      message: error.message,
    };
  }

  revalidatePath("/veedor");
  revalidatePath("/futbol");
  revalidatePath(`/admin/torneos/${match.tournament_id}`);

  return {
    ok: true,
    message: "Resultado final cargado.",
  };
}
