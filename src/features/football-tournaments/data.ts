import "server-only";

import { unstable_cache } from "next/cache";
import { redirect } from "next/navigation";
import { cache } from "react";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabasePublicClient } from "@/lib/supabase/public";

import type { MatchSlot } from "./bracket-progression";
import { calculateStandings } from "./standings";
import type {
  FootballDocumentationStatus,
  FootballMatchStatus,
  FootballRosterEntryStatus,
  FootballTeam,
  FootballTournamentCategoryStatus,
  FootballTournamentFormat,
  FootballTournamentStatus,
  PublicFootballMatch,
  PublicFootballTournament,
  PublicPlayerStat,
  StandingRow,
  StaffRole,
  StaffStatus,
} from "./types";

type TeamRow = {
  id: string;
  name: string;
  short_name: string | null;
  photo_url?: string | null;
  [key: string]: unknown;
};

type MatchRow = {
  id: string;
  round_label: string;
  scheduled_at: string | null;
  home_team_id: string | null;
  away_team_id: string | null;
  home_score: number | null;
  away_score: number | null;
  home_penalty_score?: number | null;
  away_penalty_score?: number | null;
  status: FootballMatchStatus;
  group_id?: string | null;
  next_match_id?: string | null;
  next_match_slot?: string | null;
  football_match_events?: PublicMatchEventRow[] | null;
  [key: string]: unknown;
};

type PublicMatchEventRow = {
  team_id: string;
  player_id: string | null;
  event_type: "goal" | "yellow_card" | "red_card";
  quantity: number;
};

type TournamentTeamRow = {
  football_teams: TeamRow | TeamRow[] | null;
  [key: string]: unknown;
};

type TournamentRow = {
  id: string;
  name: string;
  slug: string;
  season: string;
  category: string;
  format: FootballTournamentFormat;
  status: FootballTournamentStatus;
  starts_at: string | null;
  ends_at: string | null;
  description: string | null;
  football_teams?: TeamRow[] | null;
  football_tournament_teams?: TournamentTeamRow[] | null;
  football_matches: MatchRow[] | null;
  [key: string]: unknown;
};

type TournamentCategoryRow = {
  id: string;
  tournament_id: string;
  name: string;
  slug: string;
  status: FootballTournamentCategoryStatus;
  position: number;
  starts_at: string | null;
  ends_at: string | null;
};

type PublicTournamentCategoryRow = TournamentCategoryRow & {
  football_tournament_teams?: TournamentTeamRow[] | null;
  football_matches?: MatchRow[] | null;
};

type PublicTournamentWithCategoriesRow = {
  id: string;
  name: string;
  slug: string;
  season: string;
  category?: string | null;
  format: FootballTournamentFormat;
  status: FootballTournamentStatus;
  starts_at: string | null;
  ends_at: string | null;
  description: string | null;
  football_tournament_categories?: PublicTournamentCategoryRow[] | null;
  [key: string]: unknown;
};

const publicTournamentWithCategoriesSelect = `
  id,
  name,
  slug,
  season,
  category,
  format,
  status,
  starts_at,
  ends_at,
  description,
  football_tournament_categories(
    id,
    tournament_id,
    name,
    slug,
    status,
    position,
    starts_at,
    ends_at,
    football_tournament_teams!football_tournament_teams_category_id_fkey(
      football_teams(id, name, short_name, photo_url)
    ),
    football_matches!football_matches_category_id_fkey(
      id,
      round_label,
      scheduled_at,
      home_team_id,
      away_team_id,
      home_score,
      away_score,
      home_penalty_score,
      away_penalty_score,
      status,
      group_id,
      next_match_id,
      next_match_slot,
      football_match_events(
        team_id,
        player_id,
        event_type,
        quantity
      )
    )
  )
`;

const publicTournamentSummarySelect = `
  id,
  name,
  slug,
  season,
  category,
  format,
  status,
  starts_at,
  ends_at,
  description,
  football_tournament_categories(
    id,
    tournament_id,
    name,
    slug,
    status,
    position,
    starts_at,
    ends_at,
    football_tournament_teams!football_tournament_teams_category_id_fkey(
      football_teams(id, name, short_name)
    ),
    football_matches!football_matches_category_id_fkey(
      id,
      round_label,
      scheduled_at,
      home_team_id,
      away_team_id,
      home_score,
      away_score,
      home_penalty_score,
      away_penalty_score,
      status,
      group_id,
      next_match_id,
      next_match_slot,
      football_match_events(
        team_id,
        player_id,
        event_type,
        quantity
      )
    )
  )
`;

const publicTournamentStatuses = ["published", "active", "completed"] as const;
const activePublicTournamentStatuses = ["published", "active"] as const;
const publicFootballCacheOptions = {
  revalidate: 60,
  tags: ["football-public"],
};

type AdminTournamentRow = {
  id: string;
  name: string;
  slug: string;
  season: string;
  category: string;
  format: FootballTournamentFormat;
  status: FootballTournamentStatus;
  starts_at: string | null;
  ends_at: string | null;
  description?: string | null;
};

type AdminDashboardTournamentTeamRow = {
  team_id: string;
};

type AdminDashboardTournamentRow = AdminTournamentRow & {
  football_tournament_teams: AdminDashboardTournamentTeamRow[] | null;
  football_matches: MatchRow[] | null;
};

type AdminTeamDetailsRow = {
  captain_name: string | null;
  contact_phone: string | null;
  notes: string | null;
};

type AdminTeamRow = {
  id: string;
  name: string;
  short_name: string | null;
  photo_url: string | null;
  football_team_admin_details: AdminTeamDetailsRow | AdminTeamDetailsRow[] | null;
};

type AdminPlayerRow = {
  id: string;
  first_name: string;
  last_name: string;
  public_name: string | null;
  document_number: string | null;
  birth_date: string | null;
  phone: string | null;
  notes: string | null;
};

type AdminRosterEntryRow = {
  id: string;
  tournament_id: string;
  team_id: string;
  player_id: string;
  shirt_number: number | null;
  status: FootballRosterEntryStatus;
  medical_status: FootballDocumentationStatus;
  insurance_status: FootballDocumentationStatus;
  registered_at: string;
  notes: string | null;
  football_players: AdminPlayerRow | AdminPlayerRow[] | null;
};

type AdminRosteredPlayerRow = {
  player_id: string | null;
};

type MatchEventRow = {
  roster_entry_id: string | null;
  player_id: string | null;
  team_id: string;
  event_type: "goal" | "yellow_card" | "red_card";
  quantity: number;
};

type AdminTournamentTeamRow = {
  football_teams: AdminTeamRow | AdminTeamRow[] | null;
};

type AdminMatchRow = {
  id: string;
  category_id: string;
  round_label: string;
  scheduled_at: string | null;
  home_team_id: string;
  away_team_id: string;
  home_score: number | null;
  away_score: number | null;
  home_penalty_score: number | null;
  away_penalty_score: number | null;
  status: FootballMatchStatus;
  assigned_viewer_id: string | null;
  result_locked_at: string | null;
  result_submitted_by: string | null;
  next_match_id?: string | null;
  next_match_slot?: string | null;
  group_id: string | null;
  football_match_events?: MatchEventRow[] | null;
};

