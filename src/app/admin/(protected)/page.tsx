import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  ExternalLink,
  ListChecks,
  Plus,
  Trophy,
  Users,
  ArrowRight,
} from "lucide-react";

import {
  AdminActionLink,
  AdminActionItemList,
  AdminPage,
  AdminPageHeader,
  AdminPanel,
  AdminStatusPill,
  AdminTableHeader,
  AdminMobileField,
} from "@/components/admin/AdminUI";
import {
  getAdminDashboardSummary,
  type AdminDashboardSummary,
} from "@/features/football-tournaments/data";
import type { FootballTournamentStatus } from "@/features/football-tournaments/types";

export const metadata: Metadata = {
  title: "Panel admin — Vixen Club",
  description: "Panel privado para gestionar torneos de fútbol.",
};

const statusLabels: Record<FootballTournamentStatus, string> = {
  draft: "Borrador",
  published: "Publicado",
  active: "Activo",
  completed: "Finalizado",
  archived: "Archivado",
};

const compactDateFormatter = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "short",
});

function formatCompactDate(value: string | null) {
  if (!value) return "Sin fecha";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Sin fecha";

  return compactDateFormatter.format(date);
}

function DashboardMetric({
  label,
  value,
  helper,
  icon,
}: {
  label: string;
  value: string | number;
  helper: string;
  icon: ReactNode;
}) {
  return (
    <div className="group relative overflow-hidden rounded-[1rem] border border-white/5 bg-gradient-to-b from-white/[0.04] to-transparent p-5 shadow-[0_4px_24px_rgb(0_0_0_/_0.15)] transition-all duration-300 hover:border-white/10 hover:shadow-[0_8px_30px_rgb(60_191_113_/_0.1)]">
      {/* Glow effect on hover */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[var(--color-accent)]/[0.12] via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

      <div className="relative z-10 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/50">
            {label}
          </p>
          <p className="mt-3 text-3xl font-bold text-white drop-shadow-sm">{value}</p>
        </div>
        <span className="grid size-11 shrink-0 place-items-center rounded-[0.85rem] border border-[var(--color-accent)]/40 bg-[var(--color-accent)]/15 text-[var(--color-accent)] shadow-[0_0_18px_rgba(60,191,113,0.15)]">
          {icon}
        </span>
      </div>
      <p className="relative z-10 mt-5 text-xs leading-5 text-white/50">
        {helper}
      </p>
    </div>
  );
}

function DailyStatusPanel({ summary }: { summary: AdminDashboardSummary }) {
  const { metrics } = summary;
  const primaryItem = summary.attentionItems[0];
  const status =
    metrics.overdueResults > 0
      ? {
          eyebrow: "Estado del día",
          title: "Hay resultados para cargar",
          description:
            "Priorizá los partidos con fecha vencida para que la tabla pública no quede desactualizada.",
          href: primaryItem?.href ?? "/admin/torneos",
          action: "Revisar pendientes",
          tone: "warning" as const,
        }
      : metrics.totalMatches === 0
        ? {
            eyebrow: "Estado del día",
            title: "Falta armar fixture",
            description:
              "El siguiente avance real es crear partidos para poder cargar resultados y calcular posiciones.",
            href: "/admin/torneos",
            action: "Ir a torneos",
            tone: "neutral" as const,
          }
        : primaryItem
          ? {
              eyebrow: "Estado del día",
              title: "Hay carga pendiente",
              description: primaryItem.description,
              href: primaryItem.href,
              action: "Resolver ahora",
              tone: "neutral" as const,
            }
          : {
              eyebrow: "Estado del día",
              title: "Carga al día",
              description:
                "No hay pendientes críticos. Podés revisar próximos partidos o continuar con torneos recientes.",
              href: "/admin/torneos",
              action: "Ver torneos",
              tone: "good" as const,
            };
  const loadedLabel =
    metrics.totalMatches > 0
      ? `${metrics.completedMatches}/${metrics.totalMatches} resultados`
      : "Sin partidos";
  const progressLabel =
    metrics.totalMatches > 0
      ? `${metrics.resultProgress}% cargado`
      : "Fixture pendiente";
  const toneClass =
    status.tone === "warning"
      ? "border-[var(--color-warm)]/35 bg-[var(--color-warm)]/10 text-[var(--color-warm)]"
      : "border-[var(--color-accent)]/28 bg-[var(--color-accent)]/10 text-[var(--color-accent)]";

  return (
    <AdminPanel className="relative overflow-hidden p-6 sm:p-8 bg-[#0F1411]/80 backdrop-blur-md border border-[var(--color-accent)]/10 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
      {/* Ambient background glow */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[var(--color-accent)]/5 rounded-full blur-[100px] pointer-events-none -translate-y-1/2 translate-x-1/3" />
      
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-center relative z-10">
        <div className="flex gap-5">
          <span
            className={`mt-1 grid size-11 shrink-0 place-items-center rounded-[0.95rem] border ${toneClass}`}
          >
            {status.tone === "warning" ? (
              <AlertTriangle size={20} aria-hidden="true" />
            ) : (
              <CheckCircle2 size={20} aria-hidden="true" />
            )}
          </span>
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--color-accent)] sm:text-sm drop-shadow-sm">
              {status.eyebrow}
            </p>
            <h2 className="mt-2 text-3xl font-black text-white tracking-tight">
              {status.title}
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/60 font-medium">
              {status.description}
            </p>
            <AdminActionLink
              href={status.href}
              className="mt-5 w-fit"
              variant={status.tone === "warning" ? "danger" : "secondary"}
            >
              {status.action}
            </AdminActionLink>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
          <div className="rounded-[0.95rem] border border-white/10 bg-black/16 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/45">
              Progreso
            </p>
            <p className="mt-2 text-xl font-semibold text-white">
              {progressLabel}
            </p>
          </div>
          <div className="rounded-[0.95rem] border border-white/10 bg-black/16 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/45">
              Carga
            </p>
            <p className="mt-2 text-xl font-semibold text-white">
              {loadedLabel}
            </p>
          </div>
        </div>
      </div>
    </AdminPanel>
  );
}

