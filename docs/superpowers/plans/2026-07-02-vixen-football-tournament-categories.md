# Football Tournament Categories Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add tournament categories so one football tournament can contain separate competitive categories such as Primera, Reserva, and Menores, each with its own teams, rosters, fixtures, groups, matches, standings, and public category page.

**Architecture:** Keep `football_tournaments` as the parent container for name, season, format, publication, and general description. Add `football_tournament_categories` as the competitive unit and move team registration, rosters, groups, and matches to category scope. Preserve existing one-category behavior by migrating every current tournament into one default category and then making all app reads category-aware.

**Tech Stack:** Next.js 16 App Router, React Server Components, Server Actions, Supabase/Postgres SQL, Vitest, Testing Library, ESLint.

---

## File Structure

Create:

- `supabase/migrations/20260702010000_add_football_tournament_categories.sql`
- `src/app/futbol/torneos/[slug]/[categorySlug]/page.tsx`

Modify:

- `supabase/schema.sql`
- `supabase/README.md`
- `src/features/football-tournaments/types.ts`
- `src/features/football-tournaments/limits.ts`
- `src/features/football-tournaments/validation.ts`
- `src/features/football-tournaments/data.ts`
- `src/features/football-tournaments/actions.ts`
- `src/features/football-tournaments/__tests__/database-schema.test.ts`
- `src/features/football-tournaments/__tests__/validation.test.ts`
- `src/features/football-tournaments/__tests__/data-formatting.test.ts`
- `src/features/football-tournaments/__tests__/actions.test.ts`
- `src/components/admin/AdminForms.tsx`
- `src/components/admin/AdminForms.test.tsx`
- `src/app/admin/(protected)/torneos/[id]/page.tsx`
- `src/app/admin/(protected)/torneos/[id]/page.test.tsx`
- `src/app/futbol/page.tsx`
- `src/app/futbol/page.test.tsx`
- `src/app/futbol/torneos/page.tsx`
- `src/app/futbol/torneos/[slug]/page.tsx`
- `src/components/football/TournamentSummaryCard.tsx`
- `src/components/football/TournamentSummaryCard.test.tsx`
- `src/components/football/PublicTournamentPanel.tsx`
- `src/components/football/PublicTournamentPanel.test.tsx`

Implementation boundary:

- Keep parent tournament `format` shared across categories.
- Keep `football_tournaments.category` in the database during this plan for migration compatibility.
- Stop using `football_tournaments.category` in application reads after category reads are in place.
- Do not make teams shared between categories. Register teams per category.

---

### Task 1: Category Schema and Migration

**Files:**
- Create: `supabase/migrations/20260702010000_add_football_tournament_categories.sql`
- Modify: `supabase/schema.sql`
- Modify: `supabase/README.md`
- Test: `src/features/football-tournaments/__tests__/database-schema.test.ts`

- [ ] **Step 1: Write failing schema tests**

Add tests to `src/features/football-tournaments/__tests__/database-schema.test.ts`:

```ts
it("supports tournament categories as the competitive unit", () => {
  expect(schemaSql).toContain("create type football_tournament_category_status");
  expect(schemaSql).toContain("create table public.football_tournament_categories");

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
  const teamsTable = extractCreateTableBlock("public.football_tournament_teams");
  const groupsTable = extractCreateTableBlock("public.football_tournament_groups");
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
});
```

- [ ] **Step 2: Run schema tests and verify red**

Run:

```bash
npm test -- --exclude '**/.worktrees/**' src/features/football-tournaments/__tests__/database-schema.test.ts
```

Expected: FAIL because `football_tournament_categories` and `category_id` columns do not exist.

- [ ] **Step 3: Add migration SQL**

Create `supabase/migrations/20260702010000_add_football_tournament_categories.sql`:

```sql
create type public.football_tournament_category_status as enum (
  'draft',
  'published',
  'active',
  'completed',
  'archived'
);

create table public.football_tournament_categories (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.football_tournaments(id) on delete cascade,
  name text not null,
  slug text not null,
  status public.football_tournament_category_status not null default 'draft',
  position integer not null default 0,
  starts_at date,
  ends_at date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tournament_id, slug),
  unique (tournament_id, position),
  constraint football_tournament_categories_name_check check (length(trim(name)) >= 2),
  constraint football_tournament_categories_slug_check check (length(trim(slug)) >= 1)
);

insert into public.football_tournament_categories (
  tournament_id,
  name,
  slug,
  status,
  position,
  starts_at,
  ends_at
)
select
  id,
  category,
  lower(regexp_replace(unaccent(category), '[^a-zA-Z0-9]+', '-', 'g')),
  case
    when status in ('draft', 'published', 'active', 'completed', 'archived')
      then status::public.football_tournament_category_status
    else 'draft'::public.football_tournament_category_status
  end,
  0,
  starts_at,
  ends_at
from public.football_tournaments;

alter table public.football_tournament_teams
  add column category_id uuid references public.football_tournament_categories(id) on delete cascade;

update public.football_tournament_teams registration
set category_id = category.id
from public.football_tournament_categories category
where category.tournament_id = registration.tournament_id;

alter table public.football_tournament_teams
  alter column category_id set not null;

alter table public.football_tournament_teams
  drop constraint football_tournament_teams_pkey,
  add primary key (category_id, team_id),
  add constraint football_tournament_teams_tournament_category_fkey
    foreign key (tournament_id, category_id)
    references public.football_tournament_categories(tournament_id, id)
    on delete cascade;

alter table public.football_tournament_groups
  add column category_id uuid references public.football_tournament_categories(id) on delete cascade;

update public.football_tournament_groups tournament_group
set category_id = category.id
from public.football_tournament_categories category
where category.tournament_id = tournament_group.tournament_id;

alter table public.football_tournament_groups
  alter column category_id set not null;

alter table public.football_tournament_groups
  drop constraint football_tournament_groups_tournament_id_name_key,
  drop constraint football_tournament_groups_tournament_id_position_key,
  add unique (category_id, name),
  add unique (category_id, position),
  add constraint football_tournament_groups_tournament_category_fkey
    foreign key (tournament_id, category_id)
    references public.football_tournament_categories(tournament_id, id)
    on delete cascade;

alter table public.football_roster_entries
  add column category_id uuid references public.football_tournament_categories(id) on delete cascade;

update public.football_roster_entries roster
set category_id = category.id
from public.football_tournament_categories category
where category.tournament_id = roster.tournament_id;

drop index if exists public.football_roster_entries_team_shirt_number_key;

alter table public.football_roster_entries
  alter column category_id set not null,
  drop constraint football_roster_entries_tournament_id_player_id_key,
  drop constraint football_roster_entries_tournament_team_fkey,
  add unique (category_id, player_id),
  add constraint football_roster_entries_category_team_fkey
    foreign key (category_id, team_id)
    references public.football_tournament_teams(category_id, team_id)
    on delete cascade,
  add constraint football_roster_entries_tournament_category_fkey
    foreign key (tournament_id, category_id)
    references public.football_tournament_categories(tournament_id, id)
    on delete cascade;

create unique index football_roster_entries_team_shirt_number_key
on public.football_roster_entries(category_id, team_id, shirt_number)
where shirt_number is not null;

alter table public.football_matches
  add column category_id uuid references public.football_tournament_categories(id) on delete cascade;

update public.football_matches match
set category_id = category.id
from public.football_tournament_categories category
where category.tournament_id = match.tournament_id;

alter table public.football_matches
  alter column category_id set not null,
  add constraint football_matches_tournament_category_fkey
    foreign key (tournament_id, category_id)
    references public.football_tournament_categories(tournament_id, id)
    on delete cascade;

create trigger football_tournament_categories_set_updated_at
before update on public.football_tournament_categories
for each row execute function public.set_updated_at();

alter table public.football_tournament_categories enable row level security;

create policy "football categories are admin writable"
on public.football_tournament_categories for all
using (public.is_admin())
with check (public.is_admin());

create policy "football categories are publicly readable"
on public.football_tournament_categories for select
using (
  exists (
    select 1
    from public.football_tournaments tournament
    where tournament.id = football_tournament_categories.tournament_id
      and tournament.status in ('published', 'active', 'completed')
      and football_tournament_categories.status in ('published', 'active', 'completed')
  )
);

notify pgrst, 'reload schema';
```

