"use client";

import { useActionState } from "react";

import {
  loginAdmin,
  type ActionState,
} from "@/features/football-tournaments/actions";

const initialState: ActionState = {
  ok: false,
  message: "",
};

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(
    loginAdmin,
    initialState,
  );

  return (
    <form action={formAction} className="mt-8 grid gap-5">
      <div className="grid gap-2">
        <label
          htmlFor="email"
          className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--color-ink)]/72"
        >
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="min-h-12 rounded-[0.8rem] border border-white/12 bg-white/[0.035] px-4 text-base text-white caret-white outline-none transition placeholder:text-white/34 focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/30"
          placeholder="admin@vixenclub.com"
        />
      </div>

      <div className="grid gap-2">
        <label
          htmlFor="password"
          className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--color-ink)]/72"
        >
          Contraseña
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="min-h-12 rounded-[0.8rem] border border-white/12 bg-white/[0.035] px-4 text-base text-white caret-white outline-none transition placeholder:text-white/34 focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/30"
        />
      </div>

      {state.message ? (
        <p
          className={
            state.ok
              ? "rounded-[0.8rem] border border-[var(--color-accent)]/30 bg-[var(--color-accent)]/10 px-4 py-3 text-sm text-white/86"
              : "rounded-[0.8rem] border border-[var(--color-warm)]/35 bg-[var(--color-warm)]/10 px-4 py-3 text-sm text-white/86"
          }
          aria-live="polite"
        >
          {state.message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex min-h-12 items-center justify-center rounded-[0.95rem] border border-[color-mix(in_srgb,var(--color-accent)_72%,black)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--color-accent)_92%,white_8%),var(--color-accent))] px-5 py-3 text-sm font-semibold uppercase tracking-[0.14em] text-[#07110a] shadow-[0_10px_24px_rgb(60_191_113_/_0.12)] transition duration-200 hover:-translate-y-px hover:border-[var(--color-accent-strong)] disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-base)]"
      >
        {isPending ? "Ingresando..." : "Ingresar"}
      </button>
    </form>
  );
}