type StaffProfileRow = {
  id: string;
  email: string;
  role: StaffRole;
  status: StaffStatus;
  suspended_at: string | null;
  suspended_reason: string | null;
};

type ViewerMatchRow = AdminMatchRow & {
  football_tournaments: {
    id: string;
    name: string;
    format: FootballTournamentFormat;
  } | null;
  home_team: {
    name: string;
  } | null;
  away_team: {
    name: string;
  } | null;
};

type ViewerAssignedMatchRosterRow = {
  match_id: string;
  roster_entry_id: string;
  team_id: string;
  player_id: string;
  shirt_number: number | null;
  first_name: string;
  last_name: string;
  public_name: string | null;
};

type StaffActivityMatchRow = AdminMatchRow & {
  football_tournaments:
    | {
        name: string;
      }
    | {
        name: string;
      }[]
    | null;
  home_team:
    | {
        name: string;
      }
    | {
        name: string;
      }[]
    | null;
  away_team:
    | {
        name: string;
      }
    | {
        name: string;
      }[]
    | null;
};

export type AuditEntityType =
  | "tournament"
  | "team"
  | "match"
  | "viewer_assignment"
  | "match_result";

export type AuditAction =
  | "created"
  | "updated"
  | "deleted"
  | "removed_from_tournament"
  | "assigned"
  | "submitted";