- [ ] **Step 4: Mirror schema into `supabase/schema.sql`**

Apply the same structural changes from the migration into `supabase/schema.sql`. Keep schema order:

1. enum definitions
2. `football_tournaments`
3. `football_tournament_categories`
4. teams and competitive tables
5. triggers
6. RLS policies

- [ ] **Step 5: Update Supabase README**

In `supabase/README.md`, add:

```md
### football_tournament_categories

Competitive categories inside one parent football tournament. Categories own teams, rosters, groups, matches, standings, and fixture generation. Parent tournaments keep shared name, season, format, and publication.

Existing tournaments are migrated into one default category based on the former `football_tournaments.category` value.
```

- [ ] **Step 6: Run schema tests and verify green**

Run:

```bash
npm test -- --exclude '**/.worktrees/**' src/features/football-tournaments/__tests__/database-schema.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit schema work**

Run:

```bash
git add supabase/schema.sql supabase/README.md supabase/migrations/20260702010000_add_football_tournament_categories.sql src/features/football-tournaments/__tests__/database-schema.test.ts
git commit -m "feat: add football tournament categories schema"
```

---

### Task 2: Category Types, Limits, and Validation

**Files:**
- Modify: `src/features/football-tournaments/types.ts`
- Modify: `src/features/football-tournaments/limits.ts`
- Modify: `src/features/football-tournaments/validation.ts`
- Test: `src/features/football-tournaments/__tests__/validation.test.ts`

- [ ] **Step 1: Add failing validation tests**

Add tests:

```ts
import {
  tournamentCategoryCreateSchema,
  tournamentCategoryUpdateSchema,
} from "../validation";

it("validates tournament category creation with optional dates", () => {
  const parsed = tournamentCategoryCreateSchema.safeParse({
    name: " Primera ",
    status: "published",
    startsAt: "2026-03-01",
    endsAt: "",
  });

  expect(parsed.success).toBe(true);
  if (!parsed.success) return;

  expect(parsed.data).toEqual({
    name: "Primera",
    status: "published",
    startsAt: "2026-03-01",
    endsAt: null,
  });
});

it("rejects invalid tournament category date ranges", () => {
  const parsed = tournamentCategoryUpdateSchema.safeParse({
    name: "Reserva",
    status: "active",
    startsAt: "2026-06-30",
    endsAt: "2026-03-01",
  });

  expect(parsed.success).toBe(false);
});
```

- [ ] **Step 2: Run validation tests and verify red**

Run:

```bash
npm test -- --exclude '**/.worktrees/**' src/features/football-tournaments/__tests__/validation.test.ts
```

Expected: FAIL because category schemas are not exported.

- [ ] **Step 3: Add category status types**

In `src/features/football-tournaments/types.ts`, add:

```ts
export const footballTournamentCategoryStatuses = [
  "draft",
  "published",
  "active",
  "completed",
  "archived",
] as const;

export type FootballTournamentCategoryStatus =
  (typeof footballTournamentCategoryStatuses)[number];

export const footballTournamentCategoryStatusLabels = {
  draft: "Borrador",
  published: "Publicado",
  active: "Activo",
  completed: "Finalizado",
  archived: "Archivado",
} satisfies Record<FootballTournamentCategoryStatus, string>;
```

Add public/admin category shapes:

```ts
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
```

- [ ] **Step 4: Add form limits**

In `src/features/football-tournaments/limits.ts`, add:

```ts
categoryName: 80,
categorySlug: 100,
```

- [ ] **Step 5: Add validation schemas**

In `src/features/football-tournaments/validation.ts`, import category statuses and add:

```ts
const tournamentCategoryBaseSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Ingresá un nombre de categoría.")
      .max(
        footballFormLimits.categoryName,
        `La categoría no puede superar ${footballFormLimits.categoryName} caracteres.`,
      ),
    status: z.enum(footballTournamentCategoryStatuses),
    startsAt: tournamentDate,
    endsAt: tournamentDate,
  })
  .superRefine((value, ctx) => {
    if (value.startsAt && value.endsAt && value.endsAt < value.startsAt) {
      ctx.addIssue({
        code: "custom",
        path: ["endsAt"],
        message: "La fecha de fin no puede ser anterior al inicio.",
      });
    }
  });

