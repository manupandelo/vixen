"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";

import { requireAdmin } from "./data";
import { tournamentFormSchema } from "./validation";

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
