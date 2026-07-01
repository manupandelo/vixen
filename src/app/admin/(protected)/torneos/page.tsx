import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Plus } from "lucide-react";

import {
  AdminActionLink,
  AdminEmptyState,
  AdminMobileField,
  AdminPage,
  AdminPageHeader,
  AdminPanel,
  AdminStatusPill,
  AdminTableHeader,
} from "@/components/admin/AdminUI";
import { getAdminTournaments } from "@/features/football-tournaments/data";
import {
  footballTournamentFormatLabels,
  type FootballTournamentStatus,
} from "@/features/football-tournaments/types";

export const metadata: Metadata = {
  title: "Torneos — Vixen Admin",
  description: "Gestión interna de torneos de fútbol.",
};

const statusLabels: Record<FootballTournamentStatus, string> = {
  draft: "Borrador",
  published: "Publicado",
  active: "Activo",
  completed: "Finalizado",
  archived: "Archivado",
};

function formatDate(value: string | null) {
  if (!value) return "Sin fecha";

  return value.split("-").reverse().join("/");
}

export default async function AdminTournamentsPage() {
  const tournaments = await getAdminTournaments();

  return (
    <AdminPage>
      <AdminPageHeader
        eyebrow="Torneos"
        title="Gestión de torneos"
        description="Creá torneos y mantené sus datos base antes de cargar equipos, partidos y resultados."
        renderActions={() => (
          <AdminActionLink
            href="/admin/torneos/nuevo"
            variant="primary"
            icon={<Plus size={18} aria-hidden="true" />}
          >
            Nuevo torneo
          </AdminActionLink>
        )}
      />

      {tournaments.length > 0 ? (
        <AdminPanel>
          <AdminTableHeader className="grid-cols-[1.35fr_0.65fr_0.7fr_0.7fr_0.8fr_0.45fr]">
            <span>Torneo</span>
            <span>Temporada</span>
            <span>Formato</span>
            <span>Estado</span>
            <span>Fechas</span>
            <span className="text-right">Acción</span>
          </AdminTableHeader>

          <div className="divide-y divide-white/10">
            {tournaments.map((tournament) => (
              <Link
                key={tournament.id}
                href={`/admin/torneos/${tournament.id}`}
                className="group grid gap-4 px-5 py-5 transition hover:bg-white/[0.035] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-inset lg:grid-cols-[1.35fr_0.65fr_0.7fr_0.7fr_0.8fr_0.45fr] lg:items-center"
              >
                <AdminMobileField label="Torneo">
                  <h2 className="text-lg font-semibold text-white">
                    {tournament.name}
                  </h2>
                  <p className="mt-1 text-sm text-[var(--color-muted)]">
                    {tournament.category} · {tournament.slug}
                  </p>
                </AdminMobileField>

                <AdminMobileField label="Temporada">
                  <p className="text-sm text-white/76">{tournament.season}</p>
                </AdminMobileField>

                <AdminMobileField label="Formato">
                  <p className="text-sm text-white/76">
                    {footballTournamentFormatLabels[tournament.format]}
                  </p>
                </AdminMobileField>

                <AdminMobileField label="Estado">
                  <AdminStatusPill>{statusLabels[tournament.status]}</AdminStatusPill>
                </AdminMobileField>

                <AdminMobileField label="Fechas">
                  <p className="text-sm text-white/70">
                    {formatDate(tournament.startsAt)} -{" "}
                    {formatDate(tournament.endsAt)}
                  </p>
                </AdminMobileField>

                <span
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-[0.75rem] border border-white/10 bg-white/[0.025] px-3 py-2 text-sm font-semibold text-white/68 transition group-hover:border-[var(--color-accent)]/45 group-hover:bg-[var(--color-accent)]/10 group-hover:text-white lg:justify-self-end"
                  aria-hidden="true"
                >
                  Abrir
                  <ArrowRight size={16} />
                </span>
              </Link>
            ))}
          </div>
        </AdminPanel>
      ) : (
        <AdminEmptyState
          eyebrow="Sin torneos"
          title="Todavía no hay torneos cargados."
          description="Creá el primer torneo para habilitar la carga de equipos y partidos."
          action={
            <AdminActionLink href="/admin/torneos/nuevo" variant="primary">
              Crear torneo
            </AdminActionLink>
          }
        />
      )}
    </AdminPage>
  );
}
