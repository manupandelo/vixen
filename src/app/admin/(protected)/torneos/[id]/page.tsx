import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  BarChart3,
  CalendarClock,
  History,
  Settings2,
  Users,
  type LucideIcon,
} from "lucide-react";

import {
  DeleteTournamentForm,
  FixtureGeneratorDialog,
  MatchCreateDialog,
  MatchDeleteDialog,
  MatchEditDialog,
  MatchResultForm,
  MatchViewerAssignmentForm,
  TeamCreatePanel,
  TeamEditDialog,
  TeamRemoveDialog,
  TournamentForm,
} from "@/components/admin/AdminForms";
import {
  AdminActionItemList,
  AdminEmptyState,
  AdminMetric,
  AdminMobileField,
  AdminPage,
  AdminPageHeader,
  AdminPanel,
  AdminStatusPill,
  AdminTableHeader,
  type AdminActionItem,
} from "@/components/admin/AdminUI";
import {
  assignMatchViewer,
  createMatch,
  createTeam,
  deleteMatch,
  deleteTournament,
  generateLeagueFixture,
  removeTeamFromTournament,
  updateMatch,
  updateMatchResult,
  updateTeam,
  updateTournament,
} from "@/features/football-tournaments/actions";
import {
  getAdminAvailableTeams,
  getAdminMatches,
  getAdminTeams,
  getAdminTournament,
  getAdminViewers,
  getTournamentAuditEvents,
  type AuditEvent,
  type AdminMatch,
  type AdminTeam,
  type AdminTournament,
  type StaffProfile,
} from "@/features/football-tournaments/data";
import type { FootballMatchStatus } from "@/features/football-tournaments/types";

type TournamentWorkspacePageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams?: Promise<{
    tab?: string | string[];
  }>;
};

type TournamentWorkspaceTab =
  | "resumen"
  | "datos"
  | "equipos"
  | "partidos"
  | "actividad";

export const metadata: Metadata = {
  title: "Torneo — Vixen Admin",
  description: "Workspace interno para gestionar un torneo de fútbol.",
};

const tabs: Array<{
  id: TournamentWorkspaceTab;
  label: string;
  icon: LucideIcon;
}> = [
  {
    id: "resumen",
    label: "Resumen",
    icon: BarChart3,
  },
  {
    id: "datos",
    label: "Datos",
    icon: Settings2,
  },
  {
    id: "equipos",
    label: "Equipos",
    icon: Users,
  },
  {
    id: "partidos",
    label: "Partidos",
    icon: CalendarClock,
  },
  {
    id: "actividad",
    label: "Actividad",
    icon: History,
  },
];

const matchStatusLabels: Record<FootballMatchStatus, string> = {
  scheduled: "Programado",
  completed: "Finalizado",
  postponed: "Postergado",
  cancelled: "Cancelado",
};

const scheduledAtFormatter = new Intl.DateTimeFormat("es-AR", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "America/Argentina/Buenos_Aires",
});

function normalizeTab(value: string | string[] | undefined): TournamentWorkspaceTab {
  const tab = Array.isArray(value) ? value[0] : value;

  if (
    tab === "datos" ||
    tab === "equipos" ||
    tab === "partidos" ||
    tab === "actividad"
  ) {
    return tab;
  }

  return "resumen";
}

function tabHref(tournamentId: string, tab: TournamentWorkspaceTab) {
  if (tab === "resumen") return `/admin/torneos/${tournamentId}`;

  return `/admin/torneos/${tournamentId}?tab=${tab}`;
}

function formatScheduledAt(value: string | null) {
  if (!value) return "Sin fecha";

  return scheduledAtFormatter.format(new Date(value));
}

function formatScore(
  status: FootballMatchStatus,
  homeScore: number | null,
  awayScore: number | null,
) {
  if (status !== "completed") return "Sin resultado";
  if (homeScore === null || awayScore === null) return "Resultado incompleto";

  return `${homeScore} - ${awayScore}`;
}

function isMatchCompleted(match: AdminMatch) {
  return (
    match.status === "completed" &&
    match.homeScore !== null &&
    match.awayScore !== null
  );
}

