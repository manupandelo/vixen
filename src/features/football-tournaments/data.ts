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

type AdminTournamentRow = {
  id: string;
  name: string;
  slug: string;
  season: string;
  category: string;
  status: FootballTournamentStatus;
  starts_at: string | null;
  ends_at: string | null;
  description?: string | null;
};

export type AdminTournament = {
  id: string;
  name: string;
  slug: string;
  season: string;
  category: string;
  status: FootballTournamentStatus;
  startsAt: string | null;
  endsAt: string | null;
  description: string | null;
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

export function formatPublicTournament(
  row: TournamentRow,
): PublicFootballTournament {
  const teams = (row.football_teams ?? [])
    .map((team) => ({
      id: team.id,
      name: team.name,
      shortName: team.short_name,
    }))
    .sort((left, right) => left.name.localeCompare(right.name, "es"));
  const teamNames = new Map(teams.map((team) => [team.id, team.name]));
  const matches: PublicFootballMatch[] = (row.football_matches ?? [])
    .map((match) => ({
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
    throw new Error("Failed to load public football tournaments.", {
      cause: error,
    });
  }

  return formatPublicTournamentRows((data ?? []) as unknown as TournamentRow[]);
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

function formatAdminTournament(row: AdminTournamentRow): AdminTournament {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    season: row.season,
    category: row.category,
    status: row.status,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    description: row.description ?? null,
  };
}

export async function getAdminTournaments(): Promise<AdminTournament[]> {
  await requireAdmin();

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("football_tournaments")
    .select("id, name, slug, season, category, status, starts_at, ends_at")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as AdminTournamentRow[]).map(formatAdminTournament);
}

export async function getAdminTournament(
  id: string,
): Promise<AdminTournament | null> {
  await requireAdmin();

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("football_tournaments")
    .select(
      "id, name, slug, season, category, status, starts_at, ends_at, description",
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) return null;

  return formatAdminTournament(data as AdminTournamentRow);
}
