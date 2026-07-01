"use client";

import * as AlertDialog from "@radix-ui/react-alert-dialog";
import * as Dialog from "@radix-ui/react-dialog";
import { Plus, ShieldOff, Trash2, UserRoundCheck } from "lucide-react";
import { useActionState, useState } from "react";

import {
  adminPrimaryActionClass,
  adminSecondaryActionClass,
  adminQuietActionClass,
} from "@/components/admin/AdminUI";
import { useActionToast } from "@/components/admin/AdminToast";
import type { ActionState } from "@/features/football-tournaments/actions";
import type { StaffRole } from "@/features/football-tournaments/types";

type FormAction = (
  prevState: ActionState,
  formData: FormData,
) => Promise<ActionState>;

type StaffCreateDialogProps = {
  action: FormAction;
};

type StaffRoleFormProps = {
  action: FormAction;
  role: StaffRole;
  disabled?: boolean;
};

type StaffSuspendDialogProps = {
  action: FormAction;
  email: string;
  disabled?: boolean;
};

type StaffReactivateFormProps = {
  action: FormAction;
  disabled?: boolean;
};

type StaffDeleteDialogProps = {
  action: FormAction;
  email: string;
  disabled?: boolean;
};

const initialState: ActionState = {
  ok: false,
  message: "",
};

const inputClass =
  "min-h-11 rounded-[0.8rem] border border-white/12 bg-white/[0.035] px-3 text-sm text-white caret-white outline-none transition placeholder:text-white/34 focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/30 [&>option]:bg-[var(--color-surface)] [&>option]:text-white";

const labelClass =
  "text-xs font-semibold uppercase tracking-[0.16em] text-white/54";

const dangerButtonClass =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-[0.8rem] border border-[var(--color-warm)]/45 bg-[var(--color-warm)]/10 px-3 py-2 text-sm font-semibold text-white transition hover:bg-[var(--color-warm)]/18 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-warm)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-base)]";

export function StaffCreateDialog({ action }: StaffCreateDialogProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);
  const [open, setOpen] = useState(false);

  useActionToast(state, {
    onSuccess: () => setOpen(false),
  });

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button type="button" className={adminPrimaryActionClass}>
          <Plus size={16} aria-hidden="true" />
          Nuevo usuario
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[min(94vw,34rem)] -translate-x-1/2 -translate-y-1/2 rounded-[1rem] border border-white/10 bg-[#111612] p-6 shadow-[0_24px_90px_rgb(0_0_0_/_0.42)]">
          <Dialog.Title className="text-2xl font-semibold text-white">
            Nuevo usuario
          </Dialog.Title>
          <Dialog.Description className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
            Creá el acceso y asigná el rol inicial. Después podés suspenderlo o
            cambiar el rol desde esta misma tabla.
          </Dialog.Description>

          <form action={formAction} className="mt-6 grid gap-4">
            <label className="grid gap-2">
              <span className={labelClass}>Email</span>
              <input
                name="email"
                type="email"
                className={inputClass}
                placeholder="veedor@club.com"
                autoComplete="email"
                required
              />
            </label>

            <label className="grid gap-2">
              <span className={labelClass}>Contraseña temporal</span>
              <input
                name="password"
                type="password"
                className={inputClass}
                placeholder="Mínimo 8 caracteres"
                minLength={8}
                autoComplete="new-password"
                required
              />
            </label>

            <label className="grid gap-2">
              <span className={labelClass}>Rol</span>
              <select name="role" defaultValue="viewer" className={inputClass}>
                <option value="viewer">Veedor</option>
                <option value="admin">Administrador</option>
              </select>
            </label>

            <div className="flex flex-wrap justify-end gap-3">
              <Dialog.Close asChild>
                <button type="button" className={adminSecondaryActionClass}>
                  Cancelar
                </button>
              </Dialog.Close>
              <button
                type="submit"
                disabled={isPending}
                className={adminPrimaryActionClass}
              >
                {isPending ? "Creando..." : "Crear usuario"}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function StaffRoleForm({ action, role, disabled }: StaffRoleFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);
  useActionToast(state);

  return (
    <form action={formAction} className="grid gap-2 sm:grid-cols-[1fr_auto]">
      <select
        name="role"
        aria-label="Rol del usuario"
        defaultValue={role}
        disabled={disabled || isPending}
        className={inputClass}
      >
        <option value="viewer">Veedor</option>
        <option value="admin">Administrador</option>
      </select>
      <button
        type="submit"
        disabled={disabled || isPending}
        className={adminSecondaryActionClass}
      >
        {isPending ? "Guardando..." : "Actualizar"}
      </button>
    </form>
  );
}

