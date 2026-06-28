import type { Metadata } from "next";
import Link from "next/link";

import { pingAdminAccess } from "@/features/football-tournaments/actions";

export const metadata: Metadata = {
  title: "Panel admin — Vixen Club",
  description: "Panel privado para gestionar torneos de fútbol.",
};

export default function AdminDashboardPage() {
  async function verifyAdminAccess() {
    "use server";

    await pingAdminAccess();
  }

  return (
    <div className="grid gap-8">
      <section className="grid gap-6 border-b border-white/10 pb-8 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-accent)]">
            Panel privado
          </p>
          <h1 className="mt-4 text-display-sm">Administración de torneos</h1>
          <p className="mt-4 max-w-2xl text-[var(--color-muted)]">
            Gestioná la operación interna de los torneos de fútbol de Vixen
            Club.
          </p>
        </div>

        <form action={verifyAdminAccess}>
          <button
            type="submit"
            className="inline-flex min-h-11 items-center justify-center rounded-[0.8rem] border border-white/12 bg-white/[0.025] px-4 py-2 text-sm font-semibold uppercase tracking-[0.14em] text-white/78 transition hover:border-[var(--color-accent)] hover:bg-white/[0.05] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-base)]"
          >
            Verificar acceso
          </button>
        </form>
      </section>

      <section className="editorial-panel p-6 sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-accent)]">
          Torneos
        </p>
        <h2 className="mt-4 text-2xl font-semibold">Fixture y posiciones</h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--color-muted)]">
          Continuá hacia la gestión de torneos para cargar equipos, partidos y
          resultados.
        </p>
        <Link
          href="/admin/torneos"
          className="mt-6 inline-flex min-h-12 items-center justify-center rounded-[0.95rem] border border-[color-mix(in_srgb,var(--color-accent)_72%,black)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--color-accent)_92%,white_8%),var(--color-accent))] px-5 py-3 text-sm font-semibold uppercase tracking-[0.14em] text-[#07110a] shadow-[0_10px_24px_rgb(60_191_113_/_0.12)] transition duration-200 hover:-translate-y-px hover:border-[var(--color-accent-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-base)]"
        >
          Ir a torneos
        </Link>
      </section>
    </div>
  );
}
