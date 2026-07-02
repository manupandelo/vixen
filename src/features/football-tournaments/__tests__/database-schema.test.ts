import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const schemaSql = readFileSync(
  join(process.cwd(), "supabase/schema.sql"),
  "utf8",
);
const categoryMigrationSql = readFileSync(
  join(
    process.cwd(),
    "supabase/migrations/20260702010000_add_football_tournament_categories.sql",
  ),
  "utf8",
);

function extractCreateTableBlock(tableName: string) {
  const start = schemaSql.indexOf(`create table ${tableName}`);
  if (start === -1) return "";

  const nextCreate = schemaSql.indexOf("\ncreate ", start + 1);
  return schemaSql.slice(start, nextCreate === -1 ? undefined : nextCreate);
}

describe("Supabase schema", () => {
  it("allows active staff users to read their own profile during login", () => {
    expect(schemaSql).toContain(
      'create policy "Active staff can read own profile"',
    );
    expect(schemaSql).toContain("id = auth.uid()");
    expect(schemaSql).toContain("role in ('admin', 'viewer')");
    expect(schemaSql).toContain("status = 'active'");
  });

  it("supports bracket fixtures with future matches", () => {
    expect(schemaSql).toContain(
      "next_match_id uuid references public.football_matches(id) on delete set null",
    );
    expect(schemaSql).toContain(
      "home_team_id uuid references public.football_teams(id) on delete restrict",
    );
    expect(schemaSql).toContain(
      "away_team_id uuid references public.football_teams(id) on delete restrict",
    );
    expect(schemaSql).toContain(
      "if new.home_team_id is not null and not exists",
    );
    expect(schemaSql).toContain(
      "if new.away_team_id is not null and not exists",
    );
  });

  it("supports tournament groups for zones plus playoff tournaments", () => {
    expect(schemaSql).toContain(
      "create table public.football_tournament_groups",
    );
    expect(schemaSql).toContain(
      "create table public.football_tournament_group_teams",
    );
    expect(schemaSql).toContain(
      "references public.football_tournament_groups(id, category_id)",
    );
    expect(schemaSql).toContain(
      'create policy "Admins can manage tournament groups"',
    );
    expect(schemaSql).toContain(
      'create policy "Public can read visible tournament groups"',
    );
  });

  it("supports admin-only football players with optional document numbers", () => {
    const playerTable = extractCreateTableBlock("public.football_players");

    expect(schemaSql).toContain("create table public.football_players");
    expect(playerTable).toContain("first_name text not null");
    expect(playerTable).toContain("last_name text not null");
    expect(playerTable).toContain("public_name text");
    expect(playerTable).toContain("document_number text");
    expect(playerTable).toContain("birth_date date");
    expect(playerTable).toContain("phone text");
    expect(playerTable).toContain("notes text");
    expect(schemaSql).toContain(
      'create policy "Admins can manage football players"',
    );
    expect(schemaSql).not.toContain(
      'create policy "Public can read football players"',
    );
  });

  it("supports tournament roster entries with documentation status", () => {
    const rosterTable = extractCreateTableBlock(
      "public.football_roster_entries",
    );

    expect(schemaSql).toContain("create type football_roster_entry_status");
    expect(schemaSql).toContain("create type football_documentation_status");
    expect(schemaSql).toContain("create table public.football_roster_entries");
    expect(rosterTable).toContain(
      "tournament_id uuid not null references public.football_tournaments(id) on delete cascade",
    );
    expect(rosterTable).toContain(
      "category_id uuid not null references public.football_tournament_categories(id) on delete cascade",
    );
    expect(rosterTable).toContain(
      "team_id uuid not null references public.football_teams(id) on delete cascade",
    );
    expect(rosterTable).toContain(
      "player_id uuid not null references public.football_players(id) on delete cascade",
    );
    expect(rosterTable).toContain(
      "constraint football_roster_entries_category_team_fkey",
    );
    expect(rosterTable).toContain(
      "references public.football_tournament_teams(category_id, team_id)",
    );
    expect(rosterTable).toContain("shirt_number integer");
    expect(rosterTable).toContain(
      "status football_roster_entry_status not null default 'active'",
    );
    expect(rosterTable).toContain(
      "medical_status football_documentation_status not null default 'pending'",
    );
    expect(rosterTable).toContain(
      "insurance_status football_documentation_status not null default 'pending'",
    );
    expect(rosterTable).toContain("unique (category_id, player_id)");
    expect(schemaSql).toContain(
      "create unique index football_roster_entries_team_shirt_number_key",
    );
    expect(schemaSql).toContain(
      'create policy "Admins can manage football roster entries"',
    );
    expect(schemaSql).not.toContain("roster_team_belongs_to_tournament");
    expect(schemaSql).not.toContain(
      "football_roster_entries_team_tournament_check",
    );
  });

  it("supports tournament categories as the competitive unit", () => {
    expect(schemaSql).toContain(
      "create type football_tournament_category_status",
    );
    expect(schemaSql).toContain(
      "create table public.football_tournament_categories",
    );

    const categoryTable = extractCreateTableBlock(
      "public.football_tournament_categories",
    );

    expect(categoryTable).toContain(
      "tournament_id uuid not null references public.football_tournaments(id) on delete cascade",
    );
    expect(categoryTable).toContain("name text not null");
    expect(categoryTable).toContain("slug text not null");
    expect(categoryTable).toContain(
      "status public.football_tournament_category_status not null default 'draft'",
    );
    expect(categoryTable).toContain("position integer not null default 0");
    expect(categoryTable).toContain("unique (tournament_id, slug)");
    expect(categoryTable).toContain("unique (tournament_id, position)");
  });

  it("scopes competitive football tables to tournament categories", () => {
    const teamsTable = extractCreateTableBlock(
      "public.football_tournament_teams",
    );
    const groupsTable = extractCreateTableBlock(
      "public.football_tournament_groups",
    );
    const groupTeamsTable = extractCreateTableBlock(
      "public.football_tournament_group_teams",
    );
    const rosterTable = extractCreateTableBlock("public.football_roster_entries");
    const matchesTable = extractCreateTableBlock("public.football_matches");

    expect(teamsTable).toContain(
      "category_id uuid not null references public.football_tournament_categories(id) on delete cascade",
    );
    expect(teamsTable).toContain("primary key (category_id, team_id)");

    expect(groupsTable).toContain(
      "category_id uuid not null references public.football_tournament_categories(id) on delete cascade",
    );
    expect(groupsTable).toContain("unique (category_id, name)");
    expect(groupsTable).toContain("unique (category_id, position)");
    expect(groupsTable).toContain("unique (id, category_id)");

    expect(groupTeamsTable).toContain(
      "category_id uuid not null references public.football_tournament_categories(id) on delete cascade",
    );
    expect(groupTeamsTable).toContain(
      "references public.football_tournament_groups(id, category_id)",
    );
    expect(groupTeamsTable).toContain(
      "references public.football_tournament_teams(category_id, team_id)",
    );

    expect(rosterTable).toContain(
      "category_id uuid not null references public.football_tournament_categories(id) on delete cascade",
    );
    expect(rosterTable).toContain("unique (category_id, player_id)");
    expect(rosterTable).toContain(
      "references public.football_tournament_teams(category_id, team_id)",
    );

    expect(matchesTable).toContain(
      "category_id uuid not null references public.football_tournament_categories(id) on delete cascade",
    );
    expect(matchesTable).toContain(
      "references public.football_tournament_groups(id, category_id)",
    );
  });

  it("guards category migration backfills against legacy data drift", () => {
    expect(categoryMigrationSql).toContain(
      "when length(trim(coalesce(tournament.category, ''))) >= 2",
    );
    expect(categoryMigrationSql).toContain("else 'General'");
    expect(categoryMigrationSql).toContain(
      "football_tournament_group_teams contains teams that are not registered in the group category",
    );
    expect(categoryMigrationSql).toContain(
      "football_matches contains groups from a different tournament category",
    );
  });
});
