import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

import type { StaffRole } from "./types";

export async function createStaffAuthUser({
  email,
  password,
}: {
  email: string;
  password: string;
}) {
  const supabase = createSupabaseAdminClient();

  return supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
}

export async function deleteStaffAuthUser(userId: string) {
  const supabase = createSupabaseAdminClient();

  return supabase.auth.admin.deleteUser(userId);
}

export async function setStaffAuthBan(userId: string, banDuration: string) {
  const supabase = createSupabaseAdminClient();

  return supabase.auth.admin.updateUserById(userId, {
    ban_duration: banDuration,
  });
}

export async function createStaffProfile({
  id,
  email,
  role,
}: {
  id: string;
  email: string;
  role: StaffRole;
}) {
  const supabase = createSupabaseAdminClient();

  return supabase.from("admin_profiles").insert({
    id,
    email,
    role,
    status: "active",
  });
}

export async function setStaffRole(userId: string, role: StaffRole) {
  const supabase = createSupabaseAdminClient();

  return supabase.from("admin_profiles").update({ role }).eq("id", userId);
}

export async function suspendStaffProfile({
  userId,
  suspendedAt,
  reason,
}: {
  userId: string;
  suspendedAt: string;
  reason: string | null;
}) {
  const supabase = createSupabaseAdminClient();

  return supabase
    .from("admin_profiles")
    .update({
      status: "suspended",
      suspended_at: suspendedAt,
      suspended_reason: reason,
    })
    .eq("id", userId);
}

export async function activateStaffProfile(userId: string) {
  const supabase = createSupabaseAdminClient();

  return supabase
    .from("admin_profiles")
    .update({
      status: "active",
      suspended_at: null,
      suspended_reason: null,
    })
    .eq("id", userId);
}

export async function getStaffMatchHistoryCount(userId: string) {
  const supabase = createSupabaseAdminClient();
  const [{ data: assigned, error: assignedError }, { data: submitted, error }] =
    await Promise.all([
      supabase
        .from("football_matches")
        .select("id")
        .eq("assigned_viewer_id", userId)
        .limit(1),
      supabase
        .from("football_matches")
        .select("id")
        .eq("result_submitted_by", userId)
        .limit(1),
    ]);

  if (assignedError) throw new Error(assignedError.message);
  if (error) throw new Error(error.message);

  return (assigned?.length ?? 0) + (submitted?.length ?? 0);
}
