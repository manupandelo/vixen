import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { SectionShell } from "@/components/SectionShell";
import { PublicTournamentPanel } from "@/components/football/PublicTournamentPanel";
import {
  flattenTournamentCategory,
  getPublicFootballTournamentWithCategoriesBySlug,
} from "@/features/football-tournaments/data";
import { footballTournamentFormatLabels } from "@/features/football-tournaments/types";
import { PublicCategoryDropdown } from "@/components/football/PublicCategoryDropdown";

type TournamentCategoryPageProps = {
  params: Promise<{ slug: string; categorySlug: string }>;
};

export async function generateMetadata({
  params,
}: TournamentCategoryPageProps): Promise<Metadata> {
  const { slug, categorySlug } = await params;
  const tournament = await getPublicFootballTournamentWithCategoriesBySlug(slug);
  const category = tournament?.categories.find(
    (candidate) => candidate.slug === categorySlug,
  );

  if (!tournament || !category) {
    return {
      title: "Torneo no encontrado — Vixen Club",
    };
  }

  return {
    title: `${tournament.name} ${category.name} — Vixen Club`,
    description: `Fixture, posiciones y resultados de ${tournament.name} ${category.name}.`,
  };
}

export default async function TournamentCategoryPage({
  params,
}: TournamentCategoryPageProps) {
  const { slug, categorySlug } = await params;
  const tournament = await getPublicFootballTournamentWithCategoriesBySlug(slug);

  if (!tournament) {
    notFound();
  }

  const selectedTournament = flattenTournamentCategory(tournament, categorySlug);

  if (!selectedTournament) {
    notFound();
  }

  return (
    <>
      <Header />
      <main>
        <SectionShell className="pt-28">
          <Link
            href="/futbol/torneos"
            className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--color-accent)] transition hover:text-[var(--color-accent-strong)]"
          >
            Volver a torneos
          </Link>

          <div className="mt-8 grid gap-6 border-b border-white/8 pb-8 lg:grid-cols-[0.86fr_1.14fr] lg:items-end">
            <div>
              <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-accent)] items-center">
                {tournament.categories.length > 1 ? (
                  <PublicCategoryDropdown
                    tournamentSlug={tournament.slug}
                    categories={tournament.categories}
                    selectedCategorySlug={categorySlug}
                  />
                ) : (
                  <span>{selectedTournament.category}</span>
                )}
                <span className="text-white/30">/</span>
                <span>
                  {footballTournamentFormatLabels[selectedTournament.format]}
                </span>
                <span className="text-white/30">/</span>
                <span>Temporada {selectedTournament.season}</span>
              </div>
              <h1 className="mt-3 text-display-sm">{selectedTournament.name}</h1>
            </div>
            <p className="max-w-2xl text-[var(--color-muted)] lg:justify-self-end">
              {selectedTournament.description ??
                "Fixture, posiciones y resultados públicos del torneo."}
            </p>
          </div>

          <PublicTournamentPanel
            tournament={selectedTournament}
            showHeader={false}
          />
        </SectionShell>
      </main>
      <Footer />
    </>
  );
}
