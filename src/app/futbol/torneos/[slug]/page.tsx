import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import {
  getPublicFootballTournamentWithCategoriesBySlug,
} from "@/features/football-tournaments/data";

type TournamentDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: TournamentDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const tournament = await getPublicFootballTournamentWithCategoriesBySlug(slug);

  if (!tournament) {
    return {
      title: "Torneo no encontrado — Vixen Club",
    };
  }

  return {
    title: `${tournament.name} — Vixen Club`,
    description: `Fixture, posiciones y resultados de ${tournament.name}.`,
  };
}

export default async function TournamentDetailPage({
  params,
}: TournamentDetailPageProps) {
  const { slug } = await params;
  const tournament = await getPublicFootballTournamentWithCategoriesBySlug(slug);

  if (!tournament) {
    notFound();
  }

  const firstCategory = tournament.categories[0];

  if (!firstCategory) {
    notFound();
  }

  redirect(`/futbol/torneos/${tournament.slug}/${firstCategory.slug}`);
}
