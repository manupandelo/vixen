import type { Metadata } from "next";

import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { SectionHeading } from "@/components/SectionHeading";
import { SectionShell } from "@/components/SectionShell";
import { TournamentSummaryCard } from "@/components/football/TournamentSummaryCard";
import { getPublicFootballTournaments } from "@/features/football-tournaments/data";

export const metadata: Metadata = {
  title: "Torneos de fútbol — Vixen Club",
  description:
    "Torneos activos y finalizados de fútbol 7 en Vixen Club.",
};

export default async function TournamentsPage() {
  const tournaments = await getPublicFootballTournaments();
  const activeTournaments = tournaments.filter(
    (tournament) =>
      tournament.status === "published" || tournament.status === "active",
  );
  const completedTournaments = tournaments.filter(
    (tournament) => tournament.status === "completed",
  );

  return (
    <>
      <Header />
      <main>
        <SectionShell className="pt-28">
          <div className="grid gap-6 border-b border-white/8 pb-8 lg:grid-cols-[0.82fr_1.18fr] lg:items-end">
            <SectionHeading
              kicker="Fútbol 7"
              title="Torneos de fútbol"
              as="h1"
            />
            <p className="max-w-2xl text-[var(--color-muted)] lg:justify-self-end">
              Fixture, posiciones y resultados de los torneos públicos de
              Vixen Club: activos, publicados y finalizados.
            </p>
          </div>

          <section aria-labelledby="active-tournaments-title" className="mt-10">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-accent)]">
                  En juego
                </p>
                <h2 id="active-tournaments-title" className="mt-2 text-display-sm text-3xl">
                  Activos y publicados
                </h2>
              </div>
            </div>

            {activeTournaments.length > 0 ? (
              <div className="mt-6 grid gap-5 lg:grid-cols-2">
                {activeTournaments.map((tournament) => (
                  <TournamentSummaryCard
                    key={tournament.id}
                    tournament={tournament}
                  />
                ))}
              </div>
            ) : (
              <p className="mt-6 rounded-lg border border-white/8 bg-white/[0.025] px-5 py-6 text-sm text-[var(--color-muted)]">
                No hay torneos activos publicados en este momento.
              </p>
            )}
          </section>

          <section
            aria-labelledby="completed-tournaments-title"
            className="mt-14 border-t border-white/8 pt-10"
          >
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-accent)]">
              Historial
            </p>
            <h2 id="completed-tournaments-title" className="mt-2 text-display-sm text-3xl">
              Finalizados
            </h2>

            {completedTournaments.length > 0 ? (
              <div className="mt-6 grid gap-5 lg:grid-cols-2">
                {completedTournaments.map((tournament) => (
                  <TournamentSummaryCard
                    key={tournament.id}
                    tournament={tournament}
                  />
                ))}
              </div>
            ) : (
              <p className="mt-6 rounded-lg border border-white/8 bg-white/[0.025] px-5 py-6 text-sm text-[var(--color-muted)]">
                Todavía no hay torneos finalizados para mostrar.
              </p>
            )}
          </section>
        </SectionShell>
      </main>
      <Footer />
    </>
  );
}
