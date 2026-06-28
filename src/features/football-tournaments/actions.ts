"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";

import { requireAdmin } from "./data";
import { teamFormSchema, tournamentFormSchema } from "./validation";

export type ActionState = {
  ok: boolean;
  message: string;
};

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

  const { data: adminProfile } = await supabase
    .from("admin_profiles")
    .select("id, email, role")
    .eq("id", data.user.id)
    .eq("role", "admin")
    .maybeSingle();

  if (!adminProfile) {
    await supabase.auth.signOut();

    return {
      ok: false,
      message: "Tu usuario no tiene permisos de administrador.",
    };
  }

  redirect("/admin");
}

export async function logoutAdmin() {
  const supabase = await createSupabaseServerClient();

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
    slug: parsed.data.slug,
    season: parsed.data.season,
    category: parsed.data.category,
    status: parsed.data.status,
    starts_at: parsed.data.startsAt,
    ends_at: parsed.data.endsAt,
    description: parsed.data.description,
  };
}

function getTeamPayload(formData: FormData) {
  const parsed = teamFormSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) return null;

  return {
    publicTeam: {
      name: parsed.data.name,
      short_name: parsed.data.shortName,
    },
    adminDetails: {
      captain_name: parsed.data.captainName,
      contact_phone: parsed.data.contactPhone,
      notes: parsed.data.notes,
    },
  };
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
  const { error } = await supabase.from("football_tournaments").insert(payload);

  if (error) {
    return {
      ok: false,
      message: error.message,
    };
  }

  revalidatePath("/admin/torneos");
  redirect("/admin/torneos");
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

export async function createTeam(
  tournamentId: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const payload = getTeamPayload(formData);

  if (!payload) {
    return {
      ok: false,
      message: "Revisá los datos del equipo.",
    };
  }

  const supabase = await createSupabaseServerClient();
  const { data: team, error: teamError } = await supabase
    .from("football_teams")
    .insert({
      tournament_id: tournamentId,
      ...payload.publicTeam,
    })
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

  revalidatePath(`/admin/torneos/${tournamentId}/equipos`);
  revalidatePath("/futbol");

  return {
    ok: true,
    message: "Equipo creado.",
  };
}
