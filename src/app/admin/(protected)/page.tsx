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
import { PendingMatchesPanel } from "@/components/admin/PendingMatchesPanel";
import {
  getAdminDashboardSummary,
  getAdminPendingMatches,
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
  href,
}: {
  label: string;
  value: string | number;
  helper: string;
  icon: ReactNode;
  href?: string;
}) {
  const className =
    "group relative block overflow-hidden rounded-xl border border-white/10 bg-white/[0.02] p-5 transition-colors duration-300 hover:bg-white/[0.04]";
  const body = (
    <>
      <div className="relative z-10 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/50">
            {label}
          </p>
          <p className="mt-3 text-3xl font-bold text-white tabular-nums">{value}</p>
        </div>
        <span className="grid size-11 shrink-0 place-items-center rounded-xl border border-[var(--color-accent)]/20 bg-[var(--color-accent)]/10 text-[var(--color-accent)]">
          {icon}
        </span>
      </div>
      <p className="relative z-10 mt-5 text-xs leading-5 text-white/50">
        {helper}
      </p>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={className}>
        {body}
      </Link>
    );
  }

  return <div className={className}>{body}</div>;
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
  const toneClass =
    status.tone === "good"
      ? "border-[var(--color-accent)]/28 bg-[var(--color-accent)]/10 text-[var(--color-accent)]"
      : "border-[var(--color-warm)]/35 bg-[var(--color-warm)]/10 text-[var(--color-warm)]";

  return (
    <AdminPanel className="relative overflow-hidden p-6 sm:p-8">
      <div className="relative z-10">
        <div className="flex gap-5">
          <span
            className={`mt-1 grid size-11 shrink-0 place-items-center rounded-xl border ${toneClass}`}
          >
            {status.tone === "good" ? (
              <CheckCircle2 size={20} aria-hidden="true" />
            ) : (
              <AlertTriangle size={20} aria-hidden="true" />
            )}
          </span>
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--color-accent)] sm:text-sm">
              {status.eyebrow}
            </p>
            <h2 className="mt-2 text-2xl font-bold text-white tracking-tight">
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
  const [summary, pendingMatches] = await Promise.all([
    getAdminDashboardSummary(),
    getAdminPendingMatches(),
  ]);
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
          href="#partidos-pendientes"
          label="Pendientes"
          value={metrics.pendingResults}
          helper={pendingHelper}
          icon={<ListChecks size={18} aria-hidden="true" />}
        />
        <DashboardMetric
          href="#partidos-pendientes"
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

      <section
        id="partidos-pendientes"
        className="grid gap-5 scroll-mt-24 xl:grid-cols-[minmax(0,1fr)_24rem]"
      >
        <PendingMatchesPanel matches={pendingMatches} />

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