function AttentionList({
  items,
}: {
  items: AdminDashboardSummary["attentionItems"];
}) {
  if (items.length === 0) {
    return (
      <AdminActionItemList
        items={[
          {
            title: "Sin pendientes críticos",
            description: "La carga principal está al día.",
            tone: "accent",
          },
        ]}
      />
    );
  }

  return <AdminActionItemList items={items} />;
}

export default async function AdminDashboardPage() {
  const summary = await getAdminDashboardSummary();
  const { metrics } = summary;
  const nextMatchDate = formatCompactDate(summary.nextMatch?.scheduledAt ?? null);
  const resultLabel =
    metrics.totalMatches > 0
      ? `${metrics.completedMatches}/${metrics.totalMatches}`
      : "0/0";
  const pendingHelper =
    metrics.overdueResults > 0
      ? `${metrics.overdueResults} con fecha vencida`
      : "Sin vencidos por ahora";

  return (
    <AdminPage>
      <AdminPageHeader
        eyebrow="Panel privado"
        title="Torneos de fútbol"
        description="Estado general de torneos, partidos y resultados cargados."
        renderActions={() => (
          <>
            <AdminActionLink
              href="/admin/torneos/nuevo"
              variant="primary"
              icon={<Plus size={18} aria-hidden="true" />}
            >
              Nuevo torneo
            </AdminActionLink>
            <AdminActionLink
              href="/admin/torneos"
              icon={<Trophy size={18} aria-hidden="true" />}
            >
              Ver torneos
            </AdminActionLink>
          </>
        )}
      />

      <DailyStatusPanel summary={summary} />

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <DashboardMetric
          label="Resultados cargados"
          value={resultLabel}
          helper={`${metrics.resultProgress}% del fixture cargado`}
          icon={<CheckCircle2 size={18} aria-hidden="true" />}
        />
        <DashboardMetric
          label="Pendientes"
          value={metrics.pendingResults}
          helper={pendingHelper}
          icon={<ListChecks size={18} aria-hidden="true" />}
        />
        <DashboardMetric
          label="Próxima fecha"
          value={nextMatchDate}
          helper={summary.nextMatch?.roundLabel ?? "No hay partidos futuros"}
          icon={<CalendarClock size={18} aria-hidden="true" />}
        />
        <DashboardMetric
          label="Torneos activos"
          value={metrics.activeTournaments}
          helper={`${metrics.publishedTournaments} publicados · ${metrics.draftTournaments} borradores`}
          icon={<Trophy size={18} aria-hidden="true" />}
        />
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <AdminPanel className="p-5 sm:p-6">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_16rem] lg:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-accent)] sm:text-sm">
                Estado de competencia
              </p>
              <h2 className="mt-3 text-2xl font-semibold text-white">
                {metrics.resultProgress}% de resultados cargados
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-muted)]">
                Se calcula sobre partidos creados y resultados finales
                confirmados. Si falta fixture, aparece como pendiente de carga.
              </p>
            </div>
            <div className="rounded-[1rem] border border-white/10 bg-black/16 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/45">
                Operación
              </p>
              <p className="mt-2 text-2xl font-semibold text-white">
                {metrics.activeViewers} veedores
              </p>
              <p className="mt-1 text-xs leading-5 text-[var(--color-muted)]">
                {metrics.admins} administradores activos en el panel.
              </p>
            </div>
          </div>

          <div className="mt-7">
            <div className="h-3 overflow-hidden rounded-full bg-white/[0.055]">
              <div
                className="h-full rounded-full bg-[var(--color-accent)] transition-[width] duration-500"
                style={{ width: `${metrics.resultProgress}%` }}
              />
            </div>
            <div className="mt-3 flex flex-wrap justify-between gap-3 text-xs font-semibold uppercase tracking-[0.14em] text-white/45">
              <span>{metrics.completedMatches} cargados</span>
              <span>{metrics.totalMatches} partidos</span>
            </div>
          </div>

          {summary.nextMatch ? (
            <Link
              href={`/admin/torneos/${summary.nextMatch.tournamentId}?tab=partidos`}
              className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-[0.95rem] border border-white/10 bg-white/[0.025] p-4 transition hover:border-[var(--color-accent)]/35 hover:bg-white/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-base)]"
            >
              <div>
                <p className="text-sm font-semibold text-white">
                  {summary.nextMatch.tournamentName}
                </p>
                <p className="mt-1 text-sm text-[var(--color-muted)]">
                  {summary.nextMatch.roundLabel}
                </p>
              </div>
              <AdminStatusPill>{nextMatchDate}</AdminStatusPill>
            </Link>
          ) : null}
        </AdminPanel>

        <AdminPanel className="p-5 sm:p-6">
          <div className="mb-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-accent)] sm:text-sm">
              Qué revisar
            </p>
            <h2 className="mt-3 text-xl font-semibold text-white">
              Pendientes accionables
            </h2>
          </div>
          <AttentionList items={summary.attentionItems} />
        </AdminPanel>
      </section>

      <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <AdminPanel className="p-5 sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-accent)] sm:text-sm">
                Continuar
              </p>
              <h2 className="mt-3 text-xl font-semibold text-white">
                Torneos recientes
              </h2>
            </div>
            <Link
              href="/admin/torneos"
              className="text-sm font-semibold uppercase tracking-[0.14em] text-white/58 transition hover:text-[var(--color-accent)]"
            >
              Ver todos
            </Link>
          </div>

          {summary.recentTournaments.length > 0 ? (
            <div className="mt-5">
              <AdminTableHeader className="grid-cols-[1.5fr_0.8fr_0.8fr_7rem]">
                <span>Torneo</span>
                <span>Temporada</span>
                <span>Estado</span>
                <span className="text-right">Acción</span>
              </AdminTableHeader>

              <div className="divide-y divide-white/10">
                {summary.recentTournaments.map((tournament) => (
                  <Link
                    key={tournament.id}
                    href={`/admin/torneos/${tournament.id}`}
                    className="group grid gap-4 px-5 py-5 transition hover:bg-white/[0.035] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-inset lg:grid-cols-[1.5fr_0.8fr_0.8fr_7rem] lg:items-center"
                  >
                    <AdminMobileField label="Torneo">
                      <span className="text-base font-semibold text-white">
                        {tournament.name}
                      </span>
                    </AdminMobileField>

                    <AdminMobileField label="Temporada">
                      <span className="text-sm text-[var(--color-muted)]">
                        {tournament.season}
                      </span>
                    </AdminMobileField>

                    <AdminMobileField label="Estado">
                      <AdminStatusPill>
                        {statusLabels[tournament.status]}
                      </AdminStatusPill>
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
            </div>
          ) : (
            <p className="mt-5 text-sm leading-6 text-[var(--color-muted)]">
              Todavía no hay torneos cargados.
            </p>
          )}
        </AdminPanel>

        <AdminPanel className="p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-accent)] sm:text-sm">
            Accesos
          </p>
          <div className="mt-5 grid gap-3">
            <AdminActionLink
              href="/admin/usuarios"
              icon={<Users size={17} aria-hidden="true" />}
              className="w-full"
            >
              Gestionar usuarios
            </AdminActionLink>
            <AdminActionLink
              href="/futbol"
              icon={<ExternalLink size={17} aria-hidden="true" />}
              className="w-full"
            >
              Ver página fútbol
            </AdminActionLink>
          </div>
        </AdminPanel>
      </section>
    </AdminPage>
  );
}
