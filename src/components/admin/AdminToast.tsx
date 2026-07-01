"use client";

import {
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { CheckCircle2, TriangleAlert, X } from "lucide-react";

import type { ActionState } from "@/features/football-tournaments/actions";

type ToastTone = "success" | "error";

type AdminToast = {
  tone: ToastTone;
  message: string;
};

type VisibleAdminToast = AdminToast & {
  id: number;
};

type AdminToastContextValue = {
  notify: (toast: AdminToast) => void;
};

const AdminToastContext = createContext<AdminToastContextValue | null>(null);

const noticeMessages: Record<string, string> = {
  "tournament-created": "Torneo creado. Ahora agregá los equipos.",
};

export function useAdminToast() {
  const context = use(AdminToastContext);

  if (!context) {
    return {
      notify: () => undefined,
    };
  }

  return context;
}

export function useActionToast(
  state: ActionState,
  options: {
    onSuccess?: () => void;
  } = {},
) {
  const { notify } = useAdminToast();
  const { onSuccess } = options;
  const onSuccessRef = useRef(onSuccess);
  const lastMessageRef = useRef("");

  useEffect(() => {
    onSuccessRef.current = onSuccess;
  }, [onSuccess]);

  useEffect(() => {
    if (!state.message || state.message === lastMessageRef.current) return;

    lastMessageRef.current = state.message;
    notify({
      tone: state.ok ? "success" : "error",
      message: state.message,
    });

    const successCallback = state.ok ? onSuccessRef.current : undefined;
    successCallback?.();
  }, [notify, state]);
}

function UrlNoticeListener() {
  const { notify } = useAdminToast();
  const lastNoticeRef = useRef<string | null>(null);

  useEffect(() => {
    const notice = new URLSearchParams(window.location.search).get("notice");

    if (!notice || notice === lastNoticeRef.current) return;

    const message = noticeMessages[notice];

    if (!message) return;

    lastNoticeRef.current = notice;
    notify({ tone: "success", message });
  }, [notify]);

  return null;
}

export function AdminToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<VisibleAdminToast[]>([]);
  const nextToastId = useRef(1);
  const notify = useCallback((adminToast: AdminToast) => {
    const id = nextToastId.current;
    nextToastId.current += 1;

    setToasts((current) => [...current.slice(-2), { ...adminToast, id }]);

    window.setTimeout(
      () => {
        setToasts((current) => current.filter((toast) => toast.id !== id));
      },
      adminToast.tone === "success" ? 3600 : 5200,
    );
  }, []);
  const dismissToast = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const value = useMemo(() => ({ notify }), [notify]);

  return (
    <AdminToastContext.Provider value={value}>
      <UrlNoticeListener />
      {children}
      <div
        aria-live="polite"
        data-admin-toast-region
        className="fixed left-1/2 top-5 z-[80] grid w-[min(92vw,30rem)] -translate-x-1/2 gap-2"
      >
        {toasts.map((toast) => {
          const isSuccess = toast.tone === "success";
          const Icon = isSuccess ? CheckCircle2 : TriangleAlert;

          return (
            <article
              key={toast.id}
              className={
                isSuccess
                  ? "flex items-start gap-3 rounded-[1rem] border border-[var(--color-accent)]/35 bg-[linear-gradient(180deg,#122018,#0f1511)] px-5 py-4 text-white shadow-[0_24px_90px_rgb(0_0_0_/_0.45)]"
                  : "flex items-start gap-3 rounded-[1rem] border border-[var(--color-warm)]/45 bg-[linear-gradient(180deg,#24140f,#11100f)] px-5 py-4 text-white shadow-[0_24px_90px_rgb(0_0_0_/_0.45)]"
              }
            >
              <Icon
                size={20}
                aria-hidden="true"
                className={
                  isSuccess
                    ? "mt-0.5 shrink-0 text-[var(--color-accent)]"
                    : "mt-0.5 shrink-0 text-[var(--color-warm)]"
                }
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-white">
                  {isSuccess ? "Listo" : "Revisá esto"}
                </p>
                <p className="mt-1 text-sm leading-5 text-white/72">
                  {toast.message}
                </p>
              </div>
              <button
                type="button"
                aria-label="Cerrar notificación"
                onClick={() => dismissToast(toast.id)}
                className="inline-flex size-8 shrink-0 items-center justify-center rounded-full border border-white/12 bg-white/[0.035] text-white/68 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
              >
                <X size={15} aria-hidden="true" />
              </button>
            </article>
          );
        })}
      </div>
    </AdminToastContext.Provider>
  );
}