function TournamentTabs({
  activeTab,
  tournamentId,
}: {
  activeTab: TournamentWorkspaceTab;
  tournamentId: string;
}) {
  return (
    <nav
      aria-label="Secciones del torneo"
      className="grid gap-1 rounded-[0.95rem] border border-white/10 bg-white/[0.035] p-1 shadow-[inset_0_1px_0_rgb(255_255_255_/_0.035)] sm:grid-cols-5"
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;

        return (
          <Link
            key={tab.id}
            href={tabHref(tournamentId, tab.id)}
            aria-label={tab.label}
            aria-current={isActive ? "page" : undefined}
            className={
              isActive
                ? "inline-flex min-h-11 items-center justify-center gap-2 rounded-[0.72rem] border border-[var(--color-accent)]/35 bg-[var(--color-accent)] text-sm font-semibold text-[#07110a] shadow-[0_12px_30px_rgb(60_191_113_/_0.13)] outline-none"
                : "inline-flex min-h-11 items-center justify-center gap-2 rounded-[0.72rem] border border-transparent px-3 text-sm font-semibold text-white/62 transition hover:bg-white/[0.055] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-base)]"
            }
          >
            <Icon size={16} aria-hidden="true" />
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}

async function renderSummaryTab(tournament: AdminTournament) {
  const [teams, matches] = await Promise.all([
    getAdminTeams(tournament.id),
    getAdminMatches(tournament.id),
  ]);
  const completedMatches = matches.filter(isMatchCompleted);
  const pendingMatches = matches.filter(
    (match) => match.status !== "completed" && match.status !== "cancelled",
  );
  const nextMatch = pendingMatches.reduce<AdminMatch | null>((nearest, match) => {
    if (!match.scheduledAt) return nearest;
    if (!nearest?.scheduledAt) return match;

    return match.scheduledAt < nearest.scheduledAt ? match : nearest;
  }, null);
  const progress =
    matches.length > 0
      ? Math.round((completedMatches.length / matches.length) * 100)
      : 0;
  const nextActionItems: AdminActionItem[] =
    teams.length < 2
      ? [
          {
            title: "Completar equipos",
            description: `${tournament.name} necesita al menos dos equipos para armar partidos.`,
            href: tabHref(tournament.id, "equipos"),
            tone: "warning",
          },
        ]
      : matches.length === 0
        ? [
            {
              title: "Crear fixture",
              description: `${tournament.name} todavía no tiene partidos cargados.`,
              href: tabHref(tournament.id, "partidos"),
              tone: "muted",
            },
          ]
        : nextMatch
          ? [
              {
                title: "Próximo partido",
                description: `${nextMatch.roundLabel} · ${formatScheduledAt(
                  nextMatch.scheduledAt,
                )}`,
                href: tabHref(tournament.id, "partidos"),
                tone: "accent",
              },
            ]
          : [
              {
                title: "La carga está al día",
                description: "No hay partidos pendientes visibles.",
                tone: "accent",
              },
            ];

  return (
    <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <AdminPanel className="p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-accent)] sm:text-sm">
          Estado del torneo
        </p>
        <h2 className="mt-3 text-2xl font-semibold text-white">
          {progress}% de resultados cargados
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-muted)]">
          El resumen junta equipos, fixture y resultados para decidir el
          próximo paso sin cambiar de pantalla.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <AdminMetric label="Equipos" value={teams.length} />
          <AdminMetric label="Partidos" value={matches.length} />
          <AdminMetric label="Pendientes" value={pendingMatches.length} />
        </div>

        <div className="mt-6 h-3 overflow-hidden rounded-full bg-white/[0.055]">
          <div
            className="h-full rounded-full bg-[var(--color-accent)] transition-[width] duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </AdminPanel>

      <AdminPanel className="p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-accent)] sm:text-sm">
          Próximo movimiento
        </p>
        <div className="mt-5 grid gap-3">
          <AdminActionItemList items={nextActionItems} />
          <Link
            href={tabHref(tournament.id, "datos")}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[0.85rem] border border-white/12 bg-white/[0.03] px-4 py-2.5 text-sm font-semibold text-white/78 transition hover:border-[var(--color-accent)] hover:bg-white/[0.06] hover:text-white"
          >
            <Settings2 size={17} aria-hidden="true" />
            Revisar datos del torneo
          </Link>
        </div>
      </AdminPanel>
    </section>
  );
}

