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
    <div className="mx-auto grid max-w-5xl gap-6">
      <section className="grid gap-4">
        <Link
          href="/admin/torneos"
          className="w-fit text-sm font-semibold text-white/58 transition hover:text-[var(--color-accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-base)]"
        >
          Volver a torneos
        </Link>
        <div>
          <p className="text-sm font-semibold text-[var(--color-accent)]">
            Nuevo torneo
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-normal text-white sm:text-4xl">
            Configurá el torneo
          </h1>
        </div>
        <p className="max-w-2xl text-base leading-7 text-[var(--color-muted)]">
          Completá estos pasos y después cargá los equipos participantes.
        </p>
      </section>

      <TournamentForm
        action={createTournament}
        submitLabel="Crear torneo"
        layout="stepped"
      />
    </div>
  );
}
