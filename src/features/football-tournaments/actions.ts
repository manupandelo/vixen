"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";

import { requireAdmin } from "./data";

export type ActionState = {
  status: "idle" | "success" | "error";
  message?: string;
};

function getRequiredString(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}

export async function loginAdmin(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const email = getRequiredString(formData, "email");
  const password = getRequiredString(formData, "password");

  if (!email || !password) {
    return {
      status: "error",
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
      status: "error",
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
      status: "error",
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
    status: "success",
    message: "Acceso de administrador verificado.",
  };
}