export const tournamentCategoryCreateSchema = tournamentCategoryBaseSchema;
export const tournamentCategoryUpdateSchema = tournamentCategoryBaseSchema;

export type TournamentCategoryFormInput = z.infer<
  typeof tournamentCategoryCreateSchema
>;
```

- [ ] **Step 6: Run validation tests and verify green**

Run:

```bash
npm test -- --exclude '**/.worktrees/**' src/features/football-tournaments/__tests__/validation.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit types and validation**

Run:

```bash
git add src/features/football-tournaments/types.ts src/features/football-tournaments/limits.ts src/features/football-tournaments/validation.ts src/features/football-tournaments/__tests__/validation.test.ts
git commit -m "feat: add football category validation"
```

---

### Task 3: Category-Aware Data Helpers

**Files:**
- Modify: `src/features/football-tournaments/data.ts`
- Test: `src/features/football-tournaments/__tests__/data-formatting.test.ts`

- [ ] **Step 1: Add failing formatter tests**

Add tests:

```ts
import {
  formatAdminTournamentCategories,
  formatPublicTournamentWithCategories,
} from "../data";

it("formats admin tournament categories in position order", () => {
  const categories = formatAdminTournamentCategories([
    {
      id: "category-2",
      tournament_id: "tournament-1",
      name: "Reserva",
      slug: "reserva",
      status: "active",
      position: 2,
      starts_at: null,
      ends_at: null,
    },
    {
      id: "category-1",
      tournament_id: "tournament-1",
      name: "Primera",
      slug: "primera",
      status: "published",
      position: 1,
      starts_at: "2026-03-01",
      ends_at: null,
    },
  ]);

  expect(categories.map((category) => category.slug)).toEqual([
    "primera",
    "reserva",
  ]);
});

it("formats a public tournament with visible categories only", () => {
  const tournament = formatPublicTournamentWithCategories({
    id: "tournament-1",
    name: "Apertura",
    slug: "apertura",
    season: "2026",
    format: "league",
    status: "active",
    starts_at: "2026-03-01",
    ends_at: null,
    description: null,
    football_tournament_categories: [
      {
        id: "category-1",
        tournament_id: "tournament-1",
        name: "Primera",
        slug: "primera",
        status: "active",
        position: 1,
        starts_at: null,
        ends_at: null,
        football_tournament_teams: [],
        football_matches: [],
      },
      {
        id: "category-2",
        tournament_id: "tournament-1",
        name: "Menores",
        slug: "menores",
        status: "archived",
        position: 2,
        starts_at: null,
        ends_at: null,
        football_tournament_teams: [],
        football_matches: [],
      },
    ],
  });

  expect(tournament.categories.map((category) => category.slug)).toEqual([
    "primera",
  ]);
});
```

- [ ] **Step 2: Run data formatting tests and verify red**

Run:

```bash
npm test -- --exclude '**/.worktrees/**' src/features/football-tournaments/__tests__/data-formatting.test.ts
```

Expected: FAIL because formatter exports do not exist.

- [ ] **Step 3: Add row and domain types in `data.ts`**

Add row types:

```ts
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
```

Add exported domain types:

```ts
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
};

export type PublicFootballTournamentWithCategories = Omit<
  PublicFootballTournament,
  "category" | "teams" | "matches" | "standings"
> & {
  categories: PublicFootballTournamentCategory[];
};
```

- [ ] **Step 4: Add category formatters**

Add:

```ts
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
```

Add public formatter:

```ts
export function formatPublicTournamentWithCategories(
  row: PublicTournamentWithCategoriesRow,
): PublicFootballTournamentWithCategories {
  const categories = (row.football_tournament_categories ?? [])
    .filter((category) => category.status !== "archived")
    .map((category) => {
      const base = formatTournamentCategoryBase(category);
      const categoryTournamentRow = {
        ...row,
        category: category.name,
        football_tournament_teams: category.football_tournament_teams ?? [],
        football_matches: category.football_matches ?? [],
      };
      const formatted = formatPublicTournament(categoryTournamentRow);

      return {
        ...base,
        teams: formatted.teams,
        matches: formatted.matches,
        standings: formatted.standings,
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
```

- [ ] **Step 5: Add category-aware fetchers**

Add:

```ts
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

    return formatAdminTournamentCategories((data ?? []) as TournamentCategoryRow[]);
  },
);
```

Add selected category helper:

```ts
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
      ) ?? categories[0] ?? null
    );
  }

  return categories[0] ?? null;
}
```

- [ ] **Step 6: Update scoped admin fetchers**

Change signatures:

```ts
getAdminTeams(tournamentId: string, categoryId?: string)
getAdminAvailableTeams(tournamentId: string, categoryId?: string)
getAdminRosterEntries(tournamentId: string, categoryId?: string)
getAdminAvailablePlayers(tournamentId: string, categoryId?: string)
getAdminMatches(tournamentId: string, categoryId?: string)
```

Implementation rule:

```ts
if (categoryId) {
  query = query.eq("category_id", categoryId);
} else {
  query = query.eq("tournament_id", tournamentId);
}
```

This preserves old one-category callers during transition and enables category-scoped callers.

- [ ] **Step 7: Run data tests and verify green**

Run:

```bash
npm test -- --exclude '**/.worktrees/**' src/features/football-tournaments/__tests__/data-formatting.test.ts
```

Expected: PASS.

- [ ] **Step 8: Commit data helpers**

Run:

```bash
git add src/features/football-tournaments/data.ts src/features/football-tournaments/__tests__/data-formatting.test.ts
git commit -m "feat: add category-aware football data helpers"
```

---

### Task 4: Admin Category Actions and Forms

