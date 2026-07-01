import type { Metadata } from "next";
import { redirect } from "next/navigation";

type AdminTournamentTeamsPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export const metadata: Metadata = {
  title: "Equipos — Vixen Admin",
  description: "Gestión interna de equipos de fútbol.",
};

export default async function AdminTournamentTeamsPage({
  params,
}: AdminTournamentTeamsPageProps) {
  const { id } = await params;

  redirect(`/admin/torneos/${id}?tab=equipos`);
}