export type AuditEventRow = {
  id: string;
  tournament_id: string | null;
  actor_profile_id: string | null;
  actor_email: string;
  entity_type: AuditEntityType;
  entity_id: string;
  action: AuditAction;
  summary: string;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type AdminTournament = {
  id: string;
  name: string;
  slug: string;
  season: string;
  category: string;
  format: FootballTournamentFormat;
  status: FootballTournamentStatus;
  startsAt: string | null;
  endsAt: string | null;
  description: string | null;
};

export type AdminTournamentCategory = {
  id: string;
  tournamentId: string;
  name: string;
  slug: string;
  status: FootballTournamentCategoryStatus;
  position: number;
  startsAt: string | null;
  endsAt: string | null;
};

export type PublicFootballTournamentCategory = AdminTournamentCategory & {
  teams: FootballTeam[];
  matches: PublicFootballMatch[];
  standings: StandingRow[];
  playerStats?: PublicPlayerStat[];
};

export type PublicFootballTournamentWithCategories = Omit<
  PublicFootballTournament,
  "category" | "teams" | "matches" | "standings" | "categories"
> & {
  categories: PublicFootballTournamentCategory[];
};

export type AdminTeam = {
  id: string;
  name: string;
  shortName: string | null;
  photoUrl: string | null;
  captainName: string | null;
  contactPhone: string | null;
  notes: string | null;
};

export type AdminPlayer = {
  id: string;
  firstName: string;
  lastName: string;
  publicName: string | null;
  documentNumber: string | null;
  birthDate: string | null;
  phone: string | null;
  notes: string | null;
};

export type AdminRosterEntry = {
  id: string;
  tournamentId: string;
  teamId: string;
  playerId: string;
  shirtNumber: number | null;
  status: FootballRosterEntryStatus;
  medicalStatus: FootballDocumentationStatus;
  insuranceStatus: FootballDocumentationStatus;
  registeredAt: string;
  notes: string | null;
  player: AdminPlayer;
};

export type AdminMatch = {
  id: string;
  categoryId: string;
  roundLabel: string;
  scheduledAt: string | null;
  homeTeamId: string | null;
  awayTeamId: string | null;
  homeScore: number | null;
  awayScore: number | null;
  homePenaltyScore: number | null;
  awayPenaltyScore: number | null;
  status: FootballMatchStatus;
  assignedViewerId: string | null;
  resultLockedAt: string | null;
  resultSubmittedBy: string | null;
  nextMatchId?: string | null;
  nextMatchSlot?: MatchSlot | null;
  isKnockout: boolean;
  events: MatchResultEvent[];
};

export type StaffProfile = StaffProfileRow;

export type MatchResultRosterEntry = {
  id: string;
  teamId: string;
  playerId: string;
  shirtNumber: number | null;
  displayName: string;
};

export type MatchResultEvent = {
  rosterEntryId: string | null;
  playerId: string | null;
  teamId: string;
  eventType: "goal" | "yellow_card" | "red_card";
  quantity: number;
};

export type ViewerAssignedMatch = AdminMatch & {
  tournamentId: string;
  tournamentName: string;
  homeTeamName: string;
  awayTeamName: string;
  rosterEntries: MatchResultRosterEntry[];
};

export type StaffActivityMatch = {
  id: string;
  tournamentName: string;
  roundLabel: string;
  scheduledAt: string | null;
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number | null;
  awayScore: number | null;
  status: FootballMatchStatus;
};

export type AuditEvent = {
  id: string;
  tournamentId: string | null;
  actorProfileId: string | null;
  actorEmail: string;
  entityType: AuditEntityType;
  entityId: string;
  action: AuditAction;
  summary: string;
  metadata: Record<string, unknown>;
  createdAt: string;
};

export type StaffProfileDetail = {
  profile: StaffProfile;
  metrics: {
    assignedMatches: number;
    submittedResults: number;
    pendingMatches: number;
  };
  assignedMatches: StaffActivityMatch[];
  submittedMatches: StaffActivityMatch[];
  auditEvents: AuditEvent[];
};

export type AdminDashboardSummary = {
  metrics: {
    totalTournaments: number;
    activeTournaments: number;
    publishedTournaments: number;
    draftTournaments: number;
    totalMatches: number;
    completedMatches: number;
    pendingResults: number;
    overdueResults: number;
    resultProgress: number;
    activeViewers: number;
    admins: number;
  };
  nextMatch: {
    id: string;
    tournamentId: string;
    tournamentName: string;
    roundLabel: string;
    scheduledAt: string;
  } | null;
  recentTournaments: AdminTournament[];
  attentionItems: Array<{
    title: string;
    description: string;
    href: string;
    tone: "accent" | "warning" | "muted";
  }>;
};

export type AdminFixtureStructureState = {
  matchCount: number;
  groupCount: number;
  hasStructure: boolean;
};

function compareNullableIsoDate(
  left: string | null,
  right: string | null,
): number {
  if (left === null && right === null) return 0;
  if (left === null) return 1;
  if (right === null) return -1;

  return left.localeCompare(right);
}

function firstRelatedRow<T>(value: T | T[] | null): T | null {
  if (Array.isArray(value)) return value[0] ?? null;

  return value;
}

function getPublicTournamentTeams(row: TournamentRow): TeamRow[] {
  if (row.football_tournament_teams?.length) {
    return row.football_tournament_teams
      .map((registration) => firstRelatedRow(registration.football_teams))
      .filter((team): team is TeamRow => team !== null);
  }

  return row.football_teams ?? [];
}

function formatPublicTeams(rows: TeamRow[]): FootballTeam[] {
  return rows
    .map((team) => ({
      id: team.id,
      name: team.name,
      shortName: team.short_name,
      photoUrl: team.photo_url ?? null,
    }))
    .sort((left, right) => left.name.localeCompare(right.name, "es"));
}

function formatPublicMatches(
  format: FootballTournamentFormat,
  teams: FootballTeam[],
  matches: MatchRow[] | null | undefined,
): PublicFootballMatch[] {
  const teamNames = new Map(teams.map((team) => [team.id, team.name]));
  const teamShortNames = new Map(teams.map((team) => [team.id, team.shortName]));

  return (matches ?? [])
    .map((match) => ({
      id: match.id,
      roundLabel: match.round_label,
      scheduledAt: match.scheduled_at,
      homeTeamId: match.home_team_id,
      awayTeamId: match.away_team_id,
      homeScore: match.home_score,
      awayScore: match.away_score,
      homePenaltyScore: match.home_penalty_score ?? null,
      awayPenaltyScore: match.away_penalty_score ?? null,
      status: match.status,
      homeTeamName:
        (match.home_team_id ? teamNames.get(match.home_team_id) : null) ??
        "Por definirse",
      awayTeamName:
        (match.away_team_id ? teamNames.get(match.away_team_id) : null) ??
        "Por definirse",
      homeTeamShortName:
        (match.home_team_id ? teamShortNames.get(match.home_team_id) : null) ??
        null,
      awayTeamShortName:
        (match.away_team_id ? teamShortNames.get(match.away_team_id) : null) ??
        null,
      isKnockout:
        format === "cup" ||
        (format === "league_playoff" && match.group_id === null),
      nextMatchId: match.next_match_id ?? null,
      nextMatchSlot: (match.next_match_slot as MatchSlot | null) ?? null,
      events: (match.football_match_events ?? [])
        .filter((event) => event.player_id)
        .map((event) => ({
          playerId: event.player_id as string,
          teamId: event.team_id,
          displayName: "",
          eventType: event.event_type,
          quantity: event.quantity,
        })),
    }))
    .sort((left, right) => {
      const dateOrder = compareNullableIsoDate(
        left.scheduledAt,
        right.scheduledAt,
      );
      if (dateOrder !== 0) return dateOrder;

      const roundOrder = left.roundLabel.localeCompare(
        right.roundLabel,
        "es",
      );
      if (roundOrder !== 0) return roundOrder;

      return left.id.localeCompare(right.id);
    });
}

function getAdminRegisteredTeams(rows: AdminTournamentTeamRow[]): AdminTeamRow[] {
  return rows
    .map((registration) => firstRelatedRow(registration.football_teams))
    .filter((team): team is AdminTeamRow => team !== null);
}

function isResultLoaded(match: MatchRow) {
  return (
    match.status === "completed" &&
    match.home_score !== null &&
    match.away_score !== null
  );
}

function canStillNeedResult(match: MatchRow) {
  return match.status !== "completed" && match.status !== "cancelled";
}

function pluralize(value: number, singular: string, plural: string) {
  return value === 1 ? `${value} ${singular}` : `${value} ${plural}`;
}

function adminTournamentTabHref(
  tournamentId: string,
  tab: "equipos" | "partidos",
) {
  return `/admin/torneos/${tournamentId}?tab=${tab}`;
}

export function formatAdminDashboardSummary(
  tournaments: AdminDashboardTournamentRow[],
  staffProfiles: StaffProfile[],
  now = new Date(),
): AdminDashboardSummary {
  const allMatches = tournaments.flatMap((tournament) =>
    (tournament.football_matches ?? []).map((match) => ({
      ...match,
      tournamentId: tournament.id,
      tournamentName: tournament.name,
    })),
  );
  const completedMatches = allMatches.filter(isResultLoaded);
  const pendingMatches = allMatches.filter(canStillNeedResult);
  const overdueMatches = pendingMatches.filter((match) => {
    if (!match.scheduled_at) return false;

    return new Date(match.scheduled_at).getTime() < now.getTime();
  });
  const unscheduledMatches = pendingMatches.filter((match) => !match.scheduled_at);
  const nowTime = now.getTime();
  const nextMatch = pendingMatches.reduce<
    (typeof pendingMatches)[number] | null
  >((nearest, match) => {
    if (!match.scheduled_at) return nearest;

    if (new Date(match.scheduled_at).getTime() < nowTime) return nearest;
    if (!nearest?.scheduled_at) return match;

    return match.scheduled_at < nearest.scheduled_at ? match : nearest;
  }, null);
  const attentionItems: AdminDashboardSummary["attentionItems"] = [];

  if (overdueMatches.length > 0) {
    const firstOverdue = overdueMatches[0];
    attentionItems.push({
      title: "Cargar resultados pendientes",
      description: `Hay ${pluralize(
        overdueMatches.length,
        "partido pasado",
        "partidos pasados",
      )} sin resultado final.`,
      href: adminTournamentTabHref(firstOverdue.tournamentId, "partidos"),
      tone: "warning",
    });
  }

  if (unscheduledMatches.length > 0) {
    const firstUnscheduled = unscheduledMatches[0];
    attentionItems.push({
      title: "Programar fechas",
      description: `Hay ${pluralize(
        unscheduledMatches.length,
        "partido",
        "partidos",
      )} sin fecha programada.`,
      href: adminTournamentTabHref(firstUnscheduled.tournamentId, "partidos"),
      tone: "muted",
    });
  }

  for (const tournament of tournaments) {
    const teamCount = tournament.football_tournament_teams?.length ?? 0;
    const matchCount = tournament.football_matches?.length ?? 0;

    if (teamCount < 2) {
      attentionItems.push({
        title: "Completar equipos",
        description: `${tournament.name} necesita al menos dos equipos para armar partidos.`,
        href: adminTournamentTabHref(tournament.id, "equipos"),
        tone: "warning",
      });
    }

    if (matchCount === 0) {
      attentionItems.push({
        title: "Crear fixture",
        description: `${tournament.name} todavía no tiene partidos cargados.`,
        href: adminTournamentTabHref(tournament.id, "partidos"),
        tone: "muted",
      });
    }

    if (attentionItems.length >= 4) break;
  }

  return {
    metrics: {
      totalTournaments: tournaments.length,
      activeTournaments: tournaments.filter(
        (tournament) => tournament.status === "active",
      ).length,
      publishedTournaments: tournaments.filter(
        (tournament) => tournament.status === "published",
      ).length,
      draftTournaments: tournaments.filter(
        (tournament) => tournament.status === "draft",
      ).length,
      totalMatches: allMatches.length,
      completedMatches: completedMatches.length,
      pendingResults: pendingMatches.length,
      overdueResults: overdueMatches.length,
      resultProgress:
        allMatches.length > 0
          ? Math.round((completedMatches.length / allMatches.length) * 100)
          : 0,
      activeViewers: staffProfiles.filter(
        (profile) => profile.role === "viewer" && profile.status === "active",
      ).length,
      admins: staffProfiles.filter((profile) => profile.role === "admin")
        .length,
    },
    nextMatch: nextMatch
      ? {
          id: nextMatch.id,
          tournamentId: nextMatch.tournamentId,
          tournamentName: nextMatch.tournamentName,
          roundLabel: nextMatch.round_label,
          scheduledAt: nextMatch.scheduled_at ?? "",
        }
      : null,
    recentTournaments: tournaments.slice(0, 3).map(formatAdminTournament),
    attentionItems: attentionItems.slice(0, 3),
  };
}

/**
 * Junta los eventos de todos los partidos por jugador. El nombre se resuelve
 * después contra la vista pública, que solo expone id y nombre para mostrar.
 */
function aggregatePlayerStats(matches: MatchRow[]): PublicPlayerStat[] {
  const byPlayer = new Map<string, PublicPlayerStat>();

  for (const match of matches ?? []) {
    for (const event of match.football_match_events ?? []) {
      if (!event.player_id) continue;

      const current = byPlayer.get(event.player_id) ?? {
        playerId: event.player_id,
        teamId: event.team_id,
        displayName: "",
        goals: 0,
        yellowCards: 0,
        redCards: 0,
      };

      if (event.event_type === "goal") current.goals += event.quantity;
      if (event.event_type === "yellow_card") {
        current.yellowCards += event.quantity;
      }
      if (event.event_type === "red_card") current.redCards += event.quantity;

      byPlayer.set(event.player_id, current);
    }
  }

  return [...byPlayer.values()];
}

export function formatPublicTournament(
  row: TournamentRow,
): PublicFootballTournament {
  const teams = formatPublicTeams(getPublicTournamentTeams(row));
  const matches = formatPublicMatches(row.format, teams, row.football_matches);

  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    season: row.season,
    category: row.category,
    format: row.format,
    status: row.status,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    description: row.description,
    teams,
    matches,
    standings: calculateStandings(teams, matches),
    playerStats: aggregatePlayerStats(row.football_matches ?? []),
  };
}