**Files:**
- Modify: `src/features/football-tournaments/actions.ts`
- Modify: `src/features/football-tournaments/__tests__/actions.test.ts`
- Modify: `src/components/admin/AdminForms.tsx`
- Modify: `src/components/admin/AdminForms.test.tsx`

- [ ] **Step 1: Add failing action tests**

Add tests:

```ts
it("creates a football tournament category with generated slug", async () => {
  requireAdminMock.mockResolvedValue({
    id: "admin-1",
    email: "admin@vixen.test",
    role: "admin",
  });
  maybeSingleMock.mockResolvedValueOnce({
    data: { id: "category-1" },
    error: null,
  });

  const state = await createTournamentCategory(
    "tournament-1",
    { ok: false, message: "" },
    formData({
      name: " Primera ",
      status: "published",
      startsAt: "2026-03-01",
      endsAt: "",
    }),
  );

  expect(state).toEqual<ActionState>({
    ok: true,
    message: "Categoría creada.",
  });
  expect(fromMock).toHaveBeenCalledWith("football_tournament_categories");
  expect(insertMock).toHaveBeenCalledWith({
    tournament_id: "tournament-1",
    name: "Primera",
    slug: "primera",
    status: "published",
    starts_at: "2026-03-01",
    ends_at: null,
    position: 0,
  });
  expect(revalidatePathMock).toHaveBeenCalledWith(
    "/admin/torneos/tournament-1",
  );
});

it("updates a football tournament category", async () => {
  requireAdminMock.mockResolvedValue({
    id: "admin-1",
    email: "admin@vixen.test",
    role: "admin",
  });
  maybeSingleMock.mockResolvedValueOnce({
    data: { id: "category-1" },
    error: null,
  });

  const state = await updateTournamentCategory(
    "tournament-1",
    "category-1",
    { ok: false, message: "" },
    formData({
      name: " Reserva ",
      status: "active",
      startsAt: "",
      endsAt: "",
    }),
  );

  expect(state).toEqual<ActionState>({
    ok: true,
    message: "Categoría guardada.",
  });
  expect(updateMock).toHaveBeenCalledWith({
    name: "Reserva",
    slug: "reserva",
    status: "active",
    starts_at: null,
    ends_at: null,
  });
});
```

- [ ] **Step 2: Run action tests and verify red**

Run:

```bash
npm test -- --exclude '**/.worktrees/**' src/features/football-tournaments/__tests__/actions.test.ts
```

Expected: FAIL because category actions are not exported.

- [ ] **Step 3: Implement category actions**

In `actions.ts`, import category schemas and add payload helper:

```ts
function getTournamentCategoryPayload(formData: FormData) {
  const parsed = tournamentCategoryCreateSchema.safeParse(
    Object.fromEntries(formData),
  );

  if (!parsed.success) return null;

  return {
    name: parsed.data.name,
    slug: slugify(parsed.data.name),
    status: parsed.data.status,
    starts_at: parsed.data.startsAt,
    ends_at: parsed.data.endsAt,
  };
}
```

Add:

```ts
export async function createTournamentCategory(
  tournamentId: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const payload = getTournamentCategoryPayload(formData);

  if (!payload) {
    return { ok: false, message: "Revisá los datos de la categoría." };
  }

  const supabase = await createSupabaseServerClient();
  const { count } = await supabase
    .from("football_tournament_categories")
    .select("id", { count: "exact", head: true })
    .eq("tournament_id", tournamentId);

  const { data, error } = await supabase
    .from("football_tournament_categories")
    .insert({
      tournament_id: tournamentId,
      ...payload,
      position: count ?? 0,
    })
    .select("id")
    .maybeSingle();

  if (error) return { ok: false, message: error.message };
  if (!data?.id) return { ok: false, message: "No pudimos crear la categoría." };

  revalidatePath(`/admin/torneos/${tournamentId}`);
  revalidatePath("/futbol");

  return { ok: true, message: "Categoría creada." };
}
```

Add update:

```ts
export async function updateTournamentCategory(
  tournamentId: string,
  categoryId: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const payload = getTournamentCategoryPayload(formData);

  if (!payload) {
    return { ok: false, message: "Revisá los datos de la categoría." };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("football_tournament_categories")
    .update(payload)
    .eq("id", categoryId)
    .eq("tournament_id", tournamentId)
    .select("id")
    .maybeSingle();

  if (error) return { ok: false, message: error.message };
  if (!data?.id) return { ok: false, message: "No pudimos guardar la categoría." };

  revalidatePath(`/admin/torneos/${tournamentId}`);
  revalidatePath("/futbol");

  return { ok: true, message: "Categoría guardada." };
}
```

- [ ] **Step 4: Add category form UI tests**

In `AdminForms.test.tsx`, add:

```tsx
it("creates a tournament category from the admin form", async () => {
  const user = userEvent.setup();
  const action = vi.fn(async () => ({
    ok: true,
    message: "Categoría creada.",
  }));

  render(
    <AdminToastProvider>
      <TournamentCategoryCreateDialog action={action} />
    </AdminToastProvider>,
  );

  await user.click(screen.getByRole("button", { name: "Agregar categoría" }));
  await user.type(screen.getByLabelText("Nombre de categoría"), "Primera");
  await user.selectOptions(screen.getByLabelText("Estado de categoría"), "published");
  await user.click(screen.getByRole("button", { name: "Crear categoría" }));

  await waitFor(() => expect(action).toHaveBeenCalledTimes(1));
  const payload = action.mock.calls[0]?.[1] as FormData;
  expect(payload.get("name")).toBe("Primera");
  expect(payload.get("status")).toBe("published");
});
```

- [ ] **Step 5: Implement category form components**

In `AdminForms.tsx`, add:

