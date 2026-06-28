import "server-only";

import { redirect } from "next/navigation";
import { cache } from "react";

import { createSupabaseServerClient } from "@/lib/supabase/server";

import { calculateStandings } from "./standings";
import type {
  FootballMatchStatus,
  FootballTournamentStatus,
  PublicFootballMatch,
  PublicFootballTournament,
} from "./types";

type TeamRow = {
  id: string;
  name: string;
  short_name: string | null;
  [key: string]: unknown;
};

type MatchRow = {
  id: string;
  round_label: string;
  scheduled_at: string | null;
  home_team_id: string;
  away_team_id: string;
  home_score: number | null;
  away_score: number | null;
  status: FootballMatchStatus;
  [key: string]: unknown;
};

type TournamentRow = {
  id: string;
  name: string;
  slug: string;
  season: string;
  category: string;
  status: FootballTournamentStatus;
  starts_at: string | null;
  ends_at: string | null;
  description: string | null;
  football_teams: TeamRow[] | null;
  football_matches: MatchRow[] | null;
  [key: string]: unknown;
};

export function formatPublicTournament(
  row: TournamentRow,
): PublicFootballTournament {
  const teams = (row.football_teams ?? []).map((team) => ({
    id: team.id,
    name: team.name,
    shortName: team.short_name,
  }));
  const teamNames = new Map(teams.map((team) => [team.id, team.name]));
  const matches: PublicFootballMatch[] = (row.football_matches ?? []).map(
    (match) => ({
      id: match.id,
      roundLabel: match.round_label,
      scheduledAt: match.scheduled_at,
      homeTeamId: match.home_team_id,
      awayTeamId: match.away_team_id,
      homeScore: match.home_score,
      awayScore: match.away_score,
      status: match.status,
      homeTeamName: teamNames.get(match.home_team_id) ?? "Equipo local",
      awayTeamName: teamNames.get(match.away_team_id) ?? "Equipo visitante",
    }),
  );

  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    season: row.season,
    category: row.category,
    status: row.status,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    description: row.description,
    teams,
    matches,
    standings: calculateStandings(teams, matches),
  };
}

export async function getPublicFootballTournaments() {
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
        status,
        starts_at,
        ends_at,
        description,
        football_teams(id, name, short_name),
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
    .in("status", ["published", "active", "completed"])
    .order("starts_at", { ascending: false });

  if (error) {
    console.error(error);
    return [];
  }

  return (data ?? []).map((row) =>
    formatPublicTournament(row as unknown as TournamentRow),
  );
}

export const getCurrentAdmin = cache(async () => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data } = await supabase
    .from("admin_profiles")
    .select("id, email, role")
    .eq("id", user.id)
    .eq("role", "admin")
    .maybeSingle();

  return data;
});

export async function requireAdmin() {
  const admin = await getCurrentAdmin();

  if (!admin) {
    redirect("/admin/login");
  }

  return admin;
}