function formatTournamentCategoryBase(
  row: TournamentCategoryRow,
): AdminTournamentCategory {
  return {
    id: row.id,
    tournamentId: row.tournament_id,
    name: row.name,
    slug: row.slug,
    status: row.status,
    position: row.position,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
  };
}

export function formatAdminTournamentCategories(
  rows: TournamentCategoryRow[],
): AdminTournamentCategory[] {
  return rows
    .map(formatTournamentCategoryBase)
    .sort((left, right) => left.position - right.position);
}

export function formatPublicTournamentWithCategories(
  row: PublicTournamentWithCategoriesRow,
): PublicFootballTournamentWithCategories {
  const categories = (row.football_tournament_categories ?? [])
    .filter((category) => category.status !== "archived")
    .map((category) => {
      const base = formatTournamentCategoryBase(category);
      const formatted = formatPublicTournament({
        ...row,
        category: category.name,
        football_tournament_teams: category.football_tournament_teams ?? [],
        football_matches: category.football_matches ?? [],
      });

      return {
        ...base,
        teams: formatted.teams,
        matches: formatted.matches,
        standings: formatted.standings,
        playerStats: formatted.playerStats,
      };
    })
    .sort((left, right) => left.position - right.position);

  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    season: row.season,
    format: row.format,
    status: row.status,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    description: row.description,
    categories,
  };
}

export function formatPublicTournamentSummaryWithCategories(
  row: PublicTournamentWithCategoriesRow,
): PublicFootballTournamentWithCategories {
  const categories = (row.football_tournament_categories ?? [])
    .filter((category) => category.status !== "archived")
    .map((category) => {
      const base = formatTournamentCategoryBase(category);
      const teams = formatPublicTeams(
        (category.football_tournament_teams ?? [])
          .map((registration) => firstRelatedRow(registration.football_teams))
          .filter((team): team is TeamRow => team !== null),
      );

      return {
        ...base,
        teams,
        matches: formatPublicMatches(
          row.format,
          teams,
          category.football_matches,
        ),
        standings: [],
      };
    })
    .sort((left, right) => left.position - right.position);

  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    season: row.season,
    format: row.format,
    status: row.status,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    description: row.description,
    categories,
  };
}

function flattenTournamentPrimaryCategory(
  tournament: PublicFootballTournamentWithCategories,
): PublicFootballTournament | null {
  const category = tournament.categories[0];
  if (!category) return null;

  return flattenTournamentCategory(tournament, category.slug);
}

export function flattenTournamentCategory(
  tournament: PublicFootballTournamentWithCategories,
  categorySlug: string,
): PublicFootballTournament | null {
  const category = tournament.categories.find(
    (candidate) => candidate.slug === categorySlug,
  );
  if (!category) return null;

  return {
    id: tournament.id,
    name: tournament.name,
    slug: tournament.slug,
    season: tournament.season,
    category: category.name,
    categorySlug: category.slug,
    format: tournament.format,
    status: tournament.status,
    startsAt: category.startsAt ?? tournament.startsAt,
    endsAt: category.endsAt ?? tournament.endsAt,
    description: tournament.description,
    teams: category.teams,
    matches: category.matches,
    standings: category.standings,
    playerStats: category.playerStats,
    categoriesCount: tournament.categories.length,
    categories: tournament.categories.map((c) => ({
      name: c.name,
      slug: c.slug,
    })),
  };
}

export function formatPublicTournamentRows(
  rows: TournamentRow[],
): PublicFootballTournament[] {
  const tournaments: PublicFootballTournament[] = [];

  for (const row of rows) {
    try {
      tournaments.push(formatPublicTournament(row));
    } catch (error) {
      console.error("Skipping malformed public football tournament row.", {
        id: row.id,
        slug: row.slug,
        name: row.name,
        error,
      });
    }
  }

  return tournaments;
}

export function formatPublicTournamentRowsWithCategories(
  rows: PublicTournamentWithCategoriesRow[],
): PublicFootballTournamentWithCategories[] {
  const tournaments: PublicFootballTournamentWithCategories[] = [];

  for (const row of rows) {
    try {
      tournaments.push(formatPublicTournamentWithCategories(row));
    } catch (error) {
      console.error("Skipping malformed public football tournament row.", {
        id: row.id,
        slug: row.slug,
        name: row.name,
        error,
      });
    }
  }

  return tournaments;
}

function formatPrimaryCategoryTournamentSummaryRows(
  rows: PublicTournamentWithCategoriesRow[],
): PublicFootballTournament[] {
  return rows
    .map(formatPublicTournamentSummaryWithCategories)
    .map(flattenTournamentPrimaryCategory)
    .filter(
      (tournament): tournament is PublicFootballTournament =>
        tournament !== null,
    );
}

async function getPublicFootballTournamentsUncached() {
  const supabase = createSupabasePublicClient();
  const { data, error } = await supabase
    .from("football_tournaments")
    .select(publicTournamentSummarySelect)
    .in("status", [...publicTournamentStatuses])
    .order("starts_at", { ascending: false });

  if (error) {
    throw new Error("Failed to load public football tournaments.", {
      cause: error,
    });
  }

  return formatPrimaryCategoryTournamentSummaryRows(
    (data ?? []) as unknown as PublicTournamentWithCategoriesRow[],
  );
}

export const getPublicFootballTournaments = unstable_cache(
  getPublicFootballTournamentsUncached,
  ["public-football-tournaments"],
  publicFootballCacheOptions,
);

