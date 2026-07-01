import type { Metadata } from "next";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import {
  Activity,
  Ban,
  CalendarClock,
  ClipboardCheck,
  Clock3,
  FileText,
  KeyRound,
  Mail,
  ShieldCheck,
} from "lucide-react";

import {
  StaffDeleteDialog,
  StaffReactivateForm,
  StaffRoleForm,
  StaffSuspendDialog,
} from "@/components/admin/AdminStaffForms";
import {
  AdminPage,
  AdminPageHeader,
  AdminPanel,
  AdminStatusPill,
} from "@/components/admin/AdminUI";
import {
  deleteStaffUser,
  reactivateStaffUser,
  suspendStaffUser,
  updateStaffRole,
} from "@/features/football-tournaments/staff-actions";
import {
  getAdminStaffProfileDetail,
  getCurrentAdmin,
  type StaffActivityMatch,
} from "@/features/football-tournaments/data";
import type {
  FootballMatchStatus,
  StaffRole,
  StaffStatus,
} from "@/features/football-tournaments/types";

type AdminUserDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export const metadata: Metadata = {
  title: "Detalle de usuario — Vixen Admin",
  description: "Actividad y permisos internos de usuarios del panel.",
};

const roleLabels: Record<StaffRole, string> = {
  admin: "Administrador",
  viewer: "Veedor",
};

const statusLabels: Record<StaffStatus, string> = {
  active: "Activo",
  suspended: "Suspendido",
};

const matchStatusLabels: Record<FootballMatchStatus, string> = {
  scheduled: "Programado",
  completed: "Finalizado",
  postponed: "Postergado",
  cancelled: "Cancelado",
};

const scheduledAtFormatter = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

function formatScore(match: StaffActivityMatch) {
  if (match.homeScore === null || match.awayScore === null) {
    return `${match.homeTeamName} vs ${match.awayTeamName}`;
  }

  return `${match.homeTeamName} ${match.homeScore} - ${match.awayScore} ${match.awayTeamName}`;
}

function getUserInitial(email: string) {
  return email.trim().charAt(0).toUpperCase() || "U";
}

function formatScheduledAt(value: string | null) {
  if (!value) return "Sin fecha definida";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Fecha inválida";

  return scheduledAtFormatter.format(date);
}

function ActivityCard({
  icon,
  label,
  value,
  helper,
}: {
  icon: ReactNode;
  label: string;
  value: number;
  helper: string;
}) {
  return (
    <div className="rounded-[1rem] border border-white/10 bg-white/[0.025] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/45">
            {label}
          </p>
          <p className="mt-2 text-3xl font-semibold text-white">{value}</p>
        </div>
        <span className="grid size-10 place-items-center rounded-[0.85rem] border border-[var(--color-accent)]/20 bg-[var(--color-accent)]/10 text-[var(--color-accent)]">
          {icon}
        </span>
      </div>
      <p className="mt-3 text-xs leading-5 text-[var(--color-muted)]">
        {helper}
      </p>
    </div>
  );
}

function MatchActivityList({
  title,
  empty,
  matches,
  icon,
  description,
}: {
  title: string;
  empty: string;
  matches: StaffActivityMatch[];
  icon: ReactNode;
  description: string;
}) {
  return (
    <AdminPanel>
      <div className="flex items-start gap-3 border-b border-white/10 px-5 py-4">
        <span className="mt-0.5 grid size-10 shrink-0 place-items-center rounded-[0.85rem] border border-white/10 bg-white/[0.035] text-white/74">
          {icon}
        </span>
        <div>
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <p className="mt-1 text-sm leading-6 text-[var(--color-muted)]">
            {description}
          </p>
        </div>
      </div>

      {matches.length > 0 ? (
        <div className="divide-y divide-white/10">
          {matches.map((match) => (
            <article
              key={match.id}
              className="grid gap-4 px-5 py-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-white">
                    {formatScore(match)}
                  </p>
                  <AdminStatusPill
                    tone={match.status === "completed" ? "accent" : "muted"}
                  >
                    {matchStatusLabels[match.status]}
                  </AdminStatusPill>
                </div>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs leading-5 text-[var(--color-muted)]">
                  <span>{match.tournamentName}</span>
                  <span>{match.roundLabel}</span>
                  <span>{formatScheduledAt(match.scheduledAt)}</span>
                </div>
              </div>
              <span className="w-fit rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs font-semibold text-white/58">
                ID {match.id.slice(0, 8)}
              </span>
            </article>
          ))}
        </div>
      ) : (
        <div className="px-5 py-6">
          <div className="rounded-[0.95rem] border border-dashed border-white/12 bg-white/[0.02] px-4 py-5">
            <p className="text-sm font-semibold text-white">
              Sin movimientos todavía
            </p>
            <p className="mt-1 text-sm leading-6 text-[var(--color-muted)]">
              {empty}
            </p>
          </div>
        </div>
      )}
    </AdminPanel>
  );
}

