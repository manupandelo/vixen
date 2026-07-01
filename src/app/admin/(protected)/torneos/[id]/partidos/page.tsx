import type { Metadata } from "next";
import { redirect } from "next/navigation";

type AdminTournamentMatchesPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export const metadata: Metadata = {
  title: "Partidos — Vixen Admin",
  description: "Gestión interna de partidos de fútbol.",
};

export default async function AdminTournamentMatchesPage({
  params,
}: AdminTournamentMatchesPageProps) {
  const { id } = await params;

  redirect(`/admin/torneos/${id}?tab=partidos`);
}
