"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";

import {
  getAdminMatches,
  getAdminTeams,
  requireAdmin,
  requireViewer,
  type AuditAction,
  type AuditEntityType,
  type StaffProfile,
} from "./data";
import {
  buildGroupPlayoffFixture as buildGroupPlayoffFixtureModel,
  buildLeagueFixture,
} from "./fixture";
import { teamPhotoMaxBytes, teamPhotoMaxLabel } from "./limits";
import {
  fixtureGenerationSchema,
  matchFormSchema,
  matchResultFormSchema,
  matchViewerAssignmentSchema,
  rosterEntryCreateSchema,
  rosterEntryUpdateSchema,
  teamFormSchema,
  tournamentCategoryCreateSchema,
  tournamentCategoryUpdateSchema,
  tournamentFormSchema,
} from "./validation";

export type ActionState = {
  ok: boolean;
  message: string;
};

type SupabaseServerClient = Awaited<
  ReturnType<typeof createSupabaseServerClient>
>;

type AuditActor = Pick<StaffProfile, "id" | "email">;

type BracketFixtureNode = {
  id: string;
  depth: number;
  roundLabel: string;
  homeTeamId: string | null;
  awayTeamId: string | null;
  nextMatchId: string | null;
};

type BracketFixturePayload = {
  initialMatches: BracketFixtureNode[];
  startsAt: string | null;
  daysBetweenRounds: number;
};

type MatchResultEventInput = {
  rosterEntryId: string;
  goals: number;
  yellowCards: number;
  redCards: number;
};

type MatchResultMatchContext = {
  id: string;
  tournament_id: string;
  category_id: string;
  home_team_id: string | null;
  away_team_id: string | null;
  group_id: string | null;
  next_match_id: string | null;
  result_locked_at?: string | null;
  football_tournaments:
    | {
        format: string;
      }
    | {
        format: string;
      }[]
    | null;
};

type MatchEventInsertRow = {
  match_id: string;
  tournament_id: string;
  category_id: string;
  team_id: string;
  roster_entry_id: string;
  player_id: string;
  event_type: "goal" | "yellow_card" | "red_card";
  quantity: number;
};

type MatchEventRowsResult =
  | {
      rows: MatchEventInsertRow[];
      error?: never;
    }
  | {
      rows?: never;
      error: string;
    };

async function recordAuditEvent(
  supabase: SupabaseServerClient,
  {
    tournamentId,
    actor,
    entityType,
    entityId,
    action,
    summary,
    metadata = {},
  }: {
    tournamentId: string;
    actor: AuditActor;
    entityType: AuditEntityType;
    entityId: string;
    action: AuditAction;
    summary: string;
    metadata?: Record<string, unknown>;
  },
) {
  const result = await supabase.from("football_audit_events").insert({
    tournament_id: tournamentId,
    actor_profile_id: actor.id,
    actor_email: actor.email,
    entity_type: entityType,
    entity_id: entityId,
    action,
    summary,
    metadata,
  });

  if (result?.error) {
    console.error("Failed to record football audit event.", {
      tournamentId,
      actorId: actor.id,
      entityType,
      entityId,
      action,
      error: result.error,
    });
  }
}

function isNullableString(value: unknown): value is string | null {
  return typeof value === "string" || value === null;
}

function isBracketFixtureNode(value: unknown): value is BracketFixtureNode {
  if (!value || typeof value !== "object") return false;

  const node = value as Record<string, unknown>;

  return (
    typeof node.id === "string" &&
    typeof node.roundLabel === "string" &&
    typeof node.depth === "number" &&
    isNullableString(node.homeTeamId) &&
    isNullableString(node.awayTeamId) &&
    isNullableString(node.nextMatchId)
  );
}

function parseBracketFixturePayload(value: unknown): BracketFixturePayload | null {
  if (!value || typeof value !== "object") return null;

  const payload = value as Record<string, unknown>;
  if (!Array.isArray(payload.initialMatches)) return null;
  if (!payload.initialMatches.every(isBracketFixtureNode)) return null;

  const startsAt = typeof payload.startsAt === "string" && payload.startsAt
    ? payload.startsAt
    : null;
  const rawDaysBetweenRounds = Number(payload.daysBetweenRounds ?? 7);

  return {
    initialMatches: payload.initialMatches,
    startsAt,
    daysBetweenRounds: Number.isFinite(rawDaysBetweenRounds)
      ? rawDaysBetweenRounds
      : 7,
  };
}

function addDays(date: Date, days: number) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

function getFootballMatchesInsertErrorMessage(message: string) {
  if (
    message.includes("next_match_id") &&
    message.includes("football_matches") &&
    message.includes("schema cache")
  ) {
    return "Falta aplicar la migración de llaves de copa en Supabase. Ejecutá la migración 20260701020000_update_football_matches_for_brackets.sql y recargá el schema cache.";
  }

  return message;
}

function getTeamRegistrationErrorMessage(message: string) {
  if (message.includes("football_tournament_teams_tournament_team_key")) {
    return "Este equipo ya está anotado en otra categoría del mismo torneo.";
  }

  return message;
}

function readPositiveInt(formData: FormData, name: string, fallback: number) {
  const value = Number(formData.get(name) ?? fallback);

  if (!Number.isInteger(value) || value < 1) return fallback;

  return value;
}

