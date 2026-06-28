import type { Metadata } from "next";
import Link from "next/link";

import { TournamentForm } from "@/components/admin/AdminForms";
import { createTournament } from "@/features/football-tournaments/actions";

export const metadata: Metadata = {
  title: "Nuevo torneo — Vixen Admin",
  description: "Alta de torneos de fútbol.",
};

export default function NewTournamentPage() {
  return (
    <div className="grid gap-8">
      <section className="border-b border-white/10 pb-8">
        <Link
          href="/admin/torneos"
          className="text-sm font-semibold uppercase tracking-[0.16em] text-white/58 transition hover:text-[var(--color-accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-base)]"
        >
          Volver a torneos
        </Link>
        <p className="mt-6 text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-accent)]">
          Nuevo torneo
        </p>
        <h1 className="mt-4 text-display-sm">Crear torneo</h1>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-[var(--color-muted)]">
          Definí los datos base del torneo. Después vas a poder cargar equipos
          y partidos desde la pantalla de edición.
        </p>
      </section>

      <section className="editorial-panel p-6 sm:p-8">
        <TournamentForm action={createTournament} submitLabel="Crear torneo" />
      </section>
    </div>
  );
}