```tsx
export function TournamentCategoryForm({
  action,
  category,
  onSuccess,
  submitLabel = "Guardar categoría",
}: {
  action: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
  category?: AdminTournamentCategory;
  onSuccess?: () => void;
  submitLabel?: string;
}) {
  const [state, formAction, isPending] = useActionState(action, initialState);
  const [name, setName] = useState(category?.name ?? "");
  const [status, setStatus] = useState<FootballTournamentCategoryStatus>(
    category?.status ?? "draft",
  );

  useActionToast(state, { onSuccess });

  return (
    <form action={formAction} className="grid gap-4">
      <label className="grid gap-2">
        <FieldLabel value={name} max={footballFormLimits.categoryName}>
          Nombre de categoría
        </FieldLabel>
        <input
          name="name"
          aria-label="Nombre de categoría"
          value={name}
          onChange={(event) => setName(event.target.value)}
          className={inputClass}
          required
        />
      </label>
      <label className="grid gap-2">
        <span className={labelClass}>Estado de categoría</span>
        <select
          name="status"
          aria-label="Estado de categoría"
          value={status}
          onChange={(event) =>
            setStatus(event.target.value as FootballTournamentCategoryStatus)
          }
          className={inputClass}
        >
          {footballTournamentCategoryStatuses.map((categoryStatus) => (
            <option key={categoryStatus} value={categoryStatus}>
              {footballTournamentCategoryStatusLabels[categoryStatus]}
            </option>
          ))}
        </select>
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2">
          <span className={labelClass}>Inicio</span>
          <input
            name="startsAt"
            aria-label="Inicio de categoría"
            type="date"
            defaultValue={category?.startsAt ?? ""}
            className={inputClass}
          />
        </label>
        <label className="grid gap-2">
          <span className={labelClass}>Fin</span>
          <input
            name="endsAt"
            aria-label="Fin de categoría"
            type="date"
            defaultValue={category?.endsAt ?? ""}
            className={inputClass}
          />
        </label>
      </div>
      <button type="submit" disabled={isPending} className={primaryButtonClass}>
        {isPending ? "Guardando..." : submitLabel}
      </button>
    </form>
  );
}
```

Add create/edit dialogs using the existing Radix `Dialog` pattern from `TeamCreatePanel`.

- [ ] **Step 6: Run actions and form tests**

Run:

```bash
npm test -- --exclude '**/.worktrees/**' src/features/football-tournaments/__tests__/actions.test.ts src/components/admin/AdminForms.test.tsx
```

Expected: PASS.

- [ ] **Step 7: Commit category actions and forms**

Run:

```bash
git add src/features/football-tournaments/actions.ts src/features/football-tournaments/__tests__/actions.test.ts src/components/admin/AdminForms.tsx src/components/admin/AdminForms.test.tsx
git commit -m "feat: add football category admin forms"
```

---

### Task 5: Admin Workspace Category Selection

**Files:**
- Modify: `src/app/admin/(protected)/torneos/[id]/page.tsx`
- Modify: `src/app/admin/(protected)/torneos/[id]/page.test.tsx`
- Modify: `src/features/football-tournaments/actions.ts`
- Test: `src/features/football-tournaments/__tests__/actions.test.ts`

- [ ] **Step 1: Add failing admin page test**

Add to page test mocks:

```ts
getAdminTournamentCategories: vi.fn(async () => [
  {
    id: "category-1",
    tournamentId: "tournament-1",
    name: "Primera",
    slug: "primera",
    status: "active",
    position: 0,
    startsAt: null,
    endsAt: null,
  },
  {
    id: "category-2",
    tournamentId: "tournament-1",
    name: "Reserva",
    slug: "reserva",
    status: "published",
    position: 1,
    startsAt: null,
    endsAt: null,
  },
]),
```

Add test:

```tsx
it("scopes the teams tab to the selected tournament category", async () => {
  render(
    await AdminTournamentWorkspacePage({
      params: Promise.resolve({ id: "tournament-1" }),
      searchParams: Promise.resolve({ tab: "equipos", category: "reserva" }),
    }),
  );

  expect(screen.getByRole("link", { name: "Primera" })).toHaveAttribute(
    "href",
    "/admin/torneos/tournament-1?tab=equipos&category=primera",
  );
  expect(screen.getByRole("link", { name: "Reserva" })).toHaveAttribute(
    "aria-current",
    "true",
  );
});
```

- [ ] **Step 2: Run page test and verify red**

Run:

```bash
npm test -- --exclude '**/.worktrees/**' 'src/app/admin/(protected)/torneos/[id]/page.test.tsx'
```

Expected: FAIL because the page does not load or render categories.

- [ ] **Step 3: Update page search params and selected category**

In `page.tsx`, update props:

```ts
searchParams?: Promise<{
  tab?: string | string[];
  category?: string | string[];
}>;
```

Add:

```ts
function normalizeCategory(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function categoryTabHref(
  tournamentId: string,
  tab: TournamentWorkspaceTab,
  categorySlug: string,
) {
  return `${tabHref(tournamentId, tab)}${
    tab === "resumen" ? "?" : "&"
  }category=${categorySlug}`;
}
```

Load categories:

```ts
const [tournament, activeTab, categories] = await Promise.all([
  getAdminTournament(id),
  Promise.resolve(normalizeTab(resolvedSearchParams?.tab)),
  getAdminTournamentCategories(id),
]);

const activeCategory = resolveSelectedCategory(
  categories,
  normalizeCategory(resolvedSearchParams?.category),
);
```

- [ ] **Step 4: Add category selector component**

Add:

```tsx
function TournamentCategorySelector({
  activeCategory,
  activeTab,
  categories,
  tournamentId,
}: {
  activeCategory: AdminTournamentCategory | null;
  activeTab: TournamentWorkspaceTab;
  categories: AdminTournamentCategory[];
  tournamentId: string;
}) {
  if (categories.length === 0) return null;

  return (
    <nav
      aria-label="Categorías del torneo"
      className="flex gap-2 overflow-x-auto rounded-[0.95rem] border border-white/10 bg-white/[0.025] p-1"
    >
      {categories.map((category) => {
        const isActive = category.id === activeCategory?.id;
        return (
          <Link
            key={category.id}
            href={categoryTabHref(tournamentId, activeTab, category.slug)}
            aria-current={isActive ? "true" : undefined}
            className={
              isActive
                ? "inline-flex min-h-10 items-center rounded-[0.7rem] bg-[var(--color-accent)] px-4 text-sm font-semibold text-[#07110a]"
                : "inline-flex min-h-10 items-center rounded-[0.7rem] px-4 text-sm font-semibold text-white/62 hover:bg-white/[0.055] hover:text-white"
            }
          >
            {category.name}
          </Link>
        );
      })}
    </nav>
  );
}
```