async function getActivePublicFootballTournamentsUncached() {
  const supabase = createSupabasePublicClient();
  const { data, error } = await supabase
    .from("football_tournaments")
    .select(publicTournamentSummarySelect)
    .in("status", [...activePublicTournamentStatuses])
    .order("starts_at", { ascending: false });

  if (error) {
    throw new Error("Failed to load active football tournaments.", {
      cause: error,
    });
  }

  return formatPrimaryCategoryTournamentSummaryRows(
    (data ?? []) as unknown as PublicTournamentWithCategoriesRow[],
  );
}

export const getActivePublicFootballTournaments = unstable_cache(
  getActivePublicFootballTournamentsUncached,
  ["active-public-football-tournaments"],
  publicFootballCacheOptions,
);

async function getPublicFootballTournamentBySlugUncached(slug: string) {
  const supabase = createSupabasePublicClient();
  const { data, error } = await supabase
    .from("football_tournaments")
    .select(publicTournamentWithCategoriesSelect)
    .in("status", [...publicTournamentStatuses])
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    throw new Error("Failed to load public football tournament.", {
      cause: error,
    });
  }

  if (!data) return null;

  return flattenTournamentPrimaryCategory(
    formatPublicTournamentWithCategories(
      data as unknown as PublicTournamentWithCategoriesRow,
    ),
  );
}

export const getPublicFootballTournamentBySlug = unstable_cache(
  getPublicFootballTournamentBySlugUncached,
  ["public-football-tournament-by-slug"],
  publicFootballCacheOptions,
);

/**
 * Completa los nombres de los jugadores desde la vista pública, que expone id y
 * nombre y nada más: la tabla football_players tiene DNI y teléfono.
 */
async function withPlayerNames(
  supabase: ReturnType<typeof createSupabasePublicClient>,
  tournament: PublicFootballTournamentWithCategories,
): Promise<PublicFootballTournamentWithCategories> {
  const playerIds = [
    ...new Set(
      tournament.categories.flatMap((category) => [
        ...(category.playerStats ?? []).map((stat) => stat.playerId),
        ...category.matches.flatMap((match) =>
          (match.events ?? []).map((event) => event.playerId),
        ),
      ]),
    ),
  ];

  if (playerIds.length === 0) return tournament;

  const [namesResult, numbersResult] = await Promise.all([
    supabase
      .from("football_public_player_names")
      .select("id, display_name")
      .in("id", playerIds),
    supabase
      .from("football_public_roster_numbers")
      .select("category_id, player_id, shirt_number")
      .in("player_id", playerIds),
  ]);

  if (namesResult.error) {
    // Sin nombres mostramos el resto del torneo igual.
    console.error("Failed to load public player names.", namesResult.error);
    return tournament;
  }

  const names = new Map(
    (
      (namesResult.data ?? []) as Array<{
        id: string;
        display_name: string | null;
      }>
    ).map((row) => [row.id, row.display_name ?? "Jugador"]),
  );

  // El numero depende de la categoria: un jugador puede usar otro en cada una.
  const numbers = new Map(
    (
      (numbersResult.data ?? []) as Array<{
        category_id: string;
        player_id: string;
        shirt_number: number | null;
      }>
    ).map((row) => [`${row.category_id}:${row.player_id}`, row.shirt_number]),
  );

  return {
    ...tournament,
    categories: tournament.categories.map((category) => ({
      ...category,
      playerStats: (category.playerStats ?? []).map((stat) => ({
        ...stat,
        displayName: names.get(stat.playerId) ?? "Jugador",
      })),
      matches: category.matches.map((match) => ({
        ...match,
        events: (match.events ?? []).map((event) => ({
          ...event,
          displayName: names.get(event.playerId) ?? "Jugador",
          shirtNumber: numbers.get(`${category.id}:${event.playerId}`) ?? null,
        })),
      })),
    })),
  };
}

async function getPublicFootballTournamentWithCategoriesBySlugUncached(
  slug: string,
) {
  const supabase = createSupabasePublicClient();
  const { data, error } = await supabase
    .from("football_tournaments")
    .select(publicTournamentWithCategoriesSelect)
    .in("status", [...publicTournamentStatuses])
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    throw new Error("Failed to load public football tournament.", {
      cause: error,
    });
  }

  if (!data) return null;

  const tournament = formatPublicTournamentWithCategories(
    data as unknown as PublicTournamentWithCategoriesRow,
  );

  return withPlayerNames(supabase, tournament);
}

export const getPublicFootballTournamentWithCategoriesBySlug = unstable_cache(
  getPublicFootballTournamentWithCategoriesBySlugUncached,
  ["public-football-tournament-with-categories-by-slug"],
  publicFootballCacheOptions,
);

async function getCurrentStaffProfile(
  allowedRoles: StaffRole[],
): Promise<StaffProfile | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data } = await supabase
    .from("admin_profiles")
    .select("id, email, role, status, suspended_at, suspended_reason")
    .eq("id", user.id)
    .eq("status", "active")
    .in("role", allowedRoles)
    .maybeSingle();

  return (data as StaffProfileRow | null) ?? null;
}

export const getCurrentAdmin = cache(async () => {
  return getCurrentStaffProfile(["admin"]);
});

export const getCurrentViewer = cache(async () => {
  return getCurrentStaffProfile(["viewer"]);
});

export const getCurrentStaffDashboardPath = cache(async () => {
  const staff = await getCurrentStaffProfile(["admin", "viewer"]);

  if (!staff) return null;

  return staff.role === "viewer" ? "/veedor" : "/admin";
});

export async function requireAdmin() {
  const admin = await getCurrentAdmin();

  if (!admin) {
    redirect("/admin/login");
  }

  return admin;
}

export async function requireViewer() {
  const viewer = await getCurrentViewer();

  if (!viewer) {
    redirect("/admin/login");
  }

  return viewer;
}

function formatAdminTournament(row: AdminTournamentRow): AdminTournament {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    season: row.season,
    category: row.category,
    format: row.format,
    status: row.status,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    description: row.description ?? null,
  };
}

function formatAdminTeam(row: AdminTeamRow): AdminTeam {
  const details = Array.isArray(row.football_team_admin_details)
    ? (row.football_team_admin_details[0] ?? null)
    : row.football_team_admin_details;

  return {
    id: row.id,
    name: row.name,
    shortName: row.short_name,
    photoUrl: row.photo_url,
    captainName: details?.captain_name ?? null,
    contactPhone: details?.contact_phone ?? null,
    notes: details?.notes ?? null,
  };
}

function formatAdminPlayer(row: AdminPlayerRow): AdminPlayer {
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    publicName: row.public_name,
    documentNumber: row.document_number,
    birthDate: row.birth_date,
    phone: row.phone,
    notes: row.notes,
  };
}

function formatMatchResultDisplayName(player: {
  first_name?: string;
  last_name?: string;
  public_name?: string | null;
  firstName?: string;
  lastName?: string;
  publicName?: string | null;
}) {
  const publicName = "public_name" in player ? player.public_name : player.publicName;
  if (publicName) return publicName;

  const firstName = "first_name" in player ? player.first_name : player.firstName;
  const lastName = "last_name" in player ? player.last_name : player.lastName;

  return `${firstName ?? ""} ${lastName ?? ""}`.trim() || "Jugador";
}

