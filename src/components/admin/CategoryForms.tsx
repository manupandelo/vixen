"use client";

import * as AlertDialog from "@radix-ui/react-alert-dialog";
import * as Dialog from "@radix-ui/react-dialog";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useActionState, useState } from "react";

import { useActionToast } from "@/components/admin/AdminToast";
import type { ActionState } from "@/features/football-tournaments/actions";
import type { AdminTournamentCategory } from "@/features/football-tournaments/data";

type CategoryFormAction = (
  prevState: ActionState,
  formData: FormData,
) => Promise<ActionState>;

type CategoryFormProps = {
  action: CategoryFormAction;
  category?: AdminTournamentCategory;
  submitLabel: string;
  onSuccess?: () => void;
};

const inputClass =
  "flex min-h-11 w-full rounded-[0.75rem] border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-[var(--color-accent)]";
const labelClass =
  "mb-2 flex items-center gap-2 text-sm font-semibold text-white";
const compactButtonClass =
  "inline-flex items-center gap-2 rounded-[0.6rem] border border-white/10 bg-white/[0.035] px-3 py-1.5 text-xs font-semibold text-white/70 transition hover:bg-white/[0.06] hover:text-white";
const submitButtonClass =
  "inline-flex min-h-11 w-full items-center justify-center rounded-[0.75rem] border border-[var(--color-accent)] bg-[var(--color-accent)] px-4 text-sm font-semibold text-[#07110a] transition hover:bg-[var(--color-accent-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-base)] disabled:opacity-50";

function CategoryForm({
  action,
  category,
  submitLabel,
  onSuccess,
}: CategoryFormProps) {
  const [state, formAction, isPending] = useActionState(action, {
    ok: true,
    message: "",
  });

  useActionToast(state, { onSuccess });

  return (
    <form action={formAction} className="grid gap-5">
      <div>
        <label htmlFor="name" className={labelClass}>
          Nombre de la categoría
        </label>
        <input
          id="name"
          name="name"
          required
          minLength={2}
          maxLength={80}
          defaultValue={category?.name}
          placeholder="Ej: Libre, Segunda, +30..."
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="status" className={labelClass}>
          Estado
        </label>
        <select
          id="status"
          name="status"
          defaultValue={category?.status ?? "draft"}
          className={inputClass}
        >
          <option value="draft">Borrador</option>
          <option value="published">Publicado</option>
          <option value="active">Activo</option>
          <option value="completed">Finalizado</option>
          <option value="archived">Archivado</option>
        </select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="startsAt" className={labelClass}>
            Fecha de inicio (opcional)
          </label>
          <input
            id="startsAt"
            name="startsAt"
            type="date"
            defaultValue={category?.startsAt ?? ""}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="endsAt" className={labelClass}>
            Fecha de fin (opcional)
          </label>
          <input
            id="endsAt"
            name="endsAt"
            type="date"
            defaultValue={category?.endsAt ?? ""}
            className={inputClass}
          />
        </div>
      </div>

      <button type="submit" disabled={isPending} className={submitButtonClass}>
        {isPending ? "Guardando..." : submitLabel}
      </button>
    </form>
  );
}

export function CategoryCreateDialog({ action }: { action: CategoryFormAction }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          type="button"
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-[0.75rem] border border-white/10 bg-white/[0.035] px-4 text-sm font-semibold text-white transition hover:bg-white/[0.06]"
        >
          <Plus size={16} aria-hidden="true" />
          Nueva categoría
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[88vh] w-[min(94vw,32rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-[1rem] border border-white/10 bg-[#111612] p-6 shadow-[0_24px_90px_rgb(0_0_0_/_0.42)]">
          <Dialog.Title className="text-2xl font-semibold text-white">
            Crear categoría
          </Dialog.Title>
          <Dialog.Description className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
            Agregá una nueva categoría al torneo.
          </Dialog.Description>
          <div className="mt-6">
            <CategoryForm
              action={action}
              submitLabel="Crear categoría"
              onSuccess={() => setOpen(false)}
            />
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function CategoryEditDialog({
  action,
  category,
}: {
  action: CategoryFormAction;
  category: AdminTournamentCategory;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button type="button" className={compactButtonClass}>
          <Pencil size={14} aria-hidden="true" />
          Editar
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[88vh] w-[min(94vw,32rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-[1rem] border border-white/10 bg-[#111612] p-6 shadow-[0_24px_90px_rgb(0_0_0_/_0.42)]">
          <Dialog.Title className="text-2xl font-semibold text-white">
            Editar categoría
          </Dialog.Title>
          <Dialog.Description className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
            Actualizá los datos de la categoría.
          </Dialog.Description>
          <div className="mt-6">
            <CategoryForm
              action={action}
              category={category}
              submitLabel="Guardar cambios"
              onSuccess={() => setOpen(false)}
            />
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function CategoryRemoveDialog({
  action,
  categoryName,
}: {
  action: CategoryFormAction;
  categoryName: string;
}) {
  const [state, formAction, isPending] = useActionState(action, {
    ok: true,
    message: "",
  });

  useActionToast(state);

  return (
    <AlertDialog.Root>
      <AlertDialog.Trigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-[0.6rem] border border-red-500/10 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-400 transition hover:bg-red-500/20"
        >
          <Trash2 size={14} aria-hidden="true" />
          Eliminar
        </button>
      </AlertDialog.Trigger>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" />
        <AlertDialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[88vh] w-[min(94vw,32rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-[1rem] border border-white/10 bg-[#111612] p-6 shadow-[0_24px_90px_rgb(0_0_0_/_0.42)]">
          <AlertDialog.Title className="text-2xl font-semibold text-white">
            Eliminar categoría
          </AlertDialog.Title>
          <AlertDialog.Description className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
            Estás a punto de eliminar la categoría{" "}
            <strong className="font-semibold text-white">
              {categoryName}
            </strong>
            . Todos los equipos, jugadores y partidos asociados también serán eliminados. Esta acción no se puede deshacer.
          </AlertDialog.Description>
          <form action={formAction} className="mt-6 grid gap-5">
            <div>
              <label htmlFor="confirmation" className={labelClass}>
                Escribí el nombre de la categoría para confirmar
              </label>
              <input
                id="confirmation"
                name="confirmation"
                required
                className={inputClass}
                placeholder={categoryName}
              />
              <input type="hidden" name="categoryName" value={categoryName} />
            </div>
            <div className="flex justify-end gap-3">
              <AlertDialog.Cancel asChild>
                <button
                  type="button"
                  disabled={isPending}
                  className="min-h-11 rounded-[0.75rem] border border-white/10 bg-transparent px-4 text-sm font-semibold text-white/70 transition hover:bg-white/[0.035] hover:text-white"
                >
                  Cancelar
                </button>
              </AlertDialog.Cancel>
              <button
                type="submit"
                disabled={isPending}
                className="min-h-11 rounded-[0.75rem] border border-red-500 bg-red-500 px-4 text-sm font-semibold text-white transition hover:bg-red-600"
              >
                {isPending ? "Eliminando..." : "Eliminar categoría"}
              </button>
            </div>
          </form>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