function DataTab({ tournament }: { tournament: AdminTournament }) {
  const updateTournamentAction = updateTournament.bind(null, tournament.id);
  const deleteTournamentAction = deleteTournament.bind(
    null,
    tournament.id,
    tournament.name,
  );

  return (
    <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
      <AdminPanel className="p-5 sm:p-7">
        <TournamentForm
          action={updateTournamentAction}
          tournament={tournament}
          submitLabel="Guardar torneo"
        />
      </AdminPanel>
      <AdminPanel className="h-fit p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-accent)] sm:text-sm">
          Publicación
        </p>
        <h2 className="mt-3 text-xl font-semibold text-white">
          Estado y riesgo
        </h2>
        <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
          El estado define si el torneo aparece en la página pública. Borrar es
          una acción permanente.
        </p>
        <div className="mt-5">
          <DeleteTournamentForm
            action={deleteTournamentAction}
            tournamentName={tournament.name}
          />
        </div>
      </AdminPanel>
    </section>
  );
}

function TeamsTab({
  tournament,
  teams,
  availableTeams,
}: {
  tournament: AdminTournament;
  teams: AdminTeam[];
  availableTeams: Pick<AdminTeam, "id" | "name" | "shortName">[];
}) {
  const createTeamAction = createTeam.bind(null, tournament.id);

  return (
    <section className="grid gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-accent)] sm:text-sm">
            Equipos
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white">
            Participantes del torneo
          </h2>
        </div>
        <TeamCreatePanel
          action={createTeamAction}
          availableTeams={availableTeams}
        />
      </div>

      {teams.length > 0 ? (
        <AdminPanel>
          <AdminTableHeader className="grid-cols-[1.1fr_0.8fr_0.8fr_1fr]">
            <span>Equipo</span>
            <span>Capitán</span>
            <span>Teléfono</span>
            <span>Notas privadas</span>
          </AdminTableHeader>

          <div className="divide-y divide-white/10">
            {teams.map((team) => {
              const updateTeamAction = updateTeam.bind(
                null,
                tournament.id,
                team.id,
              );
              const removeTeamAction = removeTeamFromTournament.bind(
                null,
                tournament.id,
                team.id,
              );

              return (
                <article
                  key={team.id}
                  className="grid gap-4 px-5 py-5 lg:grid-cols-[1.1fr_0.8fr_0.8fr_1fr] lg:items-start"
                >
                  <AdminMobileField label="Equipo">
                    <div className="flex min-w-0 items-center gap-4">
                      {team.photoUrl ? (
                        <Image
                          src={team.photoUrl}
                          alt=""
                          width={56}
                          height={56}
                          unoptimized
                          className="size-14 shrink-0 rounded-[0.8rem] object-cover"
                        />
                      ) : (
                        <span className="inline-flex size-14 shrink-0 items-center justify-center rounded-[0.8rem] border border-white/10 bg-white/[0.035] text-lg font-semibold text-white">
                          {team.name.slice(0, 2).toUpperCase()}
                        </span>
                      )}
                      <div className="min-w-0">
                        <h3 className="truncate text-lg font-semibold text-white">
                          {team.name}
                        </h3>
                        <p className="mt-1 text-sm text-[var(--color-muted)]">
                          {team.shortName ?? "Sin nombre corto"}
                        </p>
                      </div>
                    </div>
                  </AdminMobileField>

                  <AdminMobileField label="Capitán">
                    <p className="text-sm text-white/76">
                      {team.captainName ?? "Sin capitán"}
                    </p>
                  </AdminMobileField>

                  <AdminMobileField label="Teléfono">
                    <p className="text-sm text-white/76">
                      {team.contactPhone ?? "Sin teléfono"}
                    </p>
                  </AdminMobileField>

                  <AdminMobileField label="Notas privadas">
                    <p className="text-sm leading-6 text-white/70">
                      {team.notes ?? "Sin notas privadas"}
                    </p>
                    <div className="mt-3 grid gap-2">
                      <TeamEditDialog action={updateTeamAction} team={team} />
                      <TeamRemoveDialog
                        action={removeTeamAction}
                        teamName={team.name}
                      />
                    </div>
                  </AdminMobileField>
                </article>
              );
            })}
          </div>
        </AdminPanel>
      ) : (
        <AdminEmptyState
          eyebrow="Sin equipos"
          title="Todavía no hay equipos cargados."
          description="Creá el primer equipo para poder armar partidos y calcular la tabla del torneo."
          action={
            <TeamCreatePanel
              action={createTeamAction}
              availableTeams={availableTeams}
            />
          }
        />
      )}
    </section>
  );
}

