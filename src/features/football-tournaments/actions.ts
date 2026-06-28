"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";

import { requireAdmin } from "./data";

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
