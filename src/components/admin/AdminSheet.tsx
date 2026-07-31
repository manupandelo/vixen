"use client";

import type { ReactNode } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";

type AdminSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
};

/**
 * Panel deslizante: entra desde abajo en mobile y desde la derecha en escritorio.
 * Reemplaza al panel lateral fijo, que empujaba el contenido y lo tapaba.
 */
export function AdminSheet({
  open,
  onOpenChange,
  title,
  description,
  children,
}: AdminSheetProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" />
        <Dialog.Content className="fixed inset-x-0 bottom-0 z-50 flex max-h-[90dvh] flex-col rounded-t-2xl border border-white/10 bg-[#0F1411] shadow-[0_-12px_60px_rgb(0_0_0_/_0.55)] sm:inset-y-0 sm:left-auto sm:right-0 sm:max-h-none sm:w-[min(26rem,100vw)] sm:rounded-none sm:rounded-l-2xl sm:border-y-0 sm:border-r-0">
          <div className="flex items-start justify-between gap-4 border-b border-white/10 bg-white/[0.02] p-5">
            <div className="min-w-0">
              <Dialog.Title className="text-sm font-bold uppercase tracking-wider text-white">
                {title}
              </Dialog.Title>
              {description ? (
                <Dialog.Description className="mt-1 text-xs text-white/50">
                  {description}
                </Dialog.Description>
              ) : (
                <Dialog.Description className="sr-only">
                  {title}
                </Dialog.Description>
              )}
            </div>
            <Dialog.Close asChild>
              <button
                type="button"
                aria-label="Cerrar"
                className="grid size-11 shrink-0 place-items-center rounded-full bg-white/5 text-white/60 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
              >
                <X size={16} aria-hidden="true" />
              </button>
            </Dialog.Close>
          </div>

          <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto">
            {children}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