function MatchesTab({
  tournament,
  teams,
  matches,
  viewers,
}: {
  tournament: AdminTournament;
  teams: Pick<AdminTeam, "id" | "name">[];
  matches: AdminMatch[];
  viewers: StaffProfile[];
}) {
  const teamNames = new Map(teams.map((team) => [team.id, team.name]));
  const viewerEmails = new Map(
    viewers.map((viewer) => [viewer.id, viewer.email]),
  );
  const createMatchAction = createMatch.bind(null, tournament.id);
  const generateFixtureAction = generateLeagueFixture.bind(null, tournament.id);
  const canGenerateFixture = tournament.format !== "cup" && matches.length === 0;

  return (
    <section className="grid gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-accent)] sm:text-sm">
            Partidos
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white">
            Fixture y resultados
          </h2>
        </div>
        {matches.length > 0 ? (
          <MatchCreateDialog action={createMatchAction} teams={teams} />
        ) : null}
      </div>

      {matches.length > 0 ? (
        <AdminPanel>
          <AdminTableHeader className="grid-cols-[0.65fr_0.85fr_1.1fr_0.9fr_0.95fr_0.8fr]">
            <span>Ronda</span>
            <span>Fecha</span>
            <span>Partido</span>
            <span>Resultado</span>
            <span>Veedor</span>
            <span>Estado</span>
          </AdminTableHeader>

          <div className="divide-y divide-white/10">
            {matches.map((match) => {
              const assignViewerAction = assignMatchViewer.bind(
                null,
                tournament.id,
                match.id,
              );
              const updateResultAction = updateMatchResult.bind(
                null,
                tournament.id,
                match.id,
              );
              const updateMatchAction = updateMatch.bind(
                null,
                tournament.id,
                match.id,
              );
              const deleteMatchAction = deleteMatch.bind(
                null,
                tournament.id,
                match.id,
              );

              return (
                <article
                  key={match.id}
                  className="grid gap-4 px-5 py-5 lg:grid-cols-[0.65fr_0.85fr_1.1fr_0.9fr_0.95fr_0.8fr] lg:items-start"
                >
                  <AdminMobileField label="Ronda">
                    <p className="text-sm font-semibold text-white">
                      {match.roundLabel}
                    </p>
                    <p className="mt-1 text-xs text-[var(--color-muted)]">
                      ID {match.id.slice(0, 8)}
                    </p>
                  </AdminMobileField>

                  <AdminMobileField label="Fecha">
                    <p className="text-sm text-white/76">
                      {formatScheduledAt(match.scheduledAt)}
                    </p>
                  </AdminMobileField>

                  <AdminMobileField label="Partido">
                    <p className="text-sm text-white/86">
                      {teamNames.get(match.homeTeamId) ?? "Equipo local"} vs{" "}
                      {teamNames.get(match.awayTeamId) ?? "Equipo visitante"}
                    </p>
                  </AdminMobileField>

                  <AdminMobileField label="Resultado">
                    <p className="text-sm font-semibold text-white">
                      {formatScore(
                        match.status,
                        match.homeScore,
                        match.awayScore,
                      )}
                    </p>
                    <MatchResultForm
                      action={updateResultAction}
                      homeScore={match.homeScore}
                      awayScore={match.awayScore}
                    />
                  </AdminMobileField>

                  <AdminMobileField label="Veedor">
                    <MatchViewerAssignmentForm
                      action={assignViewerAction}
                      viewers={viewers}
                      assignedViewerId={match.assignedViewerId}
                    />
                  </AdminMobileField>

                  <AdminMobileField label="Estado">
                    <AdminStatusPill
                      tone={match.status === "completed" ? "accent" : "muted"}
                    >
                      {matchStatusLabels[match.status]}
                    </AdminStatusPill>
                    <p className="text-xs leading-5 text-[var(--color-muted)]">
                      {match.resultLockedAt
                        ? "Resultado bloqueado para veedor"
                        : "Editable por veedor asignado"}
                    </p>
                    <p className="text-xs leading-5 text-white/54">
                      {match.assignedViewerId
                        ? viewerEmails.get(match.assignedViewerId) ??
                          "Veedor asignado"
                        : "Sin veedor"}
                    </p>
                    <div className="mt-3 grid gap-2">
                      <MatchEditDialog
                        action={updateMatchAction}
                        match={match}
                        teams={teams}
                      />
                      <MatchDeleteDialog
                        action={deleteMatchAction}
                        matchLabel={match.roundLabel}
                      />
                    </div>
                  </AdminMobileField>
                </article>
              );
            })}
          </div>
        </AdminPanel>
      ) : (
        <AdminEmptyState
          eyebrow="Sin partidos"
          title="Todavía no hay partidos cargados."
          description={
            canGenerateFixture
              ? "Generá el fixture automáticamente o cargá partidos manuales si el torneo necesita ajustes."
              : "Creá el primer partido cuando el torneo tenga al menos dos equipos."
          }
          action={
            <div className="flex flex-wrap gap-3">
              {canGenerateFixture ? (
                <FixtureGeneratorDialog
                  action={generateFixtureAction}
                  teams={teams}
                />
              ) : null}
              <MatchCreateDialog action={createMatchAction} teams={teams} />
            </div>
          }
        />
      )}
    </section>
  );
}

