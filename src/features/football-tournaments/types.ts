export const footballTournamentStatuses = [
  "draft",
  "published",
  "active",
  "completed",
  "archived",
] as const;

export const footballMatchStatuses = [
  "scheduled",
  "completed",
  "postponed",
  "cancelled",
] as const;

export type FootballTournamentStatus =
  (typeof footballTournamentStatuses)[number];

export type FootballMatchStatus = (typeof footballMatchStatuses)[number];

export type FootballTeam = {
  id: string;
  name: string;
  shortName: string | null;
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
