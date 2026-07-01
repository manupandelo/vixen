export const footballTournamentStatuses = [
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

export const staffRoles = ["admin", "viewer"] as const;

export type FootballTournamentStatus =
  (typeof footballTournamentStatuses)[number];

export type FootballTournamentFormat =
  (typeof footballTournamentFormats)[number];

export const footballTournamentFormatLabels = {
  league: "Liga",
  cup: "Copa",
  league_playoff: "Liga con playoff",
} satisfies Record<FootballTournamentFormat, string>;

export type FootballMatchStatus = (typeof footballMatchStatuses)[number];

export type StaffRole = (typeof staffRoles)[number];

export type StaffStatus = "active" | "suspended";

export type FootballTeam = {
  id: string;
  name: string;
  shortName: string | null;
  photoUrl: string | null;
};

export type FootballMatchForStandings = {
  id: string;
  homeTeamId: string;
  awayTeamId: string;
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
  format: FootballTournamentFormat;
  status: FootballTournamentStatus;
  startsAt: string | null;
  endsAt: string | null;
  description: string | null;
  teams: FootballTeam[];
  matches: PublicFootballMatch[];
  standings: StandingRow[];
};

export type PublicFootballMatch = FootballMatchForStandings & {
  roundLabel: string;
  scheduledAt: string | null;
  homeTeamName: string;
  awayTeamName: string;
};