- [ ] **Step 5: Scope tab content to selected category**

Change `renderTournamentTabContent` signature:

```ts
async function renderTournamentTabContent({
  activeCategory,
  activeTab,
  categories,
  tournament,
}: {
  activeCategory: AdminTournamentCategory | null;
  activeTab: TournamentWorkspaceTab;
  categories: AdminTournamentCategory[];
  tournament: AdminTournament;
})
```

When `activeTab === "equipos"`:

```ts
if (!activeCategory) {
  return (
    <AdminEmptyState
      eyebrow="Sin categorías"
      title="Creá una categoría para cargar equipos."
      description="Cada categoría tiene sus propios equipos, planteles y partidos."
      action={<TournamentCategoryCreateDialog action={createCategoryAction} />}
    />
  );
}

const [teams, availableTeams, rosterEntries, availablePlayers] =
  await Promise.all([
    getAdminTeams(tournament.id, activeCategory.id),
    getAdminAvailableTeams(tournament.id, activeCategory.id),
    getAdminRosterEntries(tournament.id, activeCategory.id),
    getAdminAvailablePlayers(tournament.id, activeCategory.id),
  ]);
```

Pass `activeCategory` into `TeamsTab` for headings and actions.

- [ ] **Step 6: Update team and roster actions to accept category ID**

Change signatures:

```ts
createTeam(tournamentId: string, categoryId: string, ...)
removeTeamFromTournament(tournamentId: string, categoryId: string, teamId: string, ...)
createRosterEntry(tournamentId: string, categoryId: string, teamId: string, ...)
```

Insert payloads include `category_id: categoryId`.

Existing tests from Task 4 should be updated to pass `"category-1"` and assert `category_id`.

- [ ] **Step 7: Run admin tests**

Run:

```bash
npm test -- --exclude '**/.worktrees/**' 'src/app/admin/(protected)/torneos/[id]/page.test.tsx' src/features/football-tournaments/__tests__/actions.test.ts
```

Expected: PASS.

- [ ] **Step 8: Commit admin category selection**

Run:

```bash
git add 'src/app/admin/(protected)/torneos/[id]/page.tsx' 'src/app/admin/(protected)/torneos/[id]/page.test.tsx' src/features/football-tournaments/actions.ts src/features/football-tournaments/__tests__/actions.test.ts
git commit -m "feat: scope admin teams to football categories"
```

---

### Task 6: Category-Scoped Matches and Fixture Generation

**Files:**
- Modify: `src/features/football-tournaments/actions.ts`
- Modify: `src/features/football-tournaments/__tests__/actions.test.ts`
- Modify: `src/features/football-tournaments/data.ts`
- Modify: `src/app/admin/(protected)/torneos/[id]/page.tsx`

- [ ] **Step 1: Add failing action tests for sibling category isolation**

Add:

```ts
it("generates a league fixture for one category even when a sibling category has matches", async () => {
  requireAdminMock.mockResolvedValue({
    id: "admin-1",
    email: "admin@vixen.test",
    role: "admin",
  });
  vi.mocked(getAdminTeams).mockResolvedValue([
    { id: "team-1", name: "Primera A", shortName: null, photoUrl: null, captainName: null, contactPhone: null, notes: null },
    { id: "team-2", name: "Primera B", shortName: null, photoUrl: null, captainName: null, contactPhone: null, notes: null },
  ]);
  vi.mocked(getAdminMatches).mockResolvedValue([]);
  insertMock.mockResolvedValueOnce({ data: null, error: null });

  const state = await generateLeagueFixture(
    "tournament-1",
    "category-1",
    { ok: false, message: "" },
    formData({
      legs: "1",
      startsAt: "",
      kickoffTime: "",
      daysBetweenRounds: "7",
    }),
  );

  expect(state.ok).toBe(true);
  expect(getAdminMatches).toHaveBeenCalledWith("tournament-1", "category-1");
  expect(insertMock).toHaveBeenCalledWith([
    expect.objectContaining({
      tournament_id: "tournament-1",
      category_id: "category-1",
    }),
  ]);
});
```

- [ ] **Step 2: Run action tests and verify red**

Run:

```bash
npm test -- --exclude '**/.worktrees/**' src/features/football-tournaments/__tests__/actions.test.ts
```

Expected: FAIL because fixture actions do not accept category ID.

- [ ] **Step 3: Update match action signatures**

Change:

```ts
createMatch(tournamentId, categoryId, ...)
updateMatch(tournamentId, categoryId, matchId, ...)
deleteMatch(tournamentId, categoryId, matchId, ...)
generateLeagueFixture(tournamentId, categoryId, ...)
generateBracketFixture(tournamentId, categoryId, ...)
generateGroupPlayoffFixture(tournamentId, categoryId, ...)
assignMatchViewer(tournamentId, categoryId, matchId, ...)
updateMatchResult(tournamentId, categoryId, matchId, ...)
```

Every match insert includes:

```ts
{
  tournament_id: tournamentId,
  category_id: categoryId,
  ...
}
```

Every update/delete query adds:

```ts
.eq("category_id", categoryId)
```

- [ ] **Step 4: Scope fixture blockers and source teams**

In fixture generation actions, use:

```ts
const [teams, existingMatches] = await Promise.all([
  getAdminTeams(tournamentId, categoryId),
  getAdminMatches(tournamentId, categoryId),
]);
```

This ensures sibling categories do not block fixture generation.

- [ ] **Step 5: Scope group creation**

When inserting groups:

```ts
{
  tournament_id: tournamentId,
  category_id: categoryId,
  name: group.name,
  position: group.position,
}
```

When inserting group memberships, reference group IDs created for that category only.

