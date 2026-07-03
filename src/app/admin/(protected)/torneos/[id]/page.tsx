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
  RosterEntryCreateDialog,
  RosterEntryEditDialog,
  RosterEntryRemoveDialog,
  TeamCreatePanel,
  TeamEditDialog,
  TeamRemoveDialog,
  TournamentForm,
  TournamentSettingsDialog,
  BracketGeneratorDialog,
} from "@/components/admin/AdminForms";
import { LeagueMatchesViewer } from "@/components/admin/LeagueMatchesViewer";
import { BracketResultsViewer } from "@/components/admin/BracketResultsViewer";
import { CategoryDropdown } from "@/components/admin/CategoryDropdown";
import {
  CategoryCreateDialog,
  CategoryEditDialog,
  CategoryRemoveDialog,
} from "@/components/admin/CategoryForms";
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
  createRosterEntry,
  createTeam,
  createTournamentCategory,
  deleteRosterEntry,
  deleteMatch,
  deleteTournament,
  deleteTournamentCategory,
  generateLeagueFixture,
  generateBracketFixture,
  removeTeamFromTournament,
  updateMatch,
  updateMatchResult,
  updateRosterEntry,
  updateTeam,
  updateTournament,
  updateTournamentCategory,
} from "@/features/football-tournaments/actions";
import {
  getAdminAvailableTeams,
  getAdminAvailablePlayers,
  formatMatchResultRosterEntry,
  getAdminTournamentCategories,
  getAdminMatches,
  getAdminRosterEntries,
  getAdminTeams,
  getAdminTournament,
  getAdminViewers,
  getTournamentAuditEvents,
  type AdminMatch,
  type AdminPlayer,
  type AdminRosterEntry,
  type AdminTeam,
  type AdminTournament,
  type AdminTournamentCategory,
  type AuditEvent,
  type StaffProfile,
} from "@/features/football-tournaments/data";
import type { FootballMatchStatus } from "@/features/football-tournaments/types";

type TournamentWorkspacePageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams?: Promise<{
    category?: string | string[];
    tab?: string | string[];
  }>;
};

type TournamentWorkspaceTab =
  | "resumen"
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
    tab === "equipos" ||
    tab === "partidos" ||
    tab === "actividad"
  ) {
    return tab;
  }

  return "resumen";
}