export default async function AdminUserDetailPage({
  params,
}: AdminUserDetailPageProps) {
  const { id } = await params;
  const [detail, currentAdmin] = await Promise.all([
    getAdminStaffProfileDetail(id),
    getCurrentAdmin(),
  ]);

  if (!detail) {
    notFound();
  }

  const { profile, metrics, assignedMatches, submittedMatches } = detail;
  const isSelf = profile.id === currentAdmin?.id;
  const isSuspended = profile.status === "suspended";
  const roleAction = updateStaffRole.bind(null, profile.id);
  const suspendAction = suspendStaffUser.bind(null, profile.id);
  const reactivateAction = reactivateStaffUser.bind(null, profile.id);
  const deleteAction = deleteStaffUser.bind(null, profile.id, profile.email);

  return (
    <AdminPage>
      <AdminPageHeader
        eyebrow="Usuario"
        title={profile.email}
        description="Revisá permisos, estado y actividad antes de hacer cambios sensibles sobre esta cuenta."
        backHref="/admin/usuarios"
        backLabel="Usuarios"
        renderMeta={() => (
          <div className="flex flex-wrap gap-2">
            <AdminStatusPill tone={isSuspended ? "muted" : "accent"}>
              {profile.role === "admin" ? (
                <ShieldCheck size={14} aria-hidden="true" />
              ) : null}
              {roleLabels[profile.role]}
            </AdminStatusPill>
            <AdminStatusPill tone={isSuspended ? "danger" : "accent"}>
              {statusLabels[profile.status]}
            </AdminStatusPill>
          </div>
        )}
      />

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="grid gap-4">
          <AdminPanel className="p-5 sm:p-6">
            <div className="grid gap-5 lg:grid-cols-[auto_minmax(0,1fr)] lg:items-center">
              <div className="grid size-20 place-items-center rounded-[1.2rem] border border-[var(--color-accent)]/25 bg-[radial-gradient(circle_at_30%_20%,rgba(60,191,113,0.28),rgba(17,22,18,0.95))] text-3xl font-semibold text-white shadow-[0_18px_50px_rgb(60_191_113_/_0.12)]">
                {getUserInitial(profile.email)}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-accent)]">
                  Perfil del acceso
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Mail size={17} className="text-white/45" aria-hidden="true" />
                  <p className="break-all text-xl font-semibold text-white">
                    {profile.email}
                  </p>
                </div>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-muted)]">
                  {profile.role === "admin"
                    ? "Puede gestionar torneos, usuarios, resultados y correcciones."
                    : "Puede cargar resultados finales de los partidos asignados."}
                </p>
              </div>
            </div>

            <dl className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-[0.95rem] border border-white/10 bg-white/[0.025] p-4">
                <dt className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-white/44">
                  <KeyRound size={15} aria-hidden="true" />
                  Identificador
                </dt>
                <dd className="mt-2 break-all text-sm text-white/78">
                  {profile.id}
                </dd>
              </div>
              <div className="rounded-[0.95rem] border border-white/10 bg-white/[0.025] p-4">
                <dt className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-white/44">
                  <Ban size={15} aria-hidden="true" />
                  Suspensión
                </dt>
                <dd className="mt-2 text-sm text-white/78">
                  {profile.suspended_reason ?? "Sin suspensión activa"}
                </dd>
              </div>
            </dl>
          </AdminPanel>

          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-accent)]">
              Resumen operativo
            </p>
            <section className="grid gap-3 md:grid-cols-3">
              <ActivityCard
                icon={<CalendarClock size={18} aria-hidden="true" />}
                label="Asignados"
                value={metrics.assignedMatches}
                helper="Partidos bajo seguimiento de esta cuenta."
              />
              <ActivityCard
                icon={<ClipboardCheck size={18} aria-hidden="true" />}
                label="Resultados"
                value={metrics.submittedResults}
                helper="Resultados finales cargados por este usuario."
              />
              <ActivityCard
                icon={<Clock3 size={18} aria-hidden="true" />}
                label="Pendientes"
                value={metrics.pendingMatches}
                helper="Asignaciones que todavía esperan resultado."
              />
            </section>
          </div>
        </div>

        <AdminPanel className="h-fit p-5 xl:sticky xl:top-24">
          <div className="flex items-start gap-3">
            <span className="grid size-11 place-items-center rounded-[0.95rem] border border-[var(--color-accent)]/22 bg-[var(--color-accent)]/10 text-[var(--color-accent)]">
              <ShieldCheck size={19} aria-hidden="true" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-accent)]">
                Panel de acciones
              </p>
              <h2 className="mt-2 text-xl font-semibold text-white">
                Permisos y estado
              </h2>
              <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
                Los cambios impactan inmediatamente en el acceso al panel.
              </p>
            </div>
          </div>

          {isSelf ? (
            <p className="mt-5 rounded-[0.9rem] border border-white/10 bg-white/[0.03] px-4 py-3 text-sm leading-6 text-white/70">
              Es tu cuenta. Para evitar bloquear el panel, estas acciones quedan
              deshabilitadas.
            </p>
          ) : null}

          <div className="mt-5 grid gap-4">
            <StaffRoleForm
              action={roleAction}
              role={profile.role}
              disabled={isSelf || isSuspended}
            />
            <div className="grid gap-2">
              {isSuspended ? (
                <StaffReactivateForm
                  action={reactivateAction}
                  disabled={isSelf}
                />
              ) : (
                <StaffSuspendDialog
                  action={suspendAction}
                  email={profile.email}
                  disabled={isSelf}
                />
              )}
              <StaffDeleteDialog
                action={deleteAction}
                email={profile.email}
                disabled={isSelf}
              />
            </div>
          </div>
        </AdminPanel>
      </section>

      <MatchActivityList
        title="Resultados cargados"
        empty="Todavía no cargó resultados."
        matches={submittedMatches}
        icon={<Activity size={18} aria-hidden="true" />}
        description="Historial de resultados finales informados desde esta cuenta."
      />

      <MatchActivityList
        title="Partidos asignados"
        empty="No tiene partidos asignados."
        matches={assignedMatches}
        icon={<FileText size={18} aria-hidden="true" />}
        description="Partidos que puede cargar si actúa como veedor."
      />
    </AdminPage>
  );
}
