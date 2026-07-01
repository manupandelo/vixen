"use server";

import "server-only";

import { revalidatePath } from "next/cache";

import type { ActionState } from "./actions";
import {
  activateStaffProfile,
  createStaffAuthUser,
  createStaffProfile,
  deleteStaffAuthUser,
  getStaffMatchHistoryCount,
  setStaffAuthBan,
  setStaffRole,
  suspendStaffProfile,
} from "./staff-admin.server";
import { requireAdmin } from "./data";
import {
  staffCreateFormSchema,
  staffDeleteFormSchema,
  staffRoleFormSchema,
  staffSuspendFormSchema,
} from "./validation";

const LONG_AUTH_BAN_DURATION = "876000h";

function staffError(message: string): ActionState {
  return { ok: false, message };
}

function staffSuccess(message: string): ActionState {
  return { ok: true, message };
}

export async function createStaffUser(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const parsed = staffCreateFormSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) return staffError("Revisá los datos del usuario.");

  const { data, error } = await createStaffAuthUser({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) return staffError(error.message);

  if (!data.user?.id) return staffError("No pudimos crear el usuario.");

  const { error: profileError } = await createStaffProfile({
    id: data.user.id,
    email: parsed.data.email,
    role: parsed.data.role,
  });

  if (profileError) {
    await deleteStaffAuthUser(data.user.id);

    return staffError(profileError.message);
  }

  revalidatePath("/admin/usuarios");

  return staffSuccess("Usuario creado.");
}

export async function updateStaffRole(
  userId: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const admin = await requireAdmin();

  if (admin.id === userId) {
    return staffError("No podés cambiar tu propio rol.");
  }

  const parsed = staffRoleFormSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) return staffError("Revisá el rol.");

  const { error } = await setStaffRole(userId, parsed.data.role);

  if (error) return staffError(error.message);

  revalidatePath("/admin/usuarios");

  return staffSuccess("Rol actualizado.");
}

export async function suspendStaffUser(
  userId: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const admin = await requireAdmin();

  if (admin.id === userId) {
    return staffError("No podés suspender tu propio usuario.");
  }

  const parsed = staffSuspendFormSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) return staffError("Revisá el motivo.");

  const suspendedAt = new Date().toISOString();
  const { error } = await suspendStaffProfile({
    userId,
    suspendedAt,
    reason: parsed.data.reason,
  });

  if (error) return staffError(error.message);

  const { error: authError } = await setStaffAuthBan(
    userId,
    LONG_AUTH_BAN_DURATION,
  );

  if (authError) return staffError(authError.message);

  revalidatePath("/admin/usuarios");

  return staffSuccess("Usuario suspendido.");
}

export async function reactivateStaffUser(
  userId: string,
  _prevState?: ActionState,
  _formData?: FormData,
): Promise<ActionState> {
  void _prevState;
  void _formData;

  const admin = await requireAdmin();

  if (admin.id === userId) {
    return staffError("Tu usuario ya está activo.");
  }

  const { error } = await activateStaffProfile(userId);

  if (error) return staffError(error.message);

  const { error: authError } = await setStaffAuthBan(userId, "none");

  if (authError) return staffError(authError.message);

  revalidatePath("/admin/usuarios");

  return staffSuccess("Usuario reactivado.");
}

export async function deleteStaffUser(
  userId: string,
  expectedEmail: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const admin = await requireAdmin();

  if (admin.id === userId) {
    return staffError("No podés eliminar tu propio usuario.");
  }

  const parsed = staffDeleteFormSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success || parsed.data.confirmation !== expectedEmail) {
    return staffError(`Escribí "${expectedEmail}" para eliminar el usuario.`);
  }

  const matchHistoryCount = await getStaffMatchHistoryCount(userId);

  if (matchHistoryCount > 0) {
    return staffError("No se puede eliminar un usuario con historial de partidos.");
  }

  const { error } = await deleteStaffAuthUser(userId);

  if (error) return staffError(error.message);

  revalidatePath("/admin/usuarios");

  return staffSuccess("Usuario eliminado.");
}