function readOptionalEventCount(formData: FormData, name: string, max: number) {
  const rawValue = String(formData.get(name) ?? "").trim();
  if (!rawValue) return 0;

  const value = Number(rawValue);
  if (!Number.isInteger(value) || value < 0 || value > max) return null;

  return value;
}

function getMatchResultEventsPayload(formData: FormData) {
  const rosterEntryIds = new Set<string>();

  for (const key of formData.keys()) {
    const [field, rosterEntryId] = key.split(":");
    if (
      rosterEntryId &&
      (field === "goals" || field === "yellowCards" || field === "redCards")
    ) {
      rosterEntryIds.add(rosterEntryId);
    }
  }

  const events: MatchResultEventInput[] = [];

  for (const rosterEntryId of rosterEntryIds) {
    const goals = readOptionalEventCount(formData, `goals:${rosterEntryId}`, 50);
    const yellowCards = readOptionalEventCount(
      formData,
      `yellowCards:${rosterEntryId}`,
      2,
    );
    const redCards = readOptionalEventCount(
      formData,
      `redCards:${rosterEntryId}`,
      1,
    );

    if (goals === null || yellowCards === null || redCards === null) {
      return null;
    }

    if (goals > 0 || yellowCards > 0 || redCards > 0) {
      events.push({ rosterEntryId, goals, yellowCards, redCards });
    }
  }

  return events;
}

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

function resolveCategoryActionArgs(
  categoryOrState: string | ActionState,
  stateOrFormData: ActionState | FormData,
  maybeFormData?: FormData,
) {
  if (typeof categoryOrState === "string") {
    return {
      categoryId: categoryOrState,
      formData: maybeFormData,
    };
  }

  return {
    categoryId: "",
    formData: stateOrFormData instanceof FormData ? stateOrFormData : undefined,
  };
}