export function formatMatchResultRosterEntry(
  rosterEntry: AdminRosterEntry,
): MatchResultRosterEntry {
  return {
    id: rosterEntry.id,
    teamId: rosterEntry.teamId,
    playerId: rosterEntry.playerId,
    shirtNumber: rosterEntry.shirtNumber,
    displayName: formatMatchResultDisplayName(rosterEntry.player),
  };
}

function formatViewerMatchRosterEntry(
  row: ViewerAssignedMatchRosterRow,
): MatchResultRosterEntry {
  return {
    id: row.roster_entry_id,
    teamId: row.team_id,
    playerId: row.player_id,
    shirtNumber: row.shirt_number,
    displayName: formatMatchResultDisplayName(row),
  };
}

export function formatAdminRosterEntries(
  rows: AdminRosterEntryRow[],
): AdminRosterEntry[] {
  return rows
    .map((row) => {
      const player = firstRelatedRow(row.football_players);
      if (!player) return null;

      return {
        id: row.id,
        tournamentId: row.tournament_id,
        teamId: row.team_id,
        playerId: row.player_id,
        shirtNumber: row.shirt_number,
        status: row.status,
        medicalStatus: row.medical_status,
        insuranceStatus: row.insurance_status,
        registeredAt: row.registered_at,
        notes: row.notes,
        player: formatAdminPlayer(player),
      };
    })
    .filter((entry): entry is AdminRosterEntry => entry !== null);
}

export function formatAdminAvailablePlayers(
  rows: AdminPlayerRow[],
  rosteredPlayerIds: Set<string>,
): AdminPlayer[] {
  return rows
    .filter((player) => !rosteredPlayerIds.has(player.id))
    .map(formatAdminPlayer);
}

export function formatAdminRosteredPlayerIds(
  rows: AdminRosteredPlayerRow[],
): Set<string> {
  return new Set(
    rows
      .map((row) => row.player_id)
      .filter((playerId): playerId is string => playerId !== null),
  );
}

export function formatAdminMatch(row: AdminMatchRow): AdminMatch {
  return {
    id: row.id,
    categoryId: row.category_id,
    roundLabel: row.round_label,
    scheduledAt: row.scheduled_at,
    homeTeamId: row.home_team_id,
    awayTeamId: row.away_team_id,
    homeScore: row.home_score,
    awayScore: row.away_score,
    homePenaltyScore: row.home_penalty_score,
    awayPenaltyScore: row.away_penalty_score,
    status: row.status,
    assignedViewerId: row.assigned_viewer_id,
    resultLockedAt: row.result_locked_at,
    resultSubmittedBy: row.result_submitted_by,
    nextMatchId: row.next_match_id ?? null,
    nextMatchSlot: (row.next_match_slot as MatchSlot | null) ?? null,
    isKnockout: row.group_id === null,
    events: (row.football_match_events ?? []).map((event) => ({
      rosterEntryId: event.roster_entry_id,
      playerId: event.player_id,
      teamId: event.team_id,
      eventType: event.event_type,
      quantity: event.quantity,
    })),
  };
}

function formatViewerMatch(row: ViewerMatchRow): ViewerAssignedMatch {
  const tournament = Array.isArray(row.football_tournaments)
    ? (row.football_tournaments[0] ?? null)
    : row.football_tournaments;
  const match = formatAdminMatch(row);
  const isKnockout =
    tournament?.format === "cup" ||
    (tournament?.format === "league_playoff" && match.isKnockout);

  return {
    ...match,
    isKnockout,
    tournamentId: tournament?.id ?? "",
    tournamentName: tournament?.name ?? "Torneo",
    homeTeamName: row.home_team?.name ?? "Equipo local",
    awayTeamName: row.away_team?.name ?? "Equipo visitante",
    rosterEntries: [],
  };
}

function formatStaffActivityMatch(
  row: StaffActivityMatchRow,
): StaffActivityMatch {
  const tournament = Array.isArray(row.football_tournaments)
    ? (row.football_tournaments[0] ?? null)
    : row.football_tournaments;
  const homeTeam = Array.isArray(row.home_team)
    ? (row.home_team[0] ?? null)
    : row.home_team;
  const awayTeam = Array.isArray(row.away_team)
    ? (row.away_team[0] ?? null)
    : row.away_team;

  return {
    id: row.id,
    tournamentName: tournament?.name ?? "Torneo",
    roundLabel: row.round_label,
    scheduledAt: row.scheduled_at,
    homeTeamName: homeTeam?.name ?? "Equipo local",
    awayTeamName: awayTeam?.name ?? "Equipo visitante",
    homeScore: row.home_score,
    awayScore: row.away_score,
    status: row.status,
  };
}

export function formatAuditEvent(row: AuditEventRow): AuditEvent {
  return {
    id: row.id,
    tournamentId: row.tournament_id,
    actorProfileId: row.actor_profile_id,
    actorEmail: row.actor_email,
    entityType: row.entity_type,
    entityId: row.entity_id,
    action: row.action,
    summary: row.summary,
    metadata: row.metadata ?? {},
    createdAt: row.created_at,
  };
}

export async function getAdminTournaments(): Promise<AdminTournament[]> {
  await requireAdmin();

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("football_tournaments")
    .select(
      "id, name, slug, season, category, format, status, starts_at, ends_at",
    )
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as AdminTournamentRow[]).map(formatAdminTournament);
}

export async function getAdminDashboardSummary(): Promise<AdminDashboardSummary> {
  await requireAdmin();

  const supabase = await createSupabaseServerClient();
  const [
    { data: tournamentRows, error: tournamentError },
    { data: staffRows, error: staffError },
  ] = await Promise.all([
    supabase
      .from("football_tournaments")
      .select(
        `
          id,
          name,
          slug,
          season,
          category,
          format,
          status,
          starts_at,
          ends_at,
          description,
          football_tournament_teams(team_id),
          football_matches(
            id,
            round_label,
            scheduled_at,
            home_team_id,
            away_team_id,
            home_score,
            away_score,
            status
          )
        `,
      )
      .order("created_at", { ascending: false }),
    supabase
      .from("admin_profiles")
      .select("id, email, role, status, suspended_at, suspended_reason")
      .order("email", { ascending: true }),
  ]);

  if (tournamentError) {
    throw new Error(tournamentError.message);
  }

  if (staffError) {
    throw new Error(staffError.message);
  }

  return formatAdminDashboardSummary(
    (tournamentRows ?? []) as unknown as AdminDashboardTournamentRow[],
    (staffRows ?? []) as StaffProfileRow[],
  );
}

export async function getAdminTournament(
  id: string,
): Promise<AdminTournament | null> {
  await requireAdmin();

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("football_tournaments")
    .select(
      `
        id,
        name,
        slug,
        season,
        category,
        format,
        status,
        starts_at,
        ends_at,
        description
      `,
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) return null;

  return formatAdminTournament(data as AdminTournamentRow);
}