- [ ] **Step 6: Update admin page action binds**

In `MatchesTab`, bind:

```ts
const generateFixtureAction = generateLeagueFixture.bind(
  null,
  tournament.id,
  activeCategory.id,
);
```

Pass `activeCategory` to `MatchesTab` and show:

```tsx
<h2 className="mt-2 text-2xl font-semibold text-white">
  Fixture y resultados · {activeCategory.name}
</h2>
```

- [ ] **Step 7: Run action and page tests**

Run:

```bash
npm test -- --exclude '**/.worktrees/**' src/features/football-tournaments/__tests__/actions.test.ts 'src/app/admin/(protected)/torneos/[id]/page.test.tsx'
```

Expected: PASS.

- [ ] **Step 8: Commit match scoping**

Run:

```bash
git add src/features/football-tournaments/actions.ts src/features/football-tournaments/__tests__/actions.test.ts src/features/football-tournaments/data.ts 'src/app/admin/(protected)/torneos/[id]/page.tsx' 'src/app/admin/(protected)/torneos/[id]/page.test.tsx'
git commit -m "feat: scope football matches to categories"
```

---

### Task 7: Public Category Routes and Tournament Cards

**Files:**
- Create: `src/app/futbol/torneos/[slug]/[categorySlug]/page.tsx`
- Modify: `src/app/futbol/torneos/[slug]/page.tsx`
- Modify: `src/app/futbol/torneos/page.tsx`
- Modify: `src/app/futbol/page.tsx`
- Modify: `src/components/football/TournamentSummaryCard.tsx`
- Modify: `src/components/football/PublicTournamentPanel.tsx`
- Tests: related public page/component tests

- [ ] **Step 1: Add failing public route/data tests**

In public page tests, add:

```tsx
it("renders category navigation on the public tournament detail", async () => {
  render(
    await PublicTournamentDetailPage({
      params: Promise.resolve({ slug: "apertura" }),
    }),
  );

  expect(screen.getByRole("link", { name: "Primera" })).toHaveAttribute(
    "href",
    "/futbol/torneos/apertura/primera",
  );
  expect(screen.getByRole("link", { name: "Reserva" })).toHaveAttribute(
    "href",
    "/futbol/torneos/apertura/reserva",
  );
});
```

Add category route test:

```tsx
it("renders only the selected public category", async () => {
  render(
    await PublicTournamentCategoryPage({
      params: Promise.resolve({
        slug: "apertura",
        categorySlug: "reserva",
      }),
    }),
  );

  expect(screen.getByText("Reserva")).toBeInTheDocument();
  expect(screen.queryByText("Primera fixture")).not.toBeInTheDocument();
});
```

- [ ] **Step 2: Run public tests and verify red**

Run:

```bash
npm test -- --exclude '**/.worktrees/**' src/app/futbol/page.test.tsx src/components/football/TournamentSummaryCard.test.tsx src/components/football/PublicTournamentPanel.test.tsx
```

Expected: FAIL because public category route and format are not implemented.

- [ ] **Step 3: Add public fetchers**

In `data.ts`, add:

```ts
export async function getPublicFootballTournamentWithCategoriesBySlug(
  slug: string,
): Promise<PublicFootballTournamentWithCategories | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("football_tournaments")
    .select(publicTournamentWithCategoriesSelect)
    .in("status", [...publicTournamentStatuses])
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    throw new Error("Failed to load public football tournament categories.", {
      cause: error,
    });
  }

  if (!data) return null;

  return formatPublicTournamentWithCategories(
    data as unknown as PublicTournamentWithCategoriesRow,
  );
}
```

Add:

```ts
export function resolvePublicTournamentCategory(
  tournament: PublicFootballTournamentWithCategories,
  categorySlug?: string,
) {
  if (categorySlug) {
    return (
      tournament.categories.find((category) => category.slug === categorySlug) ??
      null
    );
  }

  return tournament.categories[0] ?? null;
}
```

- [ ] **Step 4: Update public detail route**

In `src/app/futbol/torneos/[slug]/page.tsx`, load parent and first category:

```tsx
const tournament = await getPublicFootballTournamentWithCategoriesBySlug(slug);
if (!tournament) notFound();

const activeCategory = resolvePublicTournamentCategory(tournament);
if (!activeCategory) notFound();

return (
  <PublicTournamentPanel
    tournament={tournament}
    activeCategory={activeCategory}
  />
);
```

- [ ] **Step 5: Add category route**

Create `src/app/futbol/torneos/[slug]/[categorySlug]/page.tsx`:

```tsx
import { notFound } from "next/navigation";
import { PublicTournamentPanel } from "@/components/football/PublicTournamentPanel";
import {
  getPublicFootballTournamentWithCategoriesBySlug,
  resolvePublicTournamentCategory,
} from "@/features/football-tournaments/data";

type PublicTournamentCategoryPageProps = {
  params: Promise<{
    slug: string;
    categorySlug: string;
  }>;
};

export default async function PublicTournamentCategoryPage({
  params,
}: PublicTournamentCategoryPageProps) {
  const { slug, categorySlug } = await params;
  const tournament = await getPublicFootballTournamentWithCategoriesBySlug(slug);

  if (!tournament) notFound();

  const activeCategory = resolvePublicTournamentCategory(
    tournament,
    categorySlug,
  );

  if (!activeCategory) notFound();

  return (
    <PublicTournamentPanel
      tournament={tournament}
      activeCategory={activeCategory}
    />
  );
}
```

- [ ] **Step 6: Update public panel props**

Change `PublicTournamentPanel` props:

```ts
type PublicTournamentPanelProps = {
  tournament: PublicFootballTournamentWithCategories;
  activeCategory: PublicFootballTournamentCategory;
  showHeader?: boolean;
};
```

Render category navigation:

```tsx
<nav aria-label="Categorías del torneo" className="flex flex-wrap gap-2">
  {tournament.categories.map((category) => (
    <Link
      key={category.id}
      href={`/futbol/torneos/${tournament.slug}/${category.slug}`}
      aria-current={category.id === activeCategory.id ? "page" : undefined}
      className={category.id === activeCategory.id ? activeClass : inactiveClass}
    >
      {category.name}
    </Link>
  ))}
</nav>
```