function withCategoryId(categoryId: string) {
  return categoryId ? { category_id: categoryId } : {};
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

function getTeamEditPayload(formData: FormData, photoUrl: string | null) {
  const parsed = teamFormSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success || !parsed.data.name || parsed.data.name.length < 2) {
    return null;
  }

  return {
    publicTeam: {
      name: parsed.data.name,
      short_name: parsed.data.shortName,
      ...(photoUrl ? { photo_url: photoUrl } : {}),
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
  const events = getMatchResultEventsPayload(formData);

  if (!parsed.success || events === null) return null;

  return {
    result: {
      home_score: parsed.data.homeScore,
      away_score: parsed.data.awayScore,
      home_penalty_score: parsed.data.homePenaltyScore,
      away_penalty_score: parsed.data.awayPenaltyScore,
      status: "completed" as const,
    },
    events,
  };
}

function firstRelatedFormat(
  tournament:
    | MatchResultMatchContext["football_tournaments"]
    | undefined,
) {
  if (Array.isArray(tournament)) return tournament[0]?.format ?? "league";

  return tournament?.format ?? "league";
}

function isKnockoutResultMatch(match: MatchResultMatchContext) {
  const format = firstRelatedFormat(match.football_tournaments);

  if (format === "cup") return true;
  if (format === "league_playoff") return match.group_id === null;

  return false;
}

function validatePenaltyResult(
  payload: ReturnType<typeof getMatchResultPayload>,
  match: MatchResultMatchContext,
): ActionState | null {
  if (!payload) {
    return { ok: false, message: "Revisá el resultado." };
  }

  const { result } = payload;
  const hasPenaltyScore =
    result.home_penalty_score !== null || result.away_penalty_score !== null;
  const isDraw = result.home_score === result.away_score;
  const isKnockout = isKnockoutResultMatch(match);

  if (!isKnockout && hasPenaltyScore) {
    return {
      ok: false,
      message: "Los penales solo aplican en copa o playoff.",
    };
  }

  if (!isDraw && hasPenaltyScore) {
    return {
      ok: false,
      message: "Solo cargá penales si el partido terminó empatado.",
    };
  }

  if (isKnockout && isDraw) {
    if (
      result.home_penalty_score === null ||
      result.away_penalty_score === null
    ) {
      return {
        ok: false,
        message: "En copa o playoff, un empate necesita resultado por penales.",
      };
    }

    if (result.home_penalty_score === result.away_penalty_score) {
      return {
        ok: false,
        message: "Los penales tienen que definir un ganador.",
      };
    }
  }

  return null;
}

async function buildMatchEventRows(
  supabase: SupabaseServerClient,
  payload: NonNullable<ReturnType<typeof getMatchResultPayload>>,
  match: MatchResultMatchContext,
): Promise<MatchEventRowsResult> {
  if (payload.events.length === 0) {
    return { rows: [] as MatchEventInsertRow[] };
  }

  if (!match.home_team_id || !match.away_team_id) {
    return { error: "El partido necesita ambos equipos para cargar eventos." };
  }

  const rosterEntryIds = payload.events.map((event) => event.rosterEntryId);
  const { data, error } = await supabase
    .from("football_roster_entries")
    .select("id, tournament_id, category_id, team_id, player_id")
    .eq("category_id", match.category_id)
    .in("id", rosterEntryIds);

  if (error) {
    return { error: error.message };
  }

  const rosterRows = new Map(
    ((data ?? []) as Array<{
      id: string;
      tournament_id: string;
      category_id: string;
      team_id: string;
      player_id: string;
    }>).map((row) => [row.id, row]),
  );
  const rows: MatchEventInsertRow[] = [];
  let attributedHomeGoals = 0;
  let attributedAwayGoals = 0;

  for (const event of payload.events) {
    const rosterEntry = rosterRows.get(event.rosterEntryId);

    if (!rosterEntry) {
      return { error: "Uno de los jugadores no pertenece a este partido." };
    }

    if (
      rosterEntry.team_id !== match.home_team_id &&
      rosterEntry.team_id !== match.away_team_id
    ) {
      return { error: "Uno de los jugadores no pertenece a este partido." };
    }

    const baseRow = {
      match_id: match.id,
      tournament_id: match.tournament_id,
      category_id: match.category_id,
      team_id: rosterEntry.team_id,
      roster_entry_id: rosterEntry.id,
      player_id: rosterEntry.player_id,
    };

    if (event.goals > 0) {
      if (rosterEntry.team_id === match.home_team_id) {
        attributedHomeGoals += event.goals;
      } else {
        attributedAwayGoals += event.goals;
      }

      rows.push({
        ...baseRow,
        event_type: "goal",
        quantity: event.goals,
      });
    }

    if (event.yellowCards > 0) {
      rows.push({
        ...baseRow,
        event_type: "yellow_card",
        quantity: event.yellowCards,
      });
    }

    if (event.redCards > 0) {
      rows.push({
        ...baseRow,
        event_type: "red_card",
        quantity: event.redCards,
      });
    }
  }

  if (attributedHomeGoals > payload.result.home_score) {
    return {
      error: "Los goles asignados al local superan el resultado cargado.",
    };
  }

  if (attributedAwayGoals > payload.result.away_score) {
    return {
      error: "Los goles asignados al visitante superan el resultado cargado.",
    };
  }

  return { rows };
}

async function replaceMatchEvents(
  supabase: SupabaseServerClient,
  matchId: string,
  rows: MatchEventInsertRow[],
) {
  const { error: deleteError } = await supabase
    .from("football_match_events")
    .delete()
    .eq("match_id", matchId);

  if (deleteError) return deleteError.message;

  if (rows.length === 0) return null;

  const { error: insertError } = await supabase
    .from("football_match_events")
    .insert(rows);

  return insertError?.message ?? null;
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

function getRosterEntryBasePayload(
  data: {
    shirtNumber: number | null;
    status: "active" | "inactive" | "suspended";
    medicalStatus: "pending" | "approved" | "expired";
    insuranceStatus: "pending" | "approved" | "expired";
    rosterNotes: string | null;
  },
) {
  return {
    shirt_number: data.shirtNumber,
    status: data.status,
    medical_status: data.medicalStatus,
    insurance_status: data.insuranceStatus,
    notes: data.rosterNotes,
  };
}

function getRosterEntryCreatePayload(formData: FormData) {
  const parsed = rosterEntryCreateSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) return null;

  const roster = getRosterEntryBasePayload(parsed.data);

  if (parsed.data.mode === "existing") {
    return {
      mode: "existing" as const,
      playerId: parsed.data.playerId,
      roster,
    };
  }

  return {
    mode: "new" as const,
    player: {
      first_name: parsed.data.firstName,
      last_name: parsed.data.lastName,
      public_name: parsed.data.publicName,
      document_number: parsed.data.documentNumber,
      birth_date: parsed.data.birthDate,
      phone: parsed.data.phone,
      notes: parsed.data.playerNotes,
    },
    roster,
  };
}

function getRosterEntryUpdatePayload(formData: FormData) {
  const parsed = rosterEntryUpdateSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) return null;

  return getRosterEntryBasePayload(parsed.data);
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
  const admin = await requireAdmin();

  const payload = getTournamentPayload(formData);

  if (!payload) {
    return {
      ok: false,
      message: "Revisá los datos del torneo.",
    };
  }

  const supabase = await createSupabaseServerClient();
  const { data: updatedTournament, error } = await supabase
    .from("football_tournaments")
    .update(payload)
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error) {
    return {
      ok: false,
      message: error.message,
    };
  }

  if (!updatedTournament?.id) {
    return {
      ok: false,
      message: "No pudimos guardar el torneo.",
    };
  }

  await recordAuditEvent(supabase, {
    tournamentId: id,
    actor: admin,
    entityType: "tournament",
    entityId: id,
    action: "updated",
    summary: "Actualizó datos del torneo",
    metadata: {
      changedFields: Object.keys(payload),
    },
  });

  revalidatePath("/admin/torneos");
  revalidatePath(`/admin/torneos/${id}`);
  revalidatePath(`/admin/usuarios/${admin.id}`);
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

export async function createTournamentCategory(
  tournamentId: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const parsed = tournamentCategoryCreateSchema.safeParse(
    Object.fromEntries(formData),
  );

  if (!parsed.success) {
    return { ok: false, message: "Datos inválidos." };
  }

  const supabase = await createSupabaseServerClient();
  const { count, error: countError } = await supabase
    .from("football_tournament_categories")
    .select("id", { count: "exact", head: true })
    .eq("tournament_id", tournamentId);

  if (countError) {
    return { ok: false, message: "Error al crear la categoría." };
  }

  const { error } = await supabase.from("football_tournament_categories").insert({
    tournament_id: tournamentId,
    name: parsed.data.name,
    slug: slugify(parsed.data.name),
    status: parsed.data.status,
    position: count ?? 0,
    starts_at: parsed.data.startsAt,
    ends_at: parsed.data.endsAt,
  });

  if (error) {
    return { ok: false, message: "Error al crear la categoría." };
  }

  revalidatePath(`/admin/torneos/${tournamentId}`);
  revalidatePath("/futbol");
  revalidatePath("/futbol/torneos");

  return { ok: true, message: "Categoría creada con éxito." };
}

export async function updateTournamentCategory(
  tournamentId: string,
  categoryId: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const parsed = tournamentCategoryUpdateSchema.safeParse(
    Object.fromEntries(formData),
  );

  if (!parsed.success) {
    return { ok: false, message: "Datos inválidos." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("football_tournament_categories")
    .update({
      name: parsed.data.name,
      slug: slugify(parsed.data.name),
      status: parsed.data.status,
      starts_at: parsed.data.startsAt,
      ends_at: parsed.data.endsAt,
    })
    .eq("id", categoryId);

  if (error) {
    return { ok: false, message: "Error al actualizar la categoría." };
  }

  revalidatePath(`/admin/torneos/${tournamentId}`);
  revalidatePath("/futbol");
  revalidatePath("/futbol/torneos");

  return { ok: true, message: "Categoría actualizada con éxito." };
}

export async function deleteTournamentCategory(
  tournamentId: string,
  categoryId: string,
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const confirmation = formData.get("confirmation");
  const categoryName = formData.get("categoryName");

  if (confirmation !== categoryName) {
    return { ok: false, message: "El nombre no coincide." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("football_tournament_categories")
    .delete()
    .eq("id", categoryId);

  if (error) {
    return { ok: false, message: "Error al eliminar la categoría." };
  }

  revalidatePath(`/admin/torneos/${tournamentId}`);
  revalidatePath("/futbol");
  revalidatePath("/futbol/torneos");

  return { ok: true, message: "Categoría eliminada con éxito." };
}

export async function createTeam(
  tournamentId: string,
  categoryOrState: string | ActionState,
  stateOrFormData: ActionState | FormData,
  maybeFormData?: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const { categoryId, formData } = resolveCategoryActionArgs(
    categoryOrState,
    stateOrFormData,
    maybeFormData,
  );

  if (!formData) {
    return {
      ok: false,
      message: "Revisá los datos del equipo.",
    };
  }

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
      ...withCategoryId(categoryId),
      team_id: initialPayload.teamId,
    });

    if (error) {
      return {
        ok: false,
        message: getTeamRegistrationErrorMessage(error.message),
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
      ...withCategoryId(categoryId),
      team_id: team.id,
    });

  if (registrationError) {
    return {
      ok: false,
      message: getTeamRegistrationErrorMessage(registrationError.message),
    };
  }

  revalidatePath(`/admin/torneos/${tournamentId}`);
  revalidatePath("/futbol");

  return {
    ok: true,
    message: "Equipo creado.",
  };
}

export async function updateTeam(
  tournamentId: string,
  teamId: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const admin = await requireAdmin();

  const supabase = await createSupabaseServerClient();
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

  const payload = getTeamEditPayload(formData, photoUrl);

  if (!payload) {
    return {
      ok: false,
      message: "Revisá los datos del equipo.",
    };
  }

  const { data: updatedTeam, error: teamError } = await supabase
    .from("football_teams")
    .update(payload.publicTeam)
    .eq("id", teamId)
    .select("id")
    .maybeSingle();

  if (teamError) {
    return {
      ok: false,
      message: teamError.message,
    };
  }

  if (!updatedTeam?.id) {
    return {
      ok: false,
      message: "No pudimos guardar el equipo.",
    };
  }

  const { data: updatedDetails, error: detailsError } = await supabase
    .from("football_team_admin_details")
    .update(payload.adminDetails)
    .eq("team_id", teamId)
    .select("team_id")
    .maybeSingle();

  if (detailsError) {
    return {
      ok: false,
      message: detailsError.message,
    };
  }

  if (!updatedDetails?.team_id) {
    return {
      ok: false,
      message: "No pudimos guardar los datos privados del equipo.",
    };
  }

  await recordAuditEvent(supabase, {
    tournamentId,
    actor: admin,
    entityType: "team",
    entityId: teamId,
    action: "updated",
    summary: "Actualizó datos de un equipo",
    metadata: {
      changedFields: [
        ...Object.keys(payload.publicTeam),
        ...Object.keys(payload.adminDetails),
      ],
    },
  });

  revalidatePath(`/admin/torneos/${tournamentId}`);
  revalidatePath(`/admin/usuarios/${admin.id}`);
  revalidatePath("/futbol");

  return {
    ok: true,
    message: "Equipo guardado.",
  };
}

export async function removeTeamFromTournament(
  tournamentId: string,
  categoryOrTeamId: string,
  teamIdOrState?: string | ActionState,
  _prevState?: ActionState | FormData,
  _formData?: FormData,
): Promise<ActionState> {
  void _prevState;
  void _formData;

  const admin = await requireAdmin();
  const hasCategoryArg = typeof teamIdOrState === "string";
  const categoryId = hasCategoryArg ? categoryOrTeamId : "";
  const teamId = hasCategoryArg ? teamIdOrState : categoryOrTeamId;

  const matches = await getAdminMatches(tournamentId, categoryId || undefined);
  const hasTournamentMatch = matches.some(
    (match) => match.homeTeamId === teamId || match.awayTeamId === teamId,
  );

  if (hasTournamentMatch) {
    return {
      ok: false,
      message:
        "No podés quitar un equipo que ya tiene partidos en este torneo.",
    };
  }

  const supabase = await createSupabaseServerClient();
  let deleteQuery = supabase
    .from("football_tournament_teams")
    .delete()
    .eq("tournament_id", tournamentId)
    .eq("team_id", teamId);

  if (categoryId) {
    deleteQuery = deleteQuery.eq("category_id", categoryId);
  }

  const { data: removedTeam, error } = await deleteQuery
    .select("team_id")
    .maybeSingle();

  if (error) {
    return {
      ok: false,
      message: error.message,
    };
  }

  if (!removedTeam?.team_id) {
    return {
      ok: false,
      message: "No pudimos quitar el equipo del torneo.",
    };
  }

  await recordAuditEvent(supabase, {
    tournamentId,
    actor: admin,
    entityType: "team",
    entityId: teamId,
    action: "removed_from_tournament",
    summary: "Quitó un equipo del torneo",
    metadata: {},
  });

  revalidatePath(`/admin/torneos/${tournamentId}`);
  revalidatePath(`/admin/usuarios/${admin.id}`);
  revalidatePath("/futbol");

  return {
    ok: true,
    message: "Equipo quitado del torneo.",
  };
}

export async function createRosterEntry(
  tournamentId: string,
  categoryOrTeamId: string,
  teamIdOrState: string | ActionState,
  stateOrFormData: ActionState | FormData,
  maybeFormData?: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const hasCategoryArg = typeof teamIdOrState === "string";
  const categoryId = hasCategoryArg ? categoryOrTeamId : "";
  const teamId = hasCategoryArg ? teamIdOrState : categoryOrTeamId;
  const formData = hasCategoryArg
    ? maybeFormData
    : stateOrFormData instanceof FormData
      ? stateOrFormData
      : undefined;

  if (!formData) {
    return {
      ok: false,
      message: "Revisá los datos del jugador.",
    };
  }

  const payload = getRosterEntryCreatePayload(formData);

  if (!payload) {
    return {
      ok: false,
      message: "Revisá los datos del jugador.",
    };
  }

  const supabase = await createSupabaseServerClient();
  let playerId = payload.mode === "existing" ? payload.playerId : null;

  if (payload.mode === "new") {
    const { data: player, error: playerError } = await supabase
      .from("football_players")
      .insert(payload.player)
      .select("id")
      .single();

    if (playerError) {
      return {
        ok: false,
        message: playerError.message,
      };
    }

    if (!player?.id) {
      return {
        ok: false,
        message: "No pudimos crear el jugador.",
      };
    }

    playerId = player.id;
  }

  const { data: rosterEntry, error: rosterError } = await supabase
    .from("football_roster_entries")
    .insert({
      tournament_id: tournamentId,
      ...withCategoryId(categoryId),
      team_id: teamId,
      player_id: playerId,
      ...payload.roster,
    })
    .select("id")
    .single();

  if (rosterError) {
    return {
      ok: false,
      message: rosterError.message,
    };
  }

  if (!rosterEntry?.id) {
    return {
      ok: false,
      message: "No pudimos agregar el jugador al plantel.",
    };
  }

  revalidatePath(`/admin/torneos/${tournamentId}`);

  return {
    ok: true,
    message: "Jugador agregado al plantel.",
  };
}

export async function updateRosterEntry(
  tournamentId: string,
  rosterEntryId: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const payload = getRosterEntryUpdatePayload(formData);

  if (!payload) {
    return {
      ok: false,
      message: "Revisá los datos del jugador.",
    };
  }

  const supabase = await createSupabaseServerClient();
  const { data: rosterEntry, error } = await supabase
    .from("football_roster_entries")
    .update(payload)
    .eq("id", rosterEntryId)
    .eq("tournament_id", tournamentId)
    .select("id")
    .maybeSingle();

  if (error) {
    return {
      ok: false,
      message: error.message,
    };
  }

  if (!rosterEntry?.id) {
    return {
      ok: false,
      message: "No pudimos guardar el jugador del plantel.",
    };
  }

  revalidatePath(`/admin/torneos/${tournamentId}`);

  return {
    ok: true,
    message: "Jugador del plantel guardado.",
  };
}

export async function deleteRosterEntry(
  tournamentId: string,
  rosterEntryId: string,
  _prevState?: ActionState,
  _formData?: FormData,
): Promise<ActionState> {
  void _prevState;
  void _formData;

  await requireAdmin();

  const supabase = await createSupabaseServerClient();
  const { data: rosterEntry, error } = await supabase
    .from("football_roster_entries")
    .delete()
    .eq("id", rosterEntryId)
    .eq("tournament_id", tournamentId)
    .select("id")
    .maybeSingle();

  if (error) {
    return {
      ok: false,
      message: error.message,
    };
  }

  if (!rosterEntry?.id) {
    return {
      ok: false,
      message: "No pudimos quitar el jugador del plantel.",
    };
  }

  revalidatePath(`/admin/torneos/${tournamentId}`);

  return {
    ok: true,
    message: "Jugador quitado del plantel.",
  };
}

export async function createMatch(
  tournamentId: string,
  categoryOrState: string | ActionState,
  stateOrFormData: ActionState | FormData,
  maybeFormData?: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const { categoryId, formData } = resolveCategoryActionArgs(
    categoryOrState,
    stateOrFormData,
    maybeFormData,
  );

  if (!formData) {
    return {
      ok: false,
      message: "Revisá los datos del partido.",
    };
  }

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
    ...withCategoryId(categoryId),
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

export async function updateMatch(
  tournamentId: string,
  matchId: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const admin = await requireAdmin();

  const payload = getMatchPayload(formData);

  if (!payload) {
    return {
      ok: false,
      message: "Revisá los datos del partido.",
    };
  }

  const supabase = await createSupabaseServerClient();
  const { data: updatedMatch, error } = await supabase
    .from("football_matches")
    .update(payload)
    .eq("id", matchId)
    .eq("tournament_id", tournamentId)
    .select("id")
    .maybeSingle();

  if (error) {
    return {
      ok: false,
      message: error.message,
    };
  }

  if (!updatedMatch?.id) {
    return {
      ok: false,
      message: "No pudimos guardar el partido.",
    };
  }

  await recordAuditEvent(supabase, {
    tournamentId,
    actor: admin,
    entityType: "match",
    entityId: matchId,
    action: "updated",
    summary: `Actualizó partido ${payload.round_label}`,
    metadata: {
      changedFields: Object.keys(payload),
    },
  });

  revalidatePath(`/admin/torneos/${tournamentId}`);
  revalidatePath(`/admin/usuarios/${admin.id}`);
  revalidatePath("/veedor");
  revalidatePath("/futbol");

  return {
    ok: true,
    message: "Partido guardado.",
  };
}

export async function deleteMatch(
  tournamentId: string,
  matchId: string,
  _prevState?: ActionState,
  _formData?: FormData,
): Promise<ActionState> {
  void _prevState;
  void _formData;

  const admin = await requireAdmin();

  const supabase = await createSupabaseServerClient();
  const { data: deletedMatch, error } = await supabase
    .from("football_matches")
    .delete()
    .eq("id", matchId)
    .eq("tournament_id", tournamentId)
    .select("id")
    .maybeSingle();

  if (error) {
    return {
      ok: false,
      message: error.message,
    };
  }

  if (!deletedMatch?.id) {
    return {
      ok: false,
      message: "No pudimos eliminar el partido.",
    };
  }

  await recordAuditEvent(supabase, {
    tournamentId,
    actor: admin,
    entityType: "match",
    entityId: matchId,
    action: "deleted",
    summary: "Eliminó un partido",
    metadata: {},
  });

  revalidatePath(`/admin/torneos/${tournamentId}`);
  revalidatePath(`/admin/usuarios/${admin.id}`);
  revalidatePath("/veedor");
  revalidatePath("/futbol");

  return {
    ok: true,
    message: "Partido eliminado.",
  };
}

export async function generateBracketFixture(
  tournamentId: string,
  categoryOrState: string | ActionState,
  stateOrFormData: ActionState | FormData,
  maybeFormData?: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const { categoryId, formData } = resolveCategoryActionArgs(
    categoryOrState,
    stateOrFormData,
    maybeFormData,
  );

  if (!formData) {
    return { ok: false, message: "Datos de llave inválidos." };
  }

  const bracketDataRaw = formData.get("bracketData");
  if (!bracketDataRaw || typeof bracketDataRaw !== "string") {
    return { ok: false, message: "Datos de llave inválidos." };
  }

  let parsedBracket: BracketFixturePayload | null;
  try {
    parsedBracket = parseBracketFixturePayload(JSON.parse(bracketDataRaw));
  } catch {
    return { ok: false, message: "Error leyendo datos de la llave." };
  }

  if (!parsedBracket || parsedBracket.initialMatches.length === 0) {
    return { ok: false, message: "No hay cruces configurados." };
  }

  const { initialMatches, startsAt, daysBetweenRounds } = parsedBracket;
  const existingMatches = await getAdminMatches(
    tournamentId,
    categoryId || undefined,
  );

  if (existingMatches.length > 0) {
    return { ok: false, message: "Este torneo ya tiene partidos cargados." };
  }

  try {
    const maxDepth = Math.max(...initialMatches.map((node) => node.depth));
    const matchIds = new Map(
      initialMatches.map((node) => [node.id, crypto.randomUUID()]),
    );

    const matches = initialMatches.map((node) => {
      const depthFromStart = maxDepth - node.depth;
      const nextMatchDate = startsAt
        ? addDays(new Date(startsAt), depthFromStart * daysBetweenRounds)
        : null;
      const matchId = matchIds.get(node.id);
      const nextMatchId = node.nextMatchId
        ? (matchIds.get(node.nextMatchId) ?? null)
        : null;

      if (!matchId || (node.nextMatchId && !nextMatchId)) {
        throw new Error("Datos de llave inválidos.");
      }

      return {
        id: matchId,
        tournament_id: tournamentId,
        ...withCategoryId(categoryId),
        round_label: node.roundLabel,
        scheduled_at: nextMatchDate
          ? `${nextMatchDate.toISOString().split("T")[0]}T10:00:00-03:00`
          : null,
        home_team_id: node.homeTeamId,
        away_team_id: node.awayTeamId,
        next_match_id: nextMatchId,
        home_score: null,
        away_score: null,
        status: "scheduled" as const,
      };
    });

    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.from("football_matches").insert(matches);

    if (error) {
      return {
        ok: false,
        message: getFootballMatchesInsertErrorMessage(error.message),
      };
    }

    revalidatePath(`/admin/torneos/${tournamentId}`);
    revalidatePath("/futbol");

    return {
      ok: true,
      message: `Llave generada con ${matches.length} partidos.`,
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Error armando llave.",
    };
  }
}

export async function generateGroupPlayoffFixture(
  tournamentId: string,
  categoryOrState: string | ActionState,
  stateOrFormData: ActionState | FormData,
  maybeFormData?: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const { categoryId, formData } = resolveCategoryActionArgs(
    categoryOrState,
    stateOrFormData,
    maybeFormData,
  );

  if (!formData) {
    return {
      ok: false,
      message: "No pudimos armar zonas + playoff.",
    };
  }

  const options = {
    groupCount: readPositiveInt(formData, "groupCount", 2),
    qualifiersPerGroup: readPositiveInt(formData, "qualifiersPerGroup", 1),
    startsAt: String(formData.get("startsAt") ?? "") || null,
    kickoffTime: String(formData.get("kickoffTime") ?? "") || null,
    daysBetweenGroupRounds: readPositiveInt(
      formData,
      "daysBetweenGroupRounds",
      7,
    ),
    daysBetweenPlayoffRounds: readPositiveInt(
      formData,
      "daysBetweenPlayoffRounds",
      7,
    ),
  };

  const [teams, existingMatches] = await Promise.all([
    getAdminTeams(tournamentId, categoryId || undefined),
    getAdminMatches(tournamentId, categoryId || undefined),
  ]);

  if (existingMatches.length > 0) {
    return {
      ok: false,
      message: "Este torneo ya tiene partidos cargados.",
    };
  }

  let fixture;
  try {
    fixture = buildGroupPlayoffFixtureModel(
      teams.map((team) => ({ id: team.id, name: team.name })),
      options,
    );
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "No pudimos armar zonas + playoff.",
    };
  }

  const groupIds = new Map(
    fixture.groups.map((group) => [group.id, crypto.randomUUID()]),
  );
  const groups = fixture.groups.map((group) => ({
    id: groupIds.get(group.id),
    tournament_id: tournamentId,
    ...withCategoryId(categoryId),
    name: group.name,
    position: group.position,
  }));
  const groupTeams = fixture.groups.flatMap((group) => {
    const groupId = groupIds.get(group.id);

    return group.teams.map((team) => ({
      group_id: groupId,
      ...withCategoryId(categoryId),
      team_id: team.id,
      seed: team.seed,
    }));
  });
  const groupMatches = fixture.groupRounds.flatMap((round) =>
    round.matches.map((match) => ({
      tournament_id: tournamentId,
      ...withCategoryId(categoryId),
      round_label: match.roundLabel,
      scheduled_at: match.scheduledAt,
      home_team_id: match.homeTeamId,
      away_team_id: match.awayTeamId,
      group_id: groupIds.get(match.groupId) ?? null,
      next_match_id: null,
      home_score: null,
      away_score: null,
      status: "scheduled" as const,
    })),
  );
  const playoffMatches = fixture.playoffMatches.map((match) => ({
    id: match.id,
    tournament_id: tournamentId,
    ...withCategoryId(categoryId),
    round_label: match.roundLabel,
    scheduled_at: match.scheduledAt,
    home_team_id: match.homeTeamId,
    away_team_id: match.awayTeamId,
    group_id: null,
    next_match_id: match.nextMatchId,
    home_score: null,
    away_score: null,
    status: "scheduled" as const,
  }));
  const matches = [...groupMatches, ...playoffMatches];

  const supabase = await createSupabaseServerClient();
  const { error: groupsError } = await supabase
    .from("football_tournament_groups")
    .insert(groups);

  if (groupsError) {
    return { ok: false, message: groupsError.message };
  }

  const { error: groupTeamsError } = await supabase
    .from("football_tournament_group_teams")
    .insert(groupTeams);

  if (groupTeamsError) {
    return { ok: false, message: groupTeamsError.message };
  }

  const { error: matchesError } = await supabase
    .from("football_matches")
    .insert(matches);

  if (matchesError) {
    return {
      ok: false,
      message: getFootballMatchesInsertErrorMessage(matchesError.message),
    };
  }

  revalidatePath(`/admin/torneos/${tournamentId}`);
  revalidatePath("/futbol");

  return {
    ok: true,
    message: `Fixture zonas + playoff generado con ${matches.length} partidos.`,
  };
}

export async function generateLeagueFixture(
  tournamentId: string,
  categoryOrState: string | ActionState,
  stateOrFormData: ActionState | FormData,
  maybeFormData?: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const { categoryId, formData } = resolveCategoryActionArgs(
    categoryOrState,
    stateOrFormData,
    maybeFormData,
  );

  if (!formData) {
    return {
      ok: false,
      message: "Revisá los datos del fixture.",
    };
  }

  const payload = getFixtureGenerationPayload(formData);

  if (!payload) {
    return {
      ok: false,
      message: "Revisá los datos del fixture.",
    };
  }

  const [teams, existingMatches] = await Promise.all([
    getAdminTeams(tournamentId, categoryId || undefined),
    getAdminMatches(tournamentId, categoryId || undefined),
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
      ...withCategoryId(categoryId),
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
  const admin = await requireAdmin();
  const payload = getViewerAssignmentPayload(formData);

  if (!payload) {
    return {
      ok: false,
      message: "Revisá el veedor asignado.",
    };
  }

  const supabase = await createSupabaseServerClient();
  const { data: updatedMatch, error } = await supabase
    .from("football_matches")
    .update(payload)
    .eq("id", matchId)
    .eq("tournament_id", tournamentId)
    .select("id")
    .maybeSingle();

  if (error) {
    return {
      ok: false,
      message: error.message,
    };
  }

  if (!updatedMatch?.id) {
    return {
      ok: false,
      message: "No pudimos guardar el partido.",
    };
  }

  await recordAuditEvent(supabase, {
    tournamentId,
    actor: admin,
    entityType: "viewer_assignment",
    entityId: matchId,
    action: "assigned",
    summary: payload.assigned_viewer_id
      ? "Asignó veedor a un partido"
      : "Quitó veedor de un partido",
    metadata: {
      assignedViewerId: payload.assigned_viewer_id,
    },
  });

  revalidatePath(`/admin/torneos/${tournamentId}`);
  revalidatePath(`/admin/usuarios/${admin.id}`);
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
  const admin = await requireAdmin();
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
    .select(
      "id, tournament_id, category_id, home_team_id, away_team_id, group_id, next_match_id, result_locked_at, football_tournaments(format)",
    )
    .eq("id", matchId)
    .eq("tournament_id", tournamentId)
    .maybeSingle();

  if (matchError || !match) {
    return {
      ok: false,
      message: "No pudimos encontrar el partido.",
    };
  }

  const matchContext = match as unknown as MatchResultMatchContext;
  const penaltyError = validatePenaltyResult(payload, matchContext);

  if (penaltyError) return penaltyError;

  const eventRows = await buildMatchEventRows(supabase, payload, matchContext);

  if (eventRows.error) {
    return {
      ok: false,
      message: eventRows.error,
    };
  }
  const validatedEventRows = eventRows.rows ?? [];

  const { data: updatedMatch, error } = await supabase
    .from("football_matches")
    .update(payload.result)
    .eq("id", matchId)
    .eq("tournament_id", tournamentId)
    .select("id")
    .maybeSingle();

  if (error) {
    return {
      ok: false,
      message: error.message,
    };
  }

  if (!updatedMatch?.id) {
    return {
      ok: false,
      message: "No pudimos guardar el partido.",
    };
  }

  const eventError = await replaceMatchEvents(
    supabase,
    matchId,
    validatedEventRows,
  );

  if (eventError) {
    return {
      ok: false,
      message: eventError,
    };
  }

  await recordAuditEvent(supabase, {
    tournamentId,
    actor: admin,
    entityType: "match_result",
    entityId: matchId,
    action: "updated",
    summary: "Corrigió resultado de un partido",
    metadata: {
      homeScore: payload.result.home_score,
      awayScore: payload.result.away_score,
      homePenaltyScore: payload.result.home_penalty_score,
      awayPenaltyScore: payload.result.away_penalty_score,
      eventCount: validatedEventRows.length,
    },
  });

  revalidatePath(`/admin/torneos/${tournamentId}`);
  revalidatePath(`/admin/usuarios/${admin.id}`);
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
    .select(
      "id, tournament_id, category_id, home_team_id, away_team_id, group_id, next_match_id, result_locked_at, football_tournaments(format)",
    )
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

  const matchContext = match as unknown as MatchResultMatchContext;
  const penaltyError = validatePenaltyResult(payload, matchContext);

  if (penaltyError) return penaltyError;

  const eventRows = await buildMatchEventRows(supabase, payload, matchContext);

  if (eventRows.error) {
    return {
      ok: false,
      message: eventRows.error,
    };
  }
  const validatedEventRows = eventRows.rows ?? [];

  const eventError = await replaceMatchEvents(
    supabase,
    matchId,
    validatedEventRows,
  );

  if (eventError) {
    return {
      ok: false,
      message: eventError,
    };
  }

  const { error } = await supabase
    .from("football_matches")
    .update({
      ...payload.result,
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

  await recordAuditEvent(supabase, {
    tournamentId: match.tournament_id,
    actor: viewer,
    entityType: "match_result",
    entityId: matchId,
    action: "submitted",
    summary: "Cargó resultado final",
    metadata: {
      homeScore: payload.result.home_score,
      awayScore: payload.result.away_score,
      homePenaltyScore: payload.result.home_penalty_score,
      awayPenaltyScore: payload.result.away_penalty_score,
      eventCount: validatedEventRows.length,
    },
  });

  revalidatePath("/veedor");
  revalidatePath("/futbol");
  revalidatePath(`/admin/torneos/${match.tournament_id}`);
  revalidatePath(`/admin/usuarios/${viewer.id}`);

  return {
    ok: true,
    message: "Resultado final cargado.",
  };
}
