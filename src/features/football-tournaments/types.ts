export const footballTournamentStatuses = [
  "draft",
  "published",
  "active",
  "completed",
  "archived",
] as const;

export const footballTournamentCategoryStatuses = [
  "draft",
  "published",
  "active",
  "completed",
  "archived",
] as const;

export const footballTournamentFormats = [
  "league",
  "cup",
  "league_playoff",
] as const;

export const footballMatchStatuses = [
  "scheduled",
  "completed",
  "postponed",
  "cancelled",
] as const;

export const footballRosterEntryStatuses = [
  "active",
  "inactive",
  "suspended",
] as const;

export const footballDocumentationStatuses = [
  "pending",
  "approved",
  "expired",
] as const;

export const staffRoles = ["admin", "viewer"] as const;

export type FootballTournamentStatus =
  (typeof footballTournamentStatuses)[number];

export type FootballTournamentCategoryStatus =
  (typeof footballTournamentCategoryStatuses)[number];

export type FootballTournamentFormat =
  (typeof footballTournamentFormats)[number];

export const footballTournamentCategoryStatusLabels = {
  draft: "Borrador",
  published: "Publicado",
  active: "Activo",
  completed: "Finalizado",
  archived: "Archivado",
} satisfies Record<FootballTournamentCategoryStatus, string>;

export const footballTournamentFormatLabels = {
  league: "Liga",
  cup: "Copa",
  league_playoff: "Zonas + playoff",
} satisfies Record<FootballTournamentFormat, string>;

export type FootballMatchStatus = (typeof footballMatchStatuses)[number];

export type FootballRosterEntryStatus =
  (typeof footballRosterEntryStatuses)[number];

export type FootballDocumentationStatus =
  (typeof footballDocumentationStatuses)[number];

export const footballRosterEntryStatusLabels = {
  active: "Activo",
  inactive: "Baja",
  suspended: "Suspendido",
} satisfies Record<FootballRosterEntryStatus, string>;

export const footballDocumentationStatusLabels = {
  pending: "Pendiente",
  approved: "Aprobado",
  expired: "Vencido",
} satisfies Record<FootballDocumentationStatus, string>;

export type StaffRole = (typeof staffRoles)[number];

export type StaffStatus = "active" | "suspended";

export type FootballTeam = {
  id: string;
  name: string;
  shortName: string | null;
  photoUrl?: string | null;
};

export type FootballTournamentCategory = {
  id: string;
  tournamentId: string;
  name: string;
  slug: string;
  status: FootballTournamentCategoryStatus;
  position: number;
  startsAt: string | null;
  endsAt: string | null;
};

export type FootballMatchForStandings = {
  id: string;
  homeTeamId: string | null;
  awayTeamId: string | null;
  homeScore: number | null;
  awayScore: number | null;
  status: FootballMatchStatus;
};

export type StandingRow = {
  teamId: string;
  teamName: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
};

export type PublicFootballTournament = {
  id: string;
  name: string;
  slug: string;
  season: string;
  category: string;
  categorySlug?: string;
  format: FootballTournamentFormat;
  status: FootballTournamentStatus;
  startsAt: string | null;
  endsAt: string | null;
  description: string | null;
  teams: FootballTeam[];
  matches: PublicFootballMatch[];
  standings: StandingRow[];
  categoriesCount?: number;
};

export type PublicFootballMatch = FootballMatchForStandings & {
  roundLabel: string;
  scheduledAt: string | null;
  homeTeamName: string | null;
  awayTeamName: string | null;
  homeTeamShortName: string | null;
  awayTeamShortName: string | null;
  nextMatchId?: string | null;
  isKnockout: boolean;
};

export type UIFootballMatch = {
  id: string;
  roundLabel: string;
  scheduledAt: string | null;
  homeTeamId: string | null;
  awayTeamId: string | null;
  homeTeamName: string | null;
  awayTeamName: string | null;
  homeScore: number | null;
  awayScore: number | null;
  status: FootballMatchStatus;
  nextMatchId?: string | null;
  isKnockout: boolean;
  assignedViewerId?: string | null;
  resultLockedAt?: string | null;
  resultSubmittedBy?: string | null;
};