export const getAdminTournamentCategories = cache(
  async (tournamentId: string): Promise<AdminTournamentCategory[]> => {
    await requireAdmin();

    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("football_tournament_categories")
      .select("id, tournament_id, name, slug, status, position, starts_at, ends_at")
      .eq("tournament_id", tournamentId)
      .order("position", { ascending: true });

    if (error) {
      throw new Error("Failed to load football tournament categories.", {
        cause: error,
      });
    }

    return formatAdminTournamentCategories(
      (data ?? []) as TournamentCategoryRow[],
    );
  },
);

export function resolveSelectedCategory(
  categories: AdminTournamentCategory[],
  categoryIdOrSlug: string | null | undefined,
) {
  if (categoryIdOrSlug) {
    return (
      categories.find(
        (category) =>
          category.id === categoryIdOrSlug ||
          category.slug === categoryIdOrSlug,
      ) ??
      categories[0] ??
      null
    );
  }

  return categories[0] ?? null;
}

export async function getAdminTeams(
  tournamentId: string,
  categoryId?: string,
): Promise<AdminTeam[]> {
  await requireAdmin();

  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("football_tournament_teams")
    .select(
      "football_teams(id, name, short_name, photo_url, football_team_admin_details(captain_name, contact_phone, notes))",
    )
    .eq("tournament_id", tournamentId);

  if (categoryId) {
    query = query.eq("category_id", categoryId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return getAdminRegisteredTeams((data ?? []) as unknown as AdminTournamentTeamRow[])
    .map(formatAdminTeam)
    .sort((left, right) => left.name.localeCompare(right.name, "es"));
}

export async function getAdminAvailableTeams(
  tournamentId: string,
  _categoryId?: string,
): Promise<AdminTeam[]> {
  void _categoryId;
  await requireAdmin();

  const supabase = await createSupabaseServerClient();
  const registrationsQuery = supabase
    .from("football_tournament_teams")
    .select("team_id")
    .eq("tournament_id", tournamentId);

  const [{ data: registrations, error: registrationsError }, { data, error }] =
    await Promise.all([
      registrationsQuery,
      supabase
        .from("football_teams")
        .select(
          "id, name, short_name, photo_url, football_team_admin_details(captain_name, contact_phone, notes)",
        )
        .order("name", { ascending: true }),
    ]);

  if (registrationsError) {
    throw new Error(registrationsError.message);
  }

  if (error) {
    throw new Error(error.message);
  }

  const registeredTeamIds = new Set(
    ((registrations ?? []) as { team_id: string }[]).map(
      (registration) => registration.team_id,
    ),
  );

  const availableTeams: AdminTeam[] = [];

  for (const team of (data ?? []) as AdminTeamRow[]) {
    if (!registeredTeamIds.has(team.id)) {
      availableTeams.push(formatAdminTeam(team));
    }
  }

  return availableTeams;
}

export const getAdminRosterEntries = cache(
  async (
    tournamentId: string,
    categoryId?: string,
  ): Promise<AdminRosterEntry[]> => {
    await requireAdmin();
    const supabase = await createSupabaseServerClient();

    let query = supabase
      .from("football_roster_entries")
      .select(
        "id, tournament_id, team_id, player_id, shirt_number, status, medical_status, insurance_status, registered_at, notes, football_players(id, first_name, last_name, public_name, document_number, birth_date, phone, notes)",
      )
      .eq("tournament_id", tournamentId)
      .order("team_id", { ascending: true })
      .order("shirt_number", { ascending: true, nullsFirst: false });

    if (categoryId) {
      query = query.eq("category_id", categoryId);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error("Failed to load football roster entries.", {
        cause: error,
      });
    }

    return formatAdminRosterEntries((data ?? []) as AdminRosterEntryRow[]);
  },
);

export const getAdminAvailablePlayers = cache(
  async (
    tournamentId: string,
    categoryId?: string,
  ): Promise<AdminPlayer[]> => {
    await requireAdmin();
    const supabase = await createSupabaseServerClient();
    let rosteredPlayersQuery = supabase
      .from("football_roster_entries")
      .select("player_id")
      .eq("tournament_id", tournamentId);

    if (categoryId) {
      rosteredPlayersQuery = rosteredPlayersQuery.eq("category_id", categoryId);
    }

    const [
      { data: players, error: playersError },
      { data: rosteredPlayers, error: rosteredPlayersError },
    ] = await Promise.all([
      supabase
        .from("football_players")
        .select(
          "id, first_name, last_name, public_name, document_number, birth_date, phone, notes",
        )
        .order("last_name", { ascending: true })
        .order("first_name", { ascending: true }),
      rosteredPlayersQuery,
    ]);

    if (playersError) {
      throw new Error("Failed to load football players.", {
        cause: playersError,
      });
    }

    if (rosteredPlayersError) {
      throw new Error("Failed to load football rostered players.", {
        cause: rosteredPlayersError,
      });
    }

    return formatAdminAvailablePlayers(
      (players ?? []) as AdminPlayerRow[],
      formatAdminRosteredPlayerIds(
        (rosteredPlayers ?? []) as AdminRosteredPlayerRow[],
      ),
    );
  },
);

export async function getAdminMatches(
  tournamentId: string,
  categoryId?: string,
): Promise<AdminMatch[]> {
  await requireAdmin();

  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("football_matches")
    .select(
      "id, category_id, round_label, scheduled_at, home_team_id, away_team_id, home_score, away_score, home_penalty_score, away_penalty_score, status, assigned_viewer_id, result_locked_at, result_submitted_by, next_match_id, next_match_slot, group_id, football_match_events(roster_entry_id, player_id, team_id, event_type, quantity)",
    )
    .eq("tournament_id", tournamentId)
    .order("scheduled_at", { ascending: true });

  if (categoryId) {
    query = query.eq("category_id", categoryId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as AdminMatchRow[]).map(formatAdminMatch);
}

export async function getAdminFixtureStructureState(
  tournamentId: string,
  categoryId?: string,
  options: { includeGroups?: boolean } = {},
): Promise<AdminFixtureStructureState> {
  await requireAdmin();

  const supabase = await createSupabaseServerClient();
  let matchesQuery = supabase
    .from("football_matches")
    .select("id", { count: "exact", head: true })
    .eq("tournament_id", tournamentId);

  if (categoryId) {
    matchesQuery = matchesQuery.eq("category_id", categoryId);
  }

  const { count: matchCount, error: matchesError } = await matchesQuery;

  if (matchesError) {
    throw new Error(matchesError.message);
  }

  let groupCount = 0;

  if (options.includeGroups) {
    let groupsQuery = supabase
      .from("football_tournament_groups")
      .select("id", { count: "exact", head: true })
      .eq("tournament_id", tournamentId);

    if (categoryId) {
      groupsQuery = groupsQuery.eq("category_id", categoryId);
    }

    const { count, error } = await groupsQuery;

    if (error) {
      throw new Error(error.message);
    }

    groupCount = count ?? 0;
  }

  const safeMatchCount = matchCount ?? 0;

  return {
    matchCount: safeMatchCount,
    groupCount,
    hasStructure: safeMatchCount > 0 || groupCount > 0,
  };
}

export async function getTournamentAuditEvents(
  tournamentId: string,
): Promise<AuditEvent[]> {
  await requireAdmin();

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("football_audit_events")
    .select(
      "id, tournament_id, actor_profile_id, actor_email, entity_type, entity_id, action, summary, metadata, created_at",
    )
    .eq("tournament_id", tournamentId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as AuditEventRow[]).map(formatAuditEvent);
}

export async function getStaffAuditEvents(
  profileId: string,
): Promise<AuditEvent[]> {
  await requireAdmin();

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("football_audit_events")
    .select(
      "id, tournament_id, actor_profile_id, actor_email, entity_type, entity_id, action, summary, metadata, created_at",
    )
    .eq("actor_profile_id", profileId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as AuditEventRow[]).map(formatAuditEvent);
}

export type AdminPendingMatch = {
  id: string;
  tournamentId: string;
  tournamentName: string;
  categoryName: string | null;
  roundLabel: string;
  homeTeamName: string | null;
  awayTeamName: string | null;
  scheduledAt: string | null;
  isOverdue: boolean;
  href: string;
};

type PendingMatchRow = {
  id: string;
  tournament_id: string;
  round_label: string;
  scheduled_at: string | null;
  football_tournaments: { name: string } | { name: string }[] | null;
  football_tournament_categories: { name: string } | { name: string }[] | null;
  home_team: { name: string } | { name: string }[] | null;
  away_team: { name: string } | { name: string }[] | null;
};

/**
 * Partidos que todavía esperan resultado, ordenados por urgencia:
 * vencidos primero, después por fecha, y al final los que no tienen fecha.
 */
export async function getAdminPendingMatches(
  limit = 8,
): Promise<AdminPendingMatch[]> {
  await requireAdmin();

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("football_matches")
    .select(
      `
        id,
        tournament_id,
        round_label,
        scheduled_at,
        football_tournaments(name),
        football_tournament_categories!football_matches_category_id_fkey(name),
        home_team:football_teams!football_matches_home_team_id_fkey(name),
        away_team:football_teams!football_matches_away_team_id_fkey(name)
      `,
    )
    .in("status", ["scheduled", "postponed"])
    .order("scheduled_at", { ascending: true, nullsFirst: false })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  const now = Date.now();

  return ((data ?? []) as unknown as PendingMatchRow[]).map((row) => ({
    id: row.id,
    tournamentId: row.tournament_id,
    tournamentName: firstRelatedRow(row.football_tournaments)?.name ?? "Torneo",
    categoryName:
      firstRelatedRow(row.football_tournament_categories)?.name ?? null,
    roundLabel: row.round_label,
    homeTeamName: firstRelatedRow(row.home_team)?.name ?? null,
    awayTeamName: firstRelatedRow(row.away_team)?.name ?? null,
    scheduledAt: row.scheduled_at,
    isOverdue: row.scheduled_at
      ? new Date(row.scheduled_at).getTime() < now
      : false,
    href: `/admin/torneos/${row.tournament_id}?tab=partidos`,
  }));
}

export async function getAdminViewers(): Promise<StaffProfile[]> {
  await requireAdmin();

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("admin_profiles")
    .select("id, email, role, status, suspended_at, suspended_reason")
    .eq("role", "viewer")
    .eq("status", "active")
    .order("email", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as StaffProfileRow[];
}

export async function getAdminStaffProfiles(): Promise<StaffProfile[]> {
  await requireAdmin();

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("admin_profiles")
    .select("id, email, role, status, suspended_at, suspended_reason")
    .order("email", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as StaffProfileRow[];
}

export async function getAdminStaffProfileDetail(
  id: string,
): Promise<StaffProfileDetail | null> {
  await requireAdmin();

  const supabase = await createSupabaseServerClient();
  const { data: profile, error: profileError } = await supabase
    .from("admin_profiles")
    .select("id, email, role, status, suspended_at, suspended_reason")
    .eq("id", id)
    .maybeSingle();

  if (profileError) {
    throw new Error(profileError.message);
  }

  if (!profile) return null;

  const matchSelect = `
    id,
    round_label,
    scheduled_at,
    home_team_id,
    away_team_id,
    home_score,
    away_score,
    status,
    assigned_viewer_id,
    result_locked_at,
    result_submitted_by,
    football_tournaments(name),
    home_team:football_teams!football_matches_home_team_id_fkey(name),
    away_team:football_teams!football_matches_away_team_id_fkey(name)
  `;
  const [
    { data: assigned, error: assignedError },
    { data: submitted, error },
    auditEvents,
  ] = await Promise.all([
      supabase
        .from("football_matches")
        .select(matchSelect)
        .eq("assigned_viewer_id", id)
        .order("scheduled_at", { ascending: false }),
      supabase
        .from("football_matches")
        .select(matchSelect)
        .eq("result_submitted_by", id)
        .order("scheduled_at", { ascending: false }),
      getStaffAuditEvents(id),
    ]);

  if (assignedError) {
    throw new Error(assignedError.message);
  }

  if (error) {
    throw new Error(error.message);
  }

  const assignedMatches = ((assigned ?? []) as StaffActivityMatchRow[]).map(
    formatStaffActivityMatch,
  );
  const submittedMatches = ((submitted ?? []) as StaffActivityMatchRow[]).map(
    formatStaffActivityMatch,
  );

  return {
    profile: profile as StaffProfileRow,
    metrics: {
      assignedMatches: assignedMatches.length,
      submittedResults: submittedMatches.length,
      pendingMatches: assignedMatches.filter(
        (match) => match.status !== "completed",
      ).length,
    },
    assignedMatches,
    submittedMatches,
    auditEvents,
  };
}

export async function getViewerAssignedMatches(): Promise<ViewerAssignedMatch[]> {
  const [viewer, supabase] = await Promise.all([
    requireViewer(),
    createSupabaseServerClient(),
  ]);
  const { data, error } = await supabase
    .from("football_matches")
    .select(
      `
        id,
        category_id,
        round_label,
        scheduled_at,
        home_team_id,
        away_team_id,
        home_score,
        away_score,
        home_penalty_score,
        away_penalty_score,
        status,
        assigned_viewer_id,
        result_locked_at,
        result_submitted_by,
        football_tournaments(id, name, format),
        home_team:football_teams!football_matches_home_team_id_fkey(name),
        away_team:football_teams!football_matches_away_team_id_fkey(name)
      `,
    )
    .eq("assigned_viewer_id", viewer.id)
    .order("scheduled_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  const matches = ((data ?? []) as unknown as ViewerMatchRow[]).map(
    formatViewerMatch,
  );
  const { data: rosterData, error: rosterError } = await supabase.rpc(
    "get_viewer_assigned_match_rosters",
  );

  if (rosterError) {
    throw new Error("Failed to load assigned match rosters.", {
      cause: rosterError,
    });
  }

  const rosterByMatch = new Map<string, MatchResultRosterEntry[]>();

  for (const row of (rosterData ?? []) as ViewerAssignedMatchRosterRow[]) {
    const current = rosterByMatch.get(row.match_id) ?? [];
    current.push(formatViewerMatchRosterEntry(row));
    rosterByMatch.set(row.match_id, current);
  }

  return matches.map((match) => ({
    ...match,
    rosterEntries: rosterByMatch.get(match.id) ?? [],
  }));
}