function ActivityTab({ events }: { events: AuditEvent[] }) {
  return (
    <section className="grid gap-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-accent)] sm:text-sm">
          Auditoría
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-white">
          Historial de cambios
        </h2>
      </div>

      {events.length > 0 ? (
        <AdminPanel>
          <div className="divide-y divide-white/10">
            {events.map((event) => (
              <article
                key={event.id}
                className="grid gap-3 px-5 py-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-white">
                      {event.summary}
                    </p>
                    <AdminStatusPill tone="muted">
                      {event.entityType}
                    </AdminStatusPill>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs leading-5 text-[var(--color-muted)]">
                    <span>{event.actorEmail}</span>
                    <span>{formatScheduledAt(event.createdAt)}</span>
                    <span>ID {event.entityId.slice(0, 8)}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </AdminPanel>
      ) : (
        <AdminEmptyState
          eyebrow="Sin actividad"
          title="Todavía no hay cambios auditados."
          description="Cuando un usuario edite datos, equipos, partidos o resultados, el movimiento va a aparecer acá."
        />
      )}
    </section>
  );
}

async function renderTournamentTabContent({
  activeTab,
  tournament,
}: {
  activeTab: TournamentWorkspaceTab;
  tournament: AdminTournament;
}) {
  if (activeTab === "datos") {
    return <DataTab tournament={tournament} />;
  }

  if (activeTab === "equipos") {
    const [teams, availableTeams] = await Promise.all([
      getAdminTeams(tournament.id),
      getAdminAvailableTeams(tournament.id),
    ]);

    return (
      <TeamsTab
        tournament={tournament}
        teams={teams}
        availableTeams={availableTeams}
      />
    );
  }

  if (activeTab === "partidos") {
    const [teams, matches, viewers] = await Promise.all([
      getAdminTeams(tournament.id),
      getAdminMatches(tournament.id),
      getAdminViewers(),
    ]);

    return (
      <MatchesTab
        tournament={tournament}
        teams={teams}
        matches={matches}
        viewers={viewers}
      />
    );
  }

  if (activeTab === "actividad") {
    const events = await getTournamentAuditEvents(tournament.id);

    return <ActivityTab events={events} />;
  }

  return renderSummaryTab(tournament);
}

export default async function AdminTournamentWorkspacePage({
  params,
  searchParams,
}: TournamentWorkspacePageProps) {
  const [{ id }, resolvedSearchParams] = await Promise.all([
    params,
    searchParams ?? Promise.resolve(undefined),
  ]);
  const [tournament, activeTab] = await Promise.all([
    getAdminTournament(id),
    Promise.resolve(normalizeTab(resolvedSearchParams?.tab)),
  ]);

  if (!tournament) {
    notFound();
  }

  const tabContent = await renderTournamentTabContent({
    activeTab,
    tournament,
  });

  return (
    <AdminPage>
      <AdminPageHeader
        eyebrow="Workspace de torneo"
        title={tournament.name}
        description="Gestioná datos, equipos, fixture y resultados desde un mismo lugar."
        backHref="/admin/torneos"
        backLabel="Torneos"
        renderMeta={() => (
          <AdminStatusPill tone={tournament.status === "draft" ? "muted" : "accent"}>
            {tournament.status === "draft" ? "Borrador" : "En gestión"}
          </AdminStatusPill>
        )}
      />

      <TournamentTabs activeTab={activeTab} tournamentId={tournament.id} />

      {tabContent}
    </AdminPage>
  );
}
