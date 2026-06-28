import type { Metadata } from "next";
import Link from "next/link";

import { LoginForm } from "./LoginForm";

export const metadata: Metadata = {
  title: "Admin — Vixen Club",
  description: "Acceso privado al panel de torneos de fútbol de Vixen Club.",
};

export default function AdminLoginPage() {
  return (
    <main className="min-h-screen bg-[var(--color-base)] px-4 py-10 text-[var(--color-ink)] sm:px-6">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-md flex-col justify-center">
        <Link
          href="/"
          className="mb-8 w-fit text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-accent)] transition hover:text-[var(--color-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-base)]"
        >
          Vixen Club
        </Link>

        <section className="editorial-panel p-6 sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-accent)]">
            Panel privado
          </p>
          <h1 className="mt-4 text-display-sm">Administración</h1>
          <p className="mt-4 text-sm leading-6 text-[var(--color-muted)]">
            Ingresá con una cuenta habilitada para gestionar los torneos de
            fútbol.
          </p>
          <LoginForm />
        </section>
      </div>
    </main>
  );
}