function tabHref(
  tournamentId: string,
  tab: TournamentWorkspaceTab,
  category: AdminTournamentCategory | null,
) {
  const params = new URLSearchParams();
  if (tab !== "resumen") params.set("tab", tab);
  if (category) params.set("category", category.slug);

  const qs = params.toString();
  return `/admin/torneos/${tournamentId}${qs ? `?${qs}` : ""}`;
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
  selectedCategory,
  tournamentId,
}: {
  activeTab: TournamentWorkspaceTab;
  selectedCategory: AdminTournamentCategory | null;
  tournamentId: string;
}) {
  return (
    <nav
      aria-label="Secciones del torneo"
      className="grid gap-1 rounded-[0.95rem] border border-white/10 bg-white/[0.035] p-1 shadow-[inset_0_1px_0_rgb(255_255_255_/_0.035)] sm:grid-cols-4"
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;

        return (
          <Link
            key={tab.id}
            href={tabHref(tournamentId, tab.id, selectedCategory)}
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

async function renderSummaryTab(
  tournament: AdminTournament,
  selectedCategory: AdminTournamentCategory | null,
  categories: AdminTournamentCategory[],
) {
  const categoryId = selectedCategory?.id;
  const [teams, matches] = await Promise.all([
    getAdminTeams(tournament.id, categoryId),
    getAdminMatches(tournament.id, categoryId),
  ]);
  const completedMatches = matches.filter(isMatchCompleted);
  const pendingMatches = matches.filter(
    (match) => match.status !== "completed" && match.status !== "cancelled",
  );
  const nextMatch = pendingMatches.reduce<AdminMatch | null>((nearest, match: AdminMatch) => {
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
            href: tabHref(tournament.id, "equipos", selectedCategory),
            tone: "warning",
          },
        ]
      : matches.length === 0
        ? [
            {
              title: "Crear fixture",
              description: `${tournament.name} todavía no tiene partidos cargados.`,
              href: tabHref(tournament.id, "partidos", selectedCategory),
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
                href: tabHref(tournament.id, "partidos", selectedCategory),
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
        </div>
      </AdminPanel>

      {/* Category Management Block */}
      <AdminPanel className="lg:col-span-2 p-5 sm:p-6 mt-2">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-accent)] sm:text-sm">
              Categorías
            </p>
            <h2 className="mt-2 text-xl font-semibold text-white">
              Gestión de categorías
            </h2>
          </div>
          <CategoryCreateDialog action={createTournamentCategory.bind(null, tournament.id)} />
        </div>

        {categories.length === 0 ? (
          <div className="mt-5">
            <p className="text-sm text-[var(--color-muted)] pb-2">
              No hay categorías creadas. Creá la primera para empezar a cargar equipos.
            </p>
          </div>
        ) : (
          <div className="mt-5">
            <AdminTableHeader className="grid-cols-[1fr_0.8fr_1fr_11rem]">
              <span>Categoría</span>
              <span>Estado</span>
              <span>Fechas</span>
              <span className="text-right">Acciones</span>
            </AdminTableHeader>

            <div className="divide-y divide-white/10">
              {categories.map((category) => (
                <article
                  key={category.id}
                  className="group grid gap-4 px-5 py-4 transition hover:bg-white/[0.035] lg:grid-cols-[1fr_0.8fr_1fr_11rem] lg:items-center"
                >
                  <AdminMobileField label="Categoría">
                    <span className="text-base font-semibold text-white">
                      {category.name}
                    </span>
                  </AdminMobileField>

                  <AdminMobileField label="Estado">
                    <AdminStatusPill tone={category.status === "active" || category.status === "published" ? "accent" : "muted"}>
                      {category.status === "active" ? "Activa" : category.status === "published" ? "Publicada" : category.status === "draft" ? "Borrador" : category.status === "archived" ? "Archivada" : category.status}
                    </AdminStatusPill>
                  </AdminMobileField>

                  <AdminMobileField label="Fechas">
                    {category.startsAt || category.endsAt ? (
                      <span className="text-sm text-[var(--color-muted)]">
                        {category.startsAt ? new Date(category.startsAt).toLocaleDateString("es-AR") : "Sin inicio"} -{" "}
                        {category.endsAt ? new Date(category.endsAt).toLocaleDateString("es-AR") : "Sin fin"}
                      </span>
                    ) : (
                      <span className="text-sm text-white/30">Sin fechas</span>
                    )}
                  </AdminMobileField>

                  <div className="flex items-center gap-2 lg:justify-self-end">
                    <CategoryEditDialog category={category} action={updateTournamentCategory.bind(null, tournament.id, category.id)} />
                    <CategoryRemoveDialog categoryName={category.name} action={deleteTournamentCategory.bind(null, tournament.id, category.id)} />
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}
      </AdminPanel>
    </section>
  );
}

function TeamsTab({
  tournament,
  selectedCategory,
  teams,
  availableTeams,
  availablePlayers,
  rosterEntries,
}: {
  tournament: AdminTournament;
  selectedCategory: AdminTournamentCategory | null;
  teams: AdminTeam[];
  availableTeams: Pick<AdminTeam, "id" | "name" | "shortName">[];
  availablePlayers: AdminPlayer[];
  rosterEntries: AdminRosterEntry[];
}) {
  const createTeamAction = createTeam.bind(null, tournament.id, selectedCategory?.id as string);
  const getRosterDisplayName = (entry: AdminRosterEntry) =>
    entry.player.publicName ??
    `${entry.player.firstName} ${entry.player.lastName}`.trim();

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
              const teamRosterEntries = rosterEntries.filter(
                (entry) => entry.teamId === team.id,
              );
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
                    <div className="mt-5 rounded-[0.8rem] border border-white/10 bg-white/[0.025] p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-accent)]">
                          Plantel
                        </p>
                        <RosterEntryCreateDialog
                          action={createRosterEntry.bind(
                            null,
                            tournament.id,
                            selectedCategory?.id as string,
                            team.id,
                          )}
                          availablePlayers={availablePlayers}
                          teamName={team.name}
                        />
                      </div>

                      {teamRosterEntries.length > 0 ? (
                        <div className="mt-3 grid gap-2">
                          {teamRosterEntries.map((entry) => (
                            <div
                              key={entry.id}
                              className="grid gap-2 rounded-[0.7rem] border border-white/8 bg-black/10 p-3 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center"
                            >
                              <span className="text-sm font-semibold text-white/72">
                                {entry.shirtNumber !== null
                                  ? `#${entry.shirtNumber}`
                                  : "S/N"}
                              </span>
                              <span className="min-w-0 truncate text-sm font-semibold text-white">
                                {getRosterDisplayName(entry)}
                              </span>
                              <div className="flex flex-wrap gap-2 sm:justify-end">
                                <RosterEntryEditDialog
                                  action={updateRosterEntry.bind(
                                    null,
                                    tournament.id,
                                    entry.id,
                                  )}
                                  rosterEntry={entry}
                                />
                                <RosterEntryRemoveDialog
                                  action={deleteRosterEntry.bind(
                                    null,
                                    tournament.id,
                                    entry.id,
                                  )}
                                  playerName={getRosterDisplayName(entry)}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="mt-3 text-sm text-[var(--color-muted)]">
                          Sin jugadores cargados.
                        </p>
                      )}
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
  selectedCategory,
  teams,
  matches,
  viewers,
  rosterEntries,
}: {
  tournament: AdminTournament;
  selectedCategory: AdminTournamentCategory | null;
  teams: Pick<AdminTeam, "id" | "name">[];
  matches: AdminMatch[];
  viewers: StaffProfile[];
  rosterEntries: ReturnType<typeof formatMatchResultRosterEntry>[];
}) {
  const teamNames = new Map(teams.map((team) => [team.id, team.name]));
  const viewerEmails = new Map(
    viewers.map((viewer) => [viewer.id, viewer.email]),
  );
  const generateFixtureAction = generateLeagueFixture.bind(null, tournament.id, selectedCategory?.id as string);
  const generateBracketAction = generateBracketFixture.bind(null, tournament.id, selectedCategory?.id as string);
  const canGenerateFixture = matches.length === 0;

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
      </div>

      {matches.length > 0 ? (
        tournament.format === "league" ? (
          <LeagueMatchesViewer
            teams={teams}
            matches={matches}
            viewers={viewers}
            rosterEntries={rosterEntries}
            tournamentId={tournament.id}
          />
        ) : tournament.format === "cup" || tournament.format === "league_playoff" ? (
          <div className="flex flex-col gap-8">
            <BracketResultsViewer
              teams={teams}
              matches={matches.filter((m) => m.isKnockout)}
              viewers={viewers}
              rosterEntries={rosterEntries}
              tournamentId={tournament.id}
            />
            {tournament.format === "league_playoff" && (
              <div className="mt-8 border-t border-white/10 pt-8">
                <h3 className="text-xl font-bold text-white mb-6">Fase Regular</h3>
                <LeagueMatchesViewer
                  teams={teams}
                  matches={matches.filter((m) => !m.isKnockout)}
                  viewers={viewers}
                  rosterEntries={rosterEntries}
                  tournamentId={tournament.id}
                />
              </div>
            )}
          </div>
        ) : (
          <div className="text-white/50">Formato de torneo no soportado</div>
        )
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
            canGenerateFixture ? (
              tournament.format === "cup" || tournament.format === "league_playoff" ? (
                <BracketGeneratorDialog
                  action={generateBracketAction}
                  teams={teams}
                />
              ) : (
                <FixtureGeneratorDialog
                  action={generateFixtureAction}
                  teams={teams}
                />
              )
            ) : null
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

export default async function AdminTournamentWorkspacePage({
  params,
  searchParams,
}: TournamentWorkspacePageProps) {
  const [{ id }, resolvedSearchParams] = await Promise.all([
    params,
    searchParams ?? Promise.resolve(undefined),
  ]);
  const [tournament, activeTab, categories] = await Promise.all([
    getAdminTournament(id),
    Promise.resolve(normalizeTab(resolvedSearchParams?.tab)),
    getAdminTournamentCategories(id),
  ]);

  if (!tournament) {
    notFound();
  }

  const selectedCategory = categories.find((c: AdminTournamentCategory) => c.slug === resolvedSearchParams?.category) ?? categories[0] ?? null;

  const renderTournamentTabContent = async () => {
    if (activeTab === "equipos") {
      if (!selectedCategory) {
        return (
          <AdminEmptyState
            eyebrow="Sin categorías"
            title="Este torneo todavía no tiene categorías."
            description="Creá categorías en el Resumen para poder cargar equipos."
          />
        );
      }
      const [teams, availableTeams, availablePlayers, rosterEntries] = await Promise.all([
        getAdminTeams(tournament.id, selectedCategory.id),
        getAdminAvailableTeams(tournament.id, selectedCategory.id),
        getAdminAvailablePlayers(tournament.id, selectedCategory.id),
        getAdminRosterEntries(tournament.id, selectedCategory.id),
      ]);
      return (
        <TeamsTab
          selectedCategory={selectedCategory}
          tournament={tournament}
          teams={teams}
          availableTeams={availableTeams}
          availablePlayers={availablePlayers}
          rosterEntries={rosterEntries}
        />
      );
    }

    if (activeTab === "partidos") {
      if (!selectedCategory) {
        return (
          <AdminEmptyState
            eyebrow="Sin categorías"
            title="Este torneo todavía no tiene categorías."
            description="Creá categorías en el Resumen para poder generar partidos."
          />
        );
      }
      const [teams, matches, viewers, rosterEntries] = await Promise.all([
        getAdminTeams(tournament.id, selectedCategory.id),
        getAdminMatches(tournament.id, selectedCategory.id),
        getAdminViewers(),
        getAdminRosterEntries(tournament.id, selectedCategory.id),
      ]);
      return (
        <MatchesTab
          selectedCategory={selectedCategory}
          tournament={tournament}
          teams={teams}
          matches={matches}
          viewers={viewers}
          rosterEntries={rosterEntries.map(formatMatchResultRosterEntry)}
        />
      );
    }

    if (activeTab === "actividad") {
      const events = await getTournamentAuditEvents(tournament.id);
      return <ActivityTab events={events} />;
    }

    return await renderSummaryTab(tournament, selectedCategory, categories);
  };

  const tabContent = await renderTournamentTabContent();

  return (
    <AdminPage>
      <AdminPageHeader
        eyebrow="Workspace de torneo"
        title={tournament.name}
        description="Gestioná datos, equipos, fixture y resultados desde un mismo lugar."
        backHref="/admin/torneos"
        backLabel="Torneos"
        renderActions={() => (
          <div className="flex flex-wrap items-center gap-2">
            {categories.length > 0 && selectedCategory ? (
              <CategoryDropdown categories={categories} selectedCategory={selectedCategory} />
            ) : null}
            <TournamentSettingsDialog
              tournament={tournament}
              updateAction={updateTournament.bind(null, tournament.id)}
              deleteAction={deleteTournament.bind(null, tournament.id, tournament.name)}
            />
          </div>
        )}
        renderMeta={() => (
          <AdminStatusPill tone={tournament.status === "draft" ? "muted" : "accent"}>
            {tournament.status === "draft" ? "Borrador" : "En gestión"}
          </AdminStatusPill>
        )}
      />

      <TournamentTabs activeTab={activeTab} selectedCategory={selectedCategory} tournamentId={tournament.id} />

      {tabContent}
    </AdminPage>
  );
}