Use `activeCategory.teams`, `activeCategory.matches`, and `activeCategory.standings` for display.

- [ ] **Step 7: Update tournament summary cards**

Render category chips:

```tsx
<div className="flex flex-wrap gap-2">
  {tournament.categories.map((category) => (
    <span
      key={category.id}
      className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-xs font-semibold text-white/60"
    >
      {category.name}
    </span>
  ))}
</div>
```

Use first category with an upcoming match for next-match preview:

```ts
function getNextCategoryMatch(tournament: PublicFootballTournamentWithCategories) {
  return tournament.categories
    .flatMap((category) =>
      category.matches.map((match) => ({ category, match })),
    )
    .filter(({ match }) => match.status === "scheduled")
    .sort((left, right) =>
      compareNullableIsoDate(left.match.scheduledAt, right.match.scheduledAt),
    )[0] ?? null;
}
```

- [ ] **Step 8: Run public tests**

Run:

```bash
npm test -- --exclude '**/.worktrees/**' src/app/futbol/page.test.tsx src/components/football/TournamentSummaryCard.test.tsx src/components/football/PublicTournamentPanel.test.tsx
```

Expected: PASS.

- [ ] **Step 9: Commit public category routes**

Run:

```bash
git add src/app/futbol/page.tsx src/app/futbol/page.test.tsx src/app/futbol/torneos/page.tsx src/app/futbol/torneos/[slug]/page.tsx src/app/futbol/torneos/[slug]/[categorySlug]/page.tsx src/components/football/TournamentSummaryCard.tsx src/components/football/TournamentSummaryCard.test.tsx src/components/football/PublicTournamentPanel.tsx src/components/football/PublicTournamentPanel.test.tsx src/features/football-tournaments/data.ts
git commit -m "feat: add public football category pages"
```

---

### Task 8: Legacy Category Column Removal From App Reads

**Files:**
- Modify: `src/features/football-tournaments/data.ts`
- Modify: `src/features/football-tournaments/actions.ts`
- Modify: `src/components/admin/AdminForms.tsx`
- Modify: tests that still set `category` on tournament forms

- [ ] **Step 1: Find remaining app reads of parent category**

Run:

```bash
rg -n "category" src/features/football-tournaments src/app src/components
```

Expected remaining valid usage:

- category child types and forms
- migration compatibility tests
- public category labels from `football_tournament_categories`

- [ ] **Step 2: Remove category field from tournament forms**

In `AdminForms.tsx`, remove the parent tournament category input from `TournamentForm`. Keep name, format, status, dates, and description.

The tournament create flow should no longer ask for `Categoría`; category creation happens in the category management surface.

- [ ] **Step 3: Update tournament validation and actions**

In `validation.ts`, remove `category` from `tournamentFormSchema`.

In `actions.ts`, change tournament payload:

```ts
return {
  name: parsed.data.name,
  slug: slugify(parsed.data.name),
  season: deriveSeason(parsed.data.startsAt),
  format: parsed.data.format,
  status: parsed.data.status,
  starts_at: parsed.data.startsAt,
  ends_at: parsed.data.endsAt,
  description: parsed.data.description,
};
```

Keep `football_tournaments.category` database column untouched in SQL.

- [ ] **Step 4: Auto-create a default category after tournament creation**

After inserting a tournament, insert:

```ts
await supabase.from("football_tournament_categories").insert({
  tournament_id: tournament.id,
  name: "Primera",
  slug: "primera",
  status: payload.status === "draft" ? "draft" : "published",
  position: 0,
  starts_at: payload.starts_at,
  ends_at: payload.ends_at,
});
```

Redirect remains:

```ts
redirect(`/admin/torneos/${tournament.id}?tab=equipos&notice=tournament-created`);
```

- [ ] **Step 5: Update tests**

Update tournament create/update tests to remove `category` from submitted form data and assert no `category` field in payload. Add assertion that category insert happens after tournament creation:

```ts
expect(fromMock).toHaveBeenNthCalledWith(2, "football_tournament_categories");
expect(insertMock).toHaveBeenNthCalledWith(2, {
  tournament_id: "tournament-1",
  name: "Primera",
  slug: "primera",
  status: "draft",
  position: 0,
  starts_at: "2026-03-01",
  ends_at: "2026-06-30",
});
```

- [ ] **Step 6: Run targeted tests**

Run:

```bash
npm test -- --exclude '**/.worktrees/**' src/features/football-tournaments/__tests__/validation.test.ts src/features/football-tournaments/__tests__/actions.test.ts src/components/admin/AdminForms.test.tsx
```

Expected: PASS.

- [ ] **Step 7: Commit parent category cleanup**

Run:

```bash
git add src/features/football-tournaments/validation.ts src/features/football-tournaments/actions.ts src/components/admin/AdminForms.tsx src/features/football-tournaments/__tests__/validation.test.ts src/features/football-tournaments/__tests__/actions.test.ts src/components/admin/AdminForms.test.tsx
git commit -m "refactor: move football category input to categories"
```

---

### Task 9: Full Verification

**Files:**
- All changed files

- [ ] **Step 1: Run full tests**

Run:

```bash
npm test -- --exclude '**/.worktrees/**'
```

Expected: all tests pass.

- [ ] **Step 2: Run lint**

Run:

```bash
npm run lint
```

Expected: pass.

- [ ] **Step 3: Run build**

Run:

```bash
npm run build
```

Expected: Next.js production build passes.

- [ ] **Step 4: Run diff check**

Run:

```bash
git diff --check
```

Expected: no whitespace errors.

- [ ] **Step 5: Inspect status**

Run:

```bash
git status --short
```

Expected: only intentional dirty files remain. If unrelated dirty files from previous work remain, do not revert them.

- [ ] **Step 6: Final implementation summary**

Summarize:

- migration created
- default categories created for existing tournaments
- admin category selector and management
- category-scoped teams/rosters/matches/fixtures
- public category pages
- verification commands and results