export function StaffSuspendDialog({
  action,
  email,
  disabled,
}: StaffSuspendDialogProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);
  const [open, setOpen] = useState(false);

  useActionToast(state, {
    onSuccess: () => setOpen(false),
  });

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button type="button" disabled={disabled} className={dangerButtonClass}>
          <ShieldOff size={15} aria-hidden="true" />
          Suspender
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[min(94vw,34rem)] -translate-x-1/2 -translate-y-1/2 rounded-[1rem] border border-white/10 bg-[#111612] p-6 shadow-[0_24px_90px_rgb(0_0_0_/_0.42)]">
          <Dialog.Title className="text-2xl font-semibold text-white">
            Suspender usuario
          </Dialog.Title>
          <Dialog.Description className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
            {email} no podrá entrar al panel hasta que un administrador lo
            reactive.
          </Dialog.Description>

          <form action={formAction} className="mt-6 grid gap-4">
            <label className="grid gap-2">
              <span className={labelClass}>Motivo interno</span>
              <textarea
                name="reason"
                className={`${inputClass} min-h-24 resize-y py-3 leading-6`}
                placeholder="Opcional"
              />
            </label>

            <div className="flex flex-wrap justify-end gap-3">
              <Dialog.Close asChild>
                <button type="button" className={adminSecondaryActionClass}>
                  Cancelar
                </button>
              </Dialog.Close>
              <button
                type="submit"
                disabled={isPending}
                className={dangerButtonClass}
              >
                {isPending ? "Suspendiendo..." : "Suspender acceso"}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function StaffReactivateForm({
  action,
  disabled,
}: StaffReactivateFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);
  useActionToast(state);

  return (
    <form action={formAction} className="grid gap-2">
      <button
        type="submit"
        disabled={disabled || isPending}
        className={adminSecondaryActionClass}
      >
        <UserRoundCheck size={15} aria-hidden="true" />
        {isPending ? "Reactivando..." : "Reactivar"}
      </button>
    </form>
  );
}

export function StaffDeleteDialog({
  action,
  email,
  disabled,
}: StaffDeleteDialogProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);
  const [confirmation, setConfirmation] = useState("");
  const [open, setOpen] = useState(false);
  const canDelete = confirmation.trim() === email;

  useActionToast(state, {
    onSuccess: () => {
      setOpen(false);
      setConfirmation("");
    },
  });

  return (
    <AlertDialog.Root open={open} onOpenChange={setOpen}>
      <AlertDialog.Trigger asChild>
        <button type="button" disabled={disabled} className={adminQuietActionClass}>
          <Trash2 size={15} aria-hidden="true" />
          Eliminar
        </button>
      </AlertDialog.Trigger>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" />
        <AlertDialog.Content className="fixed left-1/2 top-1/2 z-50 grid w-[min(94vw,34rem)] -translate-x-1/2 -translate-y-1/2 gap-5 rounded-[1rem] border border-[var(--color-warm)]/35 bg-[#17100d] p-6 shadow-[0_24px_90px_rgb(0_0_0_/_0.42)]">
          <div>
            <AlertDialog.Title className="text-2xl font-semibold text-white">
              Eliminar usuario
            </AlertDialog.Title>
            <AlertDialog.Description className="mt-3 text-sm leading-6 text-white/68">
              Solo se elimina si no tiene partidos asignados o resultados
              cargados. Para historial real, usá suspensión.
            </AlertDialog.Description>
          </div>

          <form action={formAction} className="grid gap-4">
            <label className="grid gap-2">
              <span className={labelClass}>Escribí el email para confirmar</span>
              <input
                name="confirmation"
                value={confirmation}
                onChange={(event) => setConfirmation(event.target.value)}
                className={inputClass}
                placeholder={email}
                autoComplete="off"
              />
            </label>

            <div className="flex flex-wrap justify-end gap-3">
              <AlertDialog.Cancel asChild>
                <button type="button" className={adminSecondaryActionClass}>
                  Cancelar
                </button>
              </AlertDialog.Cancel>
              <button
                type="submit"
                disabled={isPending || !canDelete}
                className={dangerButtonClass}
              >
                {isPending ? "Eliminando..." : "Eliminar definitivamente"}
              </button>
            </div>
          </form>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
