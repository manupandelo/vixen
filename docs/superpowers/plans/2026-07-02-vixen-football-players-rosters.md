# Football Players And Rosters Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add admin-only football players and per-tournament roster entries so staff can manage team rosters, shirt numbers, and documentation statuses before match-event statistics are added.

**Architecture:** Keep the existing football-only module boundary in `src/features/football-tournaments`. Add two Supabase tables: global `football_players` and per-tournament `football_roster_entries`. Load roster data through admin-only server helpers and mutate it through Server Actions that re-check authorization on every POST.

**Tech Stack:** Next.js 16 App Router, React Server Components, Server Actions with `useActionState`, Supabase Postgres/RLS, Zod, Vitest, Testing Library.

---

## Scope Boundary

This plan implements phase 1 from `docs/superpowers/specs/2026-07-02-vixen-football-players-rosters-design.md`.

Included:

- player records
- roster entries for tournament teams
- optional DNI/document number
- medical and insurance statuses as admin-only state
- admin UI inside the existing tournament Teams tab

Excluded:

- file uploads
- public roster pages
- match events
- scorer tables
- card tables

The match-event work should get its own plan after this roster base is merged.

## File Structure

- Create `supabase/migrations/20260702000000_add_football_players_rosters.sql`
  - Adds enum types, tables, constraints, trigger wiring, and RLS policies.
- Modify `supabase/schema.sql`
  - Mirrors the migration for local schema tests.
- Modify `supabase/README.md`
  - Documents player and roster tables.
- Modify `src/features/football-tournaments/types.ts`
  - Adds roster/documentation status unions and labels.
- Modify `src/features/football-tournaments/limits.ts`
  - Adds text limits for player and roster forms.
- Modify `src/features/football-tournaments/validation.ts`
  - Adds Zod schemas for new player roster entry, existing player roster entry, and roster update.
- Modify `src/features/football-tournaments/data.ts`
  - Adds admin row types, formatter helpers, `getAdminRosterEntries`, and `getAdminAvailablePlayers`.
- Modify `src/features/football-tournaments/actions.ts`
  - Adds create/update/remove roster Server Actions.
- Modify `src/components/admin/AdminForms.tsx`
  - Adds roster form components that use `useActionState`.
- Modify `src/app/admin/(protected)/torneos/[id]/page.tsx`
  - Passes roster data/actions into the Teams tab and renders a roster block per team.
- Add or modify tests under:
  - `src/features/football-tournaments/__tests__/database-schema.test.ts`
  - `src/features/football-tournaments/__tests__/validation.test.ts`
  - `src/features/football-tournaments/__tests__/data-formatting.test.ts`
  - `src/features/football-tournaments/__tests__/actions.test.ts`
  - `src/components/admin/AdminForms.test.tsx`
  - `src/app/admin/(protected)/torneos/[id]/page.test.tsx`

## Important Local Constraints

- Read the local Next.js 16 docs before code changes. Relevant docs already identified:
  - `node_modules/next/dist/docs/01-app/02-guides/forms.md`
  - `node_modules/next/dist/docs/01-app/02-guides/data-security.md`
  - `node_modules/next/dist/docs/01-app/01-getting-started/07-mutating-data.md`
- Server Actions are directly reachable POST endpoints. Every new action must call `requireAdmin()`.
- Raw player data is private. Do not expose player tables in public data helpers.
- The working tree may contain unrelated changes. Stage and commit only files touched by the current task.

---

### Task 1: Add Schema Tests For Players And Rosters

**Files:**
- Modify: `src/features/football-tournaments/__tests__/database-schema.test.ts`

- [ ] **Step 1: Write failing schema tests**

Add these tests to `src/features/football-tournaments/__tests__/database-schema.test.ts`:

```ts
it("supports admin-only football players with optional document numbers", () => {
  expect(schemaSql).toContain("create table public.football_players");
  expect(schemaSql).toContain("first_name text not null");
  expect(schemaSql).toContain("last_name text not null");
  expect(schemaSql).toContain("public_name text");
  expect(schemaSql).toContain("document_number text");
  expect(schemaSql).toContain("birth_date date");
  expect(schemaSql).toContain("phone text");
  expect(schemaSql).toContain("notes text");
  expect(schemaSql).toContain(
    'create policy "Admins can manage football players"',
  );
  expect(schemaSql).not.toContain(
    'create policy "Public can read football players"',
  );
});

it("supports tournament roster entries with documentation status", () => {
  expect(schemaSql).toContain("create type football_roster_entry_status");
  expect(schemaSql).toContain("create type football_documentation_status");
  expect(schemaSql).toContain("create table public.football_roster_entries");
  expect(schemaSql).toContain(
    "tournament_id uuid not null references public.football_tournaments(id) on delete cascade",
  );
  expect(schemaSql).toContain(
    "team_id uuid not null references public.football_teams(id) on delete cascade",
  );
  expect(schemaSql).toContain(
    "player_id uuid not null references public.football_players(id) on delete cascade",
  );
  expect(schemaSql).toContain("shirt_number integer");
  expect(schemaSql).toContain(
    "status football_roster_entry_status not null default 'active'",
  );
  expect(schemaSql).toContain(
    "medical_status football_documentation_status not null default 'pending'",
  );
  expect(schemaSql).toContain(
    "insurance_status football_documentation_status not null default 'pending'",
  );
  expect(schemaSql).toContain("unique (tournament_id, player_id)");
  expect(schemaSql).toContain(
    "create unique index football_roster_entries_team_shirt_number_key",
  );
  expect(schemaSql).toContain(
    'create policy "Admins can manage football roster entries"',
  );
});
```

- [ ] **Step 2: Run the schema test and verify it fails**

Run:

```bash
npm test -- src/features/football-tournaments/__tests__/database-schema.test.ts
```

Expected: FAIL because `football_players`, roster enums, and roster table are not in `supabase/schema.sql`.

- [ ] **Step 3: Commit the failing test**

```bash
git add src/features/football-tournaments/__tests__/database-schema.test.ts
git commit -m "test: cover football player roster schema"
```

---

### Task 2: Add Supabase Migration And Schema Snapshot

**Files:**
- Create: `supabase/migrations/20260702000000_add_football_players_rosters.sql`
- Modify: `supabase/schema.sql`
- Modify: `supabase/README.md`

- [ ] **Step 1: Create the migration**

Create `supabase/migrations/20260702000000_add_football_players_rosters.sql` with:

```sql
create type football_roster_entry_status as enum (
  'active',
  'inactive',
  'suspended'
);

create type football_documentation_status as enum (
  'pending',
  'approved',
  'expired'
);

create table public.football_players (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  public_name text,
  document_number text,
  birth_date date,
  phone text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint football_players_first_name_check check (length(trim(first_name)) >= 2),
  constraint football_players_last_name_check check (length(trim(last_name)) >= 2)
);

create table public.football_roster_entries (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.football_tournaments(id) on delete cascade,
  team_id uuid not null references public.football_teams(id) on delete cascade,
  player_id uuid not null references public.football_players(id) on delete cascade,
  shirt_number integer,
  status football_roster_entry_status not null default 'active',
  medical_status football_documentation_status not null default 'pending',
  insurance_status football_documentation_status not null default 'pending',
  registered_at timestamptz not null default now(),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tournament_id, player_id),
  constraint football_roster_entries_shirt_number_check
    check (shirt_number is null or shirt_number between 0 and 99)
);

create unique index football_roster_entries_team_shirt_number_key
on public.football_roster_entries(tournament_id, team_id, shirt_number)
where shirt_number is not null;

create or replace function public.roster_team_belongs_to_tournament()
returns trigger as $$
begin
  if not exists (
    select 1
    from public.football_tournament_teams registration
    where registration.tournament_id = new.tournament_id
      and registration.team_id = new.team_id
  ) then
    raise exception 'Roster team must be registered in the tournament.';
  end if;

  return new;
end;
$$ language plpgsql;

create trigger football_roster_entries_team_tournament_check
before insert or update of tournament_id, team_id
on public.football_roster_entries
for each row execute function public.roster_team_belongs_to_tournament();

create trigger football_players_set_updated_at
before update on public.football_players
for each row execute function public.set_updated_at();

create trigger football_roster_entries_set_updated_at
before update on public.football_roster_entries
for each row execute function public.set_updated_at();

alter table public.football_players enable row level security;
alter table public.football_roster_entries enable row level security;

create policy "Admins can manage football players"
on public.football_players for all
using (public.is_admin())
with check (public.is_admin());

create policy "Admins can manage football roster entries"
on public.football_roster_entries for all
using (public.is_admin())
with check (public.is_admin());
```

- [ ] **Step 2: Mirror the migration in `supabase/schema.sql`**

Add the same enum, table, trigger, and policy definitions to `supabase/schema.sql` in the existing schema order:

- enum definitions near the other football enum definitions.
- `football_players` after `football_team_admin_details`.
- `football_roster_entries` after `football_players`.
- triggers near the existing `set_updated_at` triggers.
- RLS and policies near the existing football policies.

- [ ] **Step 3: Update `supabase/README.md`**

Add these bullets to the table overview:

```md
- `football_players`: datos privados reutilizables de jugadores.
- `football_roster_entries`: plantel de un equipo dentro de un torneo, con numero y estado documental.
```

Add this privacy note:

```md
- Datos personales de jugadores viven en `football_players` y datos operativos del plantel en `football_roster_entries`; no se exponen en paginas publicas crudas.
```

- [ ] **Step 4: Run schema tests and verify they pass**

Run:

```bash
npm test -- src/features/football-tournaments/__tests__/database-schema.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit schema work**

```bash
git add supabase/migrations/20260702000000_add_football_players_rosters.sql supabase/schema.sql supabase/README.md src/features/football-tournaments/__tests__/database-schema.test.ts
git commit -m "feat: add football player roster schema"
```

---

### Task 3: Add Types, Limits, And Validation

**Files:**
- Modify: `src/features/football-tournaments/types.ts`
- Modify: `src/features/football-tournaments/limits.ts`
- Modify: `src/features/football-tournaments/validation.ts`
- Modify: `src/features/football-tournaments/__tests__/validation.test.ts`

- [ ] **Step 1: Write failing validation tests**

Add tests to `src/features/football-tournaments/__tests__/validation.test.ts`:

```ts
import {
  rosterEntryCreateSchema,
  rosterEntryUpdateSchema,
} from "../validation";

describe("roster entry validation", () => {
  it("allows creating a player without a document number", () => {
    const parsed = rosterEntryCreateSchema.safeParse({
      mode: "new",
      firstName: "Juan",
      lastName: "Perez",
      publicName: "",
      documentNumber: "",
      birthDate: "",
      phone: "",
      playerNotes: "",
      shirtNumber: "10",
      status: "active",
      medicalStatus: "pending",
      insuranceStatus: "pending",
      rosterNotes: "",
    });

    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    expect(parsed.data.documentNumber).toBeNull();
    expect(parsed.data.shirtNumber).toBe(10);
  });

  it("allows adding an existing player to a roster", () => {
    const parsed = rosterEntryCreateSchema.safeParse({
      mode: "existing",
      playerId: "player-1",
      shirtNumber: "",
      status: "active",
      medicalStatus: "approved",
      insuranceStatus: "expired",
      rosterNotes: "Debe renovar seguro.",
    });

    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    expect(parsed.data.playerId).toBe("player-1");
    expect(parsed.data.shirtNumber).toBeNull();
  });

  it("rejects duplicate-form submissions without an existing player or names", () => {
    const parsed = rosterEntryCreateSchema.safeParse({
      mode: "new",
      firstName: "",
      lastName: "",
      shirtNumber: "",
      status: "active",
      medicalStatus: "pending",
      insuranceStatus: "pending",
      rosterNotes: "",
    });

    expect(parsed.success).toBe(false);
  });

  it("validates roster updates with optional shirt numbers", () => {
    const parsed = rosterEntryUpdateSchema.safeParse({
      shirtNumber: "",
      status: "suspended",
      medicalStatus: "expired",
      insuranceStatus: "approved",
      rosterNotes: "Suspendido una fecha.",
    });

    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    expect(parsed.data.shirtNumber).toBeNull();
  });
});
```

- [ ] **Step 2: Run validation tests and verify they fail**

Run:

```bash
npm test -- src/features/football-tournaments/__tests__/validation.test.ts
```

Expected: FAIL because roster schemas are not exported.

- [ ] **Step 3: Add status types and labels**

In `src/features/football-tournaments/types.ts`, add:

```ts
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
```

- [ ] **Step 4: Add form limits**

In `src/features/football-tournaments/limits.ts`, extend `footballFormLimits`:

```ts
  playerFirstName: 60,
  playerLastName: 60,
  playerPublicName: 80,
  playerDocumentNumber: 30,
  playerPhone: 30,
  playerNotes: 300,
  rosterNotes: 300,
```

- [ ] **Step 5: Add validation schemas**

In `src/features/football-tournaments/validation.ts`, import the new arrays:

```ts
  footballDocumentationStatuses,
  footballRosterEntryStatuses,
```

Add a nullable positive shirt-number parser:

```ts
const nullableShirtNumber = z.preprocess(
  (value) => {
    if (value === null || value === undefined) return null;
    if (typeof value === "string") {
      const trimmed = value.trim();
      return trimmed === "" ? null : Number(trimmed);
    }
    return value;
  },
  z
    .number()
    .int("Ingresá un número entero.")
    .min(0, "El número no puede ser negativo.")
    .max(99, "El número no puede superar 99.")
    .nullable(),
);
```

Add the create/update schemas:

```ts
const playerBirthDate = z.preprocess((value) => {
  if (value === null || value === undefined) return null;
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}, z.string().refine(isValidCalendarDate, "Ingresá una fecha válida.").nullable());

const rosterBaseSchema = {
  shirtNumber: nullableShirtNumber,
  status: z.enum(footballRosterEntryStatuses),
  medicalStatus: z.enum(footballDocumentationStatuses),
  insuranceStatus: z.enum(footballDocumentationStatuses),
  rosterNotes: nullableText.refine(
    (value) => value === null || value.length <= footballFormLimits.rosterNotes,
    `Las notas no pueden superar ${footballFormLimits.rosterNotes} caracteres.`,
  ),
};

export const rosterEntryCreateSchema = z.discriminatedUnion("mode", [
  z.object({
    mode: z.literal("existing"),
    playerId: z.string().trim().min(1, "Elegí un jugador."),
    ...rosterBaseSchema,
  }),
  z.object({
    mode: z.literal("new"),
    firstName: z
      .string()
      .trim()
      .min(2, "Ingresá el nombre.")
      .max(footballFormLimits.playerFirstName),
    lastName: z
      .string()
      .trim()
      .min(2, "Ingresá el apellido.")
      .max(footballFormLimits.playerLastName),
    publicName: nullableText.refine(
      (value) =>
        value === null || value.length <= footballFormLimits.playerPublicName,
      `El nombre público no puede superar ${footballFormLimits.playerPublicName} caracteres.`,
    ),
    documentNumber: nullableText.refine(
      (value) =>
        value === null ||
        value.length <= footballFormLimits.playerDocumentNumber,
      `El documento no puede superar ${footballFormLimits.playerDocumentNumber} caracteres.`,
    ),
    birthDate: playerBirthDate,
    phone: nullableText.refine(
      (value) => value === null || value.length <= footballFormLimits.playerPhone,
      `El teléfono no puede superar ${footballFormLimits.playerPhone} caracteres.`,
    ),
    playerNotes: nullableText.refine(
      (value) => value === null || value.length <= footballFormLimits.playerNotes,
      `Las notas no pueden superar ${footballFormLimits.playerNotes} caracteres.`,
    ),
    ...rosterBaseSchema,
  }),
]);

export const rosterEntryUpdateSchema = z.object(rosterBaseSchema);
```

- [ ] **Step 6: Run validation tests**

Run:

```bash
npm test -- src/features/football-tournaments/__tests__/validation.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit types and validation**

```bash
git add src/features/football-tournaments/types.ts src/features/football-tournaments/limits.ts src/features/football-tournaments/validation.ts src/features/football-tournaments/__tests__/validation.test.ts
git commit -m "feat: validate football roster forms"
```

---

### Task 4: Add Data Formatters And Admin Fetchers

**Files:**
- Modify: `src/features/football-tournaments/data.ts`
- Modify: `src/features/football-tournaments/__tests__/data-formatting.test.ts`

- [ ] **Step 1: Write failing formatter tests**

Add tests to `src/features/football-tournaments/__tests__/data-formatting.test.ts`:

```ts
import {
  formatAdminAvailablePlayers,
  formatAdminRosterEntries,
} from "../data";

describe("admin roster formatting", () => {
  it("formats roster entries with nested player names", () => {
    const entries = formatAdminRosterEntries([
      {
        id: "entry-1",
        tournament_id: "tournament-1",
        team_id: "team-1",
        player_id: "player-1",
        shirt_number: 10,
        status: "active",
        medical_status: "approved",
        insurance_status: "pending",
        registered_at: "2026-07-02T12:00:00-03:00",
        notes: "Trae apto el lunes.",
        football_players: {
          id: "player-1",
          first_name: "Juan",
          last_name: "Perez",
          public_name: null,
          document_number: null,
          birth_date: null,
          phone: null,
          notes: null,
        },
      },
    ]);

    expect(entries).toEqual([
      {
        id: "entry-1",
        tournamentId: "tournament-1",
        teamId: "team-1",
        playerId: "player-1",
        shirtNumber: 10,
        status: "active",
        medicalStatus: "approved",
        insuranceStatus: "pending",
        registeredAt: "2026-07-02T12:00:00-03:00",
        notes: "Trae apto el lunes.",
        player: {
          id: "player-1",
          firstName: "Juan",
          lastName: "Perez",
          publicName: null,
          documentNumber: null,
          birthDate: null,
          phone: null,
          notes: null,
        },
      },
    ]);
  });

  it("filters existing players already present in a tournament", () => {
    const players = formatAdminAvailablePlayers(
      [
        {
          id: "player-1",
          first_name: "Juan",
          last_name: "Perez",
          public_name: null,
          document_number: null,
          birth_date: null,
          phone: null,
          notes: null,
        },
        {
          id: "player-2",
          first_name: "Ana",
          last_name: "Lopez",
          public_name: "Anita",
          document_number: "123",
          birth_date: null,
          phone: null,
          notes: null,
        },
      ],
      new Set(["player-1"]),
    );

    expect(players).toEqual([
      {
        id: "player-2",
        firstName: "Ana",
        lastName: "Lopez",
        publicName: "Anita",
        documentNumber: "123",
        birthDate: null,
        phone: null,
        notes: null,
      },
    ]);
  });
});
```

- [ ] **Step 2: Run formatter tests and verify they fail**

Run:

```bash
npm test -- src/features/football-tournaments/__tests__/data-formatting.test.ts
```

Expected: FAIL because the formatter exports do not exist.

- [ ] **Step 3: Add admin roster types**

In `src/features/football-tournaments/data.ts`, import:

```ts
  FootballDocumentationStatus,
  FootballRosterEntryStatus,
```

Add types near `AdminTeam`:

```ts
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
```

- [ ] **Step 4: Add formatter functions**

Add:

```ts
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
```

- [ ] **Step 5: Add admin fetchers**

Add:

```ts
export const getAdminRosterEntries = cache(async (tournamentId: string) => {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("football_roster_entries")
    .select(
      "id, tournament_id, team_id, player_id, shirt_number, status, medical_status, insurance_status, registered_at, notes, football_players(id, first_name, last_name, public_name, document_number, birth_date, phone, notes)",
    )
    .eq("tournament_id", tournamentId)
    .order("team_id", { ascending: true })
    .order("shirt_number", { ascending: true, nullsFirst: false });

  if (error) {
    throw new Error("Failed to load football roster entries.", {
      cause: error,
    });
  }

  return formatAdminRosterEntries((data ?? []) as AdminRosterEntryRow[]);
});

export const getAdminAvailablePlayers = cache(async (tournamentId: string) => {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();

  const [{ data: players, error: playersError }, rosterEntries] =
    await Promise.all([
      supabase
        .from("football_players")
        .select("id, first_name, last_name, public_name, document_number, birth_date, phone, notes")
        .order("last_name", { ascending: true })
        .order("first_name", { ascending: true }),
      getAdminRosterEntries(tournamentId),
    ]);

  if (playersError) {
    throw new Error("Failed to load football players.", {
      cause: playersError,
    });
  }

  return formatAdminAvailablePlayers(
    (players ?? []) as AdminPlayerRow[],
    new Set(rosterEntries.map((entry) => entry.playerId)),
  );
});
```

- [ ] **Step 6: Run formatter tests**

Run:

```bash
npm test -- src/features/football-tournaments/__tests__/data-formatting.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit data helpers**

```bash
git add src/features/football-tournaments/data.ts src/features/football-tournaments/__tests__/data-formatting.test.ts
git commit -m "feat: load football roster admin data"
```

---

### Task 5: Add Roster Server Actions

**Files:**
- Modify: `src/features/football-tournaments/actions.ts`
- Modify: `src/features/football-tournaments/__tests__/actions.test.ts`

- [ ] **Step 1: Write failing action tests**

Add tests that follow existing Supabase mock patterns in `src/features/football-tournaments/__tests__/actions.test.ts`:

```ts
describe("roster actions", () => {
  it("creates a player without document number and adds them to the roster", async () => {
    const formData = new FormData();
    formData.set("mode", "new");
    formData.set("firstName", "Juan");
    formData.set("lastName", "Perez");
    formData.set("documentNumber", "");
    formData.set("shirtNumber", "10");
    formData.set("status", "active");
    formData.set("medicalStatus", "pending");
    formData.set("insuranceStatus", "approved");
    formData.set("rosterNotes", "");

    const result = await createRosterEntry(
      "tournament-1",
      "team-1",
      { ok: false, message: "" },
      formData,
    );

    expect(result).toEqual({
      ok: true,
      message: "Jugador agregado al plantel.",
    });
    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        first_name: "Juan",
        last_name: "Perez",
        document_number: null,
      }),
    );
  });

  it("updates roster documentation status", async () => {
    const formData = new FormData();
    formData.set("shirtNumber", "");
    formData.set("status", "suspended");
    formData.set("medicalStatus", "expired");
    formData.set("insuranceStatus", "approved");
    formData.set("rosterNotes", "Suspendido.");

    const result = await updateRosterEntry(
      "tournament-1",
      "entry-1",
      { ok: false, message: "" },
      formData,
    );

    expect(result).toEqual({
      ok: true,
      message: "Plantel actualizado.",
    });
    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        shirt_number: null,
        status: "suspended",
        medical_status: "expired",
        insurance_status: "approved",
      }),
    );
  });
});
```

Use the existing test file's mock naming. If the current mocks use different names than `insertMock` and `updateMock`, bind the expectations to the existing mock variables in that file.

- [ ] **Step 2: Run action tests and verify they fail**

Run:

```bash
npm test -- src/features/football-tournaments/__tests__/actions.test.ts
```

Expected: FAIL because `createRosterEntry` and `updateRosterEntry` do not exist.

- [ ] **Step 3: Import validation schemas**

In `src/features/football-tournaments/actions.ts`, extend validation imports:

```ts
  rosterEntryCreateSchema,
  rosterEntryUpdateSchema,
```

- [ ] **Step 4: Add payload helpers**

Add:

```ts
function getRosterEntryCreatePayload(formData: FormData) {
  const parsed = rosterEntryCreateSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) return null;

  return parsed.data;
}

function getRosterEntryUpdatePayload(formData: FormData) {
  const parsed = rosterEntryUpdateSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) return null;

  return {
    shirt_number: parsed.data.shirtNumber,
    status: parsed.data.status,
    medical_status: parsed.data.medicalStatus,
    insurance_status: parsed.data.insuranceStatus,
    notes: parsed.data.rosterNotes,
  };
}
```

- [ ] **Step 5: Add create action**

Add:

```ts
export async function createRosterEntry(
  tournamentId: string,
  teamId: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await requireAdmin();
  const payload = getRosterEntryCreatePayload(formData);

  if (!payload) {
    return {
      ok: false,
      message: "Revisá los datos del jugador.",
    };
  }

  const supabase = await createSupabaseServerClient();
  let playerId = payload.mode === "existing" ? payload.playerId : null;

  if (payload.mode === "new") {
    const { data: player, error: playerError } = await supabase
      .from("football_players")
      .insert({
        first_name: payload.firstName,
        last_name: payload.lastName,
        public_name: payload.publicName,
        document_number: payload.documentNumber,
        birth_date: payload.birthDate,
        phone: payload.phone,
        notes: payload.playerNotes,
      })
      .select("id")
      .single();

    if (playerError || !player) {
      return {
        ok: false,
        message: "No pudimos crear el jugador.",
      };
    }

    playerId = player.id;
  }

  const { data: rosterEntry, error } = await supabase
    .from("football_roster_entries")
    .insert({
      tournament_id: tournamentId,
      team_id: teamId,
      player_id: playerId,
      shirt_number: payload.shirtNumber,
      status: payload.status,
      medical_status: payload.medicalStatus,
      insurance_status: payload.insuranceStatus,
      notes: payload.rosterNotes,
    })
    .select("id")
    .single();

  if (error || !rosterEntry) {
    return {
      ok: false,
      message: "No pudimos agregar el jugador al plantel.",
    };
  }

  await recordAuditEvent(supabase, {
    tournamentId,
    actor,
    entityType: "roster_entry",
    entityId: rosterEntry.id,
    action: "created",
    summary: "Jugador agregado al plantel.",
    metadata: { teamId, playerId },
  });

  revalidatePath(`/admin/torneos/${tournamentId}`);

  return {
    ok: true,
    message: "Jugador agregado al plantel.",
  };
}
```

- [ ] **Step 6: Add update and remove actions**

Add:

```ts
export async function updateRosterEntry(
  tournamentId: string,
  rosterEntryId: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await requireAdmin();
  const payload = getRosterEntryUpdatePayload(formData);

  if (!payload) {
    return {
      ok: false,
      message: "Revisá los datos del plantel.",
    };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("football_roster_entries")
    .update(payload)
    .eq("id", rosterEntryId)
    .eq("tournament_id", tournamentId);

  if (error) {
    return {
      ok: false,
      message: "No pudimos actualizar el plantel.",
    };
  }

  await recordAuditEvent(supabase, {
    tournamentId,
    actor,
    entityType: "roster_entry",
    entityId: rosterEntryId,
    action: "updated",
    summary: "Plantel actualizado.",
    metadata: payload,
  });

  revalidatePath(`/admin/torneos/${tournamentId}`);

  return {
    ok: true,
    message: "Plantel actualizado.",
  };
}

export async function removeRosterEntry(
  tournamentId: string,
  rosterEntryId: string,
): Promise<ActionState> {
  const actor = await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("football_roster_entries")
    .delete()
    .eq("id", rosterEntryId)
    .eq("tournament_id", tournamentId);

  if (error) {
    return {
      ok: false,
      message: "No pudimos quitar el jugador del plantel.",
    };
  }

  await recordAuditEvent(supabase, {
    tournamentId,
    actor,
    entityType: "roster_entry",
    entityId: rosterEntryId,
    action: "deleted",
    summary: "Jugador quitado del plantel.",
  });

  revalidatePath(`/admin/torneos/${tournamentId}`);

  return {
    ok: true,
    message: "Jugador quitado del plantel.",
  };
}
```

- [ ] **Step 7: Extend audit union types**

In `src/features/football-tournaments/data.ts`, extend:

```ts
export type AuditEntityType =
  | "tournament"
  | "team"
  | "match"
  | "viewer_assignment"
  | "match_result"
  | "roster_entry";
```

And:

```ts
export type AuditAction =
  | "created"
  | "updated"
  | "deleted"
  | "removed_from_tournament"
  | "assigned"
  | "submitted";
```

If `deleted` already exists, keep only one `deleted` entry.

- [ ] **Step 8: Run action tests**

Run:

```bash
npm test -- src/features/football-tournaments/__tests__/actions.test.ts
```

Expected: PASS.

- [ ] **Step 9: Commit actions**

```bash
git add src/features/football-tournaments/actions.ts src/features/football-tournaments/data.ts src/features/football-tournaments/__tests__/actions.test.ts
git commit -m "feat: manage football roster entries"
```

---

### Task 6: Add Admin Roster Form Components

**Files:**
- Modify: `src/components/admin/AdminForms.tsx`
- Modify: `src/components/admin/AdminForms.test.tsx`

- [ ] **Step 1: Write failing component tests**

Add tests to `src/components/admin/AdminForms.test.tsx`:

```tsx
import {
  RosterEntryCreateForm,
  RosterEntryEditForm,
} from "./AdminForms";

describe("RosterEntryCreateForm", () => {
  it("allows document number to stay empty for a new player", () => {
    render(
      <RosterEntryCreateForm
        action={async () => ({ ok: true, message: "ok" })}
        availablePlayers={[]}
      />,
    );

    expect(screen.getByLabelText("Nombre")).toBeRequired();
    expect(screen.getByLabelText("Apellido")).toBeRequired();
    expect(screen.getByLabelText("Documento")).not.toBeRequired();
    expect(screen.getByRole("button", { name: "Agregar jugador" })).toBeDisabled();
  });

  it("shows existing players as an option", () => {
    render(
      <RosterEntryCreateForm
        action={async () => ({ ok: true, message: "ok" })}
        availablePlayers={[
          {
            id: "player-1",
            firstName: "Ana",
            lastName: "Lopez",
            publicName: "Anita",
            documentNumber: null,
            birthDate: null,
            phone: null,
            notes: null,
          },
        ]}
      />,
    );

    expect(screen.getByRole("option", { name: "Ana Lopez (Anita)" })).toBeInTheDocument();
  });
});

describe("RosterEntryEditForm", () => {
  it("renders roster documentation controls", () => {
    render(
      <RosterEntryEditForm
        action={async () => ({ ok: true, message: "ok" })}
        entry={{
          id: "entry-1",
          tournamentId: "tournament-1",
          teamId: "team-1",
          playerId: "player-1",
          shirtNumber: 10,
          status: "active",
          medicalStatus: "pending",
          insuranceStatus: "approved",
          registeredAt: "2026-07-02T12:00:00-03:00",
          notes: null,
          player: {
            id: "player-1",
            firstName: "Ana",
            lastName: "Lopez",
            publicName: null,
            documentNumber: null,
            birthDate: null,
            phone: null,
            notes: null,
          },
        }}
      />,
    );

    expect(screen.getByLabelText("Número")).toHaveValue(10);
    expect(screen.getByLabelText("Apto médico")).toHaveValue("pending");
    expect(screen.getByLabelText("Seguro")).toHaveValue("approved");
  });
});
```

- [ ] **Step 2: Run component tests and verify they fail**

Run:

```bash
npm test -- src/components/admin/AdminForms.test.tsx
```

Expected: FAIL because roster form components are not exported.

- [ ] **Step 3: Add form action types and props**

In `src/components/admin/AdminForms.tsx`, import:

```ts
  AdminPlayer,
  AdminRosterEntry,
```

Add action and prop types:

```ts
type RosterEntryFormAction = (
  prevState: ActionState,
  formData: FormData,
) => Promise<ActionState>;

type RosterEntryCreateFormProps = {
  action: RosterEntryFormAction;
  availablePlayers: AdminPlayer[];
  onSuccess?: () => void;
};

type RosterEntryEditFormProps = {
  action: RosterEntryFormAction;
  entry: AdminRosterEntry;
  onSuccess?: () => void;
};
```

- [ ] **Step 4: Add player option helper**

Add:

```ts
function getPlayerOptionLabel(player: AdminPlayer) {
  const name = `${player.firstName} ${player.lastName}`;
  return player.publicName ? `${name} (${player.publicName})` : name;
}
```

- [ ] **Step 5: Add `RosterEntryCreateForm`**

Add this exported component:

```tsx
export function RosterEntryCreateForm({
  action,
  availablePlayers,
  onSuccess,
}: RosterEntryCreateFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);
  const [mode, setMode] = useState<"new" | "existing">("new");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const canSubmitNew = mode === "new" && firstName.trim().length >= 2 && lastName.trim().length >= 2;

  useActionToast(state, { onSuccess });

  return (
    <form action={formAction} className="grid gap-4">
      <input type="hidden" name="mode" value={mode} />
      {availablePlayers.length > 0 ? (
        <label className="grid gap-2">
          <span className={labelClass}>Usar jugador existente</span>
          <select
            name="playerId"
            className={inputClass}
            onChange={(event) => setMode(event.target.value ? "existing" : "new")}
          >
            <option value="">Crear jugador nuevo</option>
            {availablePlayers.map((player) => (
              <option key={player.id} value={player.id}>
                {getPlayerOptionLabel(player)}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      {mode === "new" ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <label className="grid gap-2">
            <span className={labelClass}>Nombre</span>
            <input
              name="firstName"
              aria-label="Nombre"
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
              required
              className={inputClass}
            />
          </label>
          <label className="grid gap-2">
            <span className={labelClass}>Apellido</span>
            <input
              name="lastName"
              aria-label="Apellido"
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
              required
              className={inputClass}
            />
          </label>
          <label className="grid gap-2">
            <span className={labelClass}>Nombre público</span>
            <input name="publicName" aria-label="Nombre público" className={inputClass} />
          </label>
          <label className="grid gap-2">
            <span className={labelClass}>Documento</span>
            <input name="documentNumber" aria-label="Documento" className={inputClass} />
          </label>
          <label className="grid gap-2">
            <span className={labelClass}>Fecha de nacimiento</span>
            <input name="birthDate" type="date" aria-label="Fecha de nacimiento" className={inputClass} />
          </label>
          <label className="grid gap-2">
            <span className={labelClass}>Teléfono</span>
            <input name="phone" aria-label="Teléfono" className={inputClass} />
          </label>
          <label className="grid gap-2 lg:col-span-2">
            <span className={labelClass}>Notas del jugador</span>
            <textarea name="playerNotes" aria-label="Notas del jugador" className={textareaClass} />
          </label>
        </div>
      ) : null}

      <RosterEntryFields />

      <button
        type="submit"
        disabled={isPending || (mode === "new" && !canSubmitNew)}
        className="inline-flex min-h-12 w-full items-center justify-center rounded-[0.95rem] border border-[color-mix(in_srgb,var(--color-accent)_72%,black)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--color-accent)_92%,white_8%),var(--color-accent))] px-5 py-3 text-sm font-semibold uppercase tracking-[0.14em] text-[#07110a] transition duration-200 disabled:cursor-not-allowed disabled:opacity-60 sm:w-fit"
      >
        {isPending ? "Guardando..." : "Agregar jugador"}
      </button>
    </form>
  );
}
```

- [ ] **Step 6: Add shared fields and edit form**

Add:

```tsx
function RosterEntryFields({ entry }: { entry?: AdminRosterEntry }) {
  return (
    <div className="grid gap-4 lg:grid-cols-4">
      <label className="grid gap-2">
        <span className={labelClass}>Número</span>
        <input
          name="shirtNumber"
          aria-label="Número"
          type="number"
          min="0"
          max="99"
          className={inputClass}
          defaultValue={entry?.shirtNumber ?? ""}
        />
      </label>
      <label className="grid gap-2">
        <span className={labelClass}>Estado</span>
        <select name="status" aria-label="Estado" className={inputClass} defaultValue={entry?.status ?? "active"}>
          <option value="active">Activo</option>
          <option value="inactive">Baja</option>
          <option value="suspended">Suspendido</option>
        </select>
      </label>
      <label className="grid gap-2">
        <span className={labelClass}>Apto médico</span>
        <select name="medicalStatus" aria-label="Apto médico" className={inputClass} defaultValue={entry?.medicalStatus ?? "pending"}>
          <option value="pending">Pendiente</option>
          <option value="approved">Aprobado</option>
          <option value="expired">Vencido</option>
        </select>
      </label>
      <label className="grid gap-2">
        <span className={labelClass}>Seguro</span>
        <select name="insuranceStatus" aria-label="Seguro" className={inputClass} defaultValue={entry?.insuranceStatus ?? "pending"}>
          <option value="pending">Pendiente</option>
          <option value="approved">Aprobado</option>
          <option value="expired">Vencido</option>
        </select>
      </label>
      <label className="grid gap-2 lg:col-span-4">
        <span className={labelClass}>Notas de plantel</span>
        <textarea name="rosterNotes" aria-label="Notas de plantel" className={textareaClass} defaultValue={entry?.notes ?? ""} />
      </label>
    </div>
  );
}

export function RosterEntryEditForm({
  action,
  entry,
  onSuccess,
}: RosterEntryEditFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);
  useActionToast(state, { onSuccess });

  return (
    <form action={formAction} className="grid gap-4">
      <RosterEntryFields entry={entry} />
      <button
        type="submit"
        disabled={isPending}
        className="inline-flex min-h-12 w-full items-center justify-center rounded-[0.95rem] border border-white/12 bg-white/[0.035] px-5 py-3 text-sm font-semibold uppercase tracking-[0.14em] text-white transition duration-200 disabled:cursor-not-allowed disabled:opacity-60 sm:w-fit"
      >
        {isPending ? "Guardando..." : "Guardar plantel"}
      </button>
    </form>
  );
}
```

- [ ] **Step 7: Run form tests**

Run:

```bash
npm test -- src/components/admin/AdminForms.test.tsx
```

Expected: PASS.

- [ ] **Step 8: Commit forms**

```bash
git add src/components/admin/AdminForms.tsx src/components/admin/AdminForms.test.tsx
git commit -m "feat: add football roster forms"
```

---

### Task 7: Integrate Rosters Into The Tournament Teams Tab

**Files:**
- Modify: `src/app/admin/(protected)/torneos/[id]/page.tsx`
- Modify: `src/app/admin/(protected)/torneos/[id]/page.test.tsx`

- [ ] **Step 1: Write failing page test**

Add or update the tournament detail page test:

```tsx
it("shows roster management inside the teams tab", async () => {
  render(await AdminTournamentDetailPage({ params: Promise.resolve({ id: "tournament-1" }), searchParams: Promise.resolve({ tab: "equipos" }) }));

  expect(screen.getByText("Plantel")).toBeInTheDocument();
  expect(screen.getByText("Agregar jugador")).toBeInTheDocument();
  expect(screen.getByText("Apto médico")).toBeInTheDocument();
  expect(screen.getByText("Seguro")).toBeInTheDocument();
});
```

Adjust the component name and props to match the existing test setup. Next.js 16 page `params` and `searchParams` should remain promises.

- [ ] **Step 2: Run page test and verify it fails**

Run:

```bash
npm test -- 'src/app/admin/(protected)/torneos/[id]/page.test.tsx'
```

Expected: FAIL because the Teams tab does not load or render roster entries.

- [ ] **Step 3: Import roster helpers and actions**

In `src/app/admin/(protected)/torneos/[id]/page.tsx`, import:

```ts
  createRosterEntry,
  updateRosterEntry,
  removeRosterEntry,
```

And:

```ts
  getAdminAvailablePlayers,
  getAdminRosterEntries,
  type AdminPlayer,
  type AdminRosterEntry,
```

Also import:

```ts
  RosterEntryCreateForm,
  RosterEntryEditForm,
```

- [ ] **Step 4: Load roster data for the Teams tab**

Where the Teams tab data is loaded, change the Promise to:

```ts
const [teams, availableTeams, rosterEntries, availablePlayers] =
  await Promise.all([
    getAdminTeams(tournament.id),
    getAdminAvailableTeams(tournament.id),
    getAdminRosterEntries(tournament.id),
    getAdminAvailablePlayers(tournament.id),
  ]);
```

Pass `rosterEntries` and `availablePlayers` into `TeamsTab`.

- [ ] **Step 5: Extend `TeamsTab` props**

Update the type:

```ts
function TeamsTab({
  tournament,
  teams,
  availableTeams,
  rosterEntries,
  availablePlayers,
}: {
  tournament: AdminTournament;
  teams: AdminTeam[];
  availableTeams: Pick<AdminTeam, "id" | "name" | "shortName">[];
  rosterEntries: AdminRosterEntry[];
  availablePlayers: AdminPlayer[];
}) {
```

- [ ] **Step 6: Render roster blocks per team**

Inside each team article after private notes, add:

```tsx
<div className="lg:col-span-4">
  <TeamRosterPanel
    tournamentId={tournament.id}
    teamId={team.id}
    rosterEntries={rosterEntries.filter((entry) => entry.teamId === team.id)}
    availablePlayers={availablePlayers}
  />
</div>
```

Add this helper component in the same page file:

```tsx
function TeamRosterPanel({
  tournamentId,
  teamId,
  rosterEntries,
  availablePlayers,
}: {
  tournamentId: string;
  teamId: string;
  rosterEntries: AdminRosterEntry[];
  availablePlayers: AdminPlayer[];
}) {
  const createAction = createRosterEntry.bind(null, tournamentId, teamId);

  return (
    <section className="mt-4 rounded-[0.9rem] border border-white/10 bg-white/[0.025] p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h4 className="text-sm font-semibold uppercase tracking-[0.14em] text-white">
            Plantel
          </h4>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            {rosterEntries.length === 0
              ? "Sin jugadores cargados."
              : `${rosterEntries.length} jugadores cargados.`}
          </p>
        </div>
      </div>

      <div className="mt-4">
        <RosterEntryCreateForm
          action={createAction}
          availablePlayers={availablePlayers}
        />
      </div>

      {rosterEntries.length > 0 ? (
        <div className="mt-5 grid gap-3">
          {rosterEntries.map((entry) => {
            const updateAction = updateRosterEntry.bind(
              null,
              tournamentId,
              entry.id,
            );

            return (
              <article
                key={entry.id}
                className="grid gap-3 rounded-[0.8rem] border border-white/8 bg-black/15 p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-white">
                      {entry.shirtNumber !== null ? `#${entry.shirtNumber} ` : ""}
                      {entry.player.firstName} {entry.player.lastName}
                    </p>
                    <p className="mt-1 text-xs uppercase tracking-[0.14em] text-white/50">
                      Apto médico: {entry.medicalStatus} · Seguro: {entry.insuranceStatus}
                    </p>
                  </div>
                </div>
                <RosterEntryEditForm action={updateAction} entry={entry} />
              </article>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
```

- [ ] **Step 7: Run page test**

Run:

```bash
npm test -- 'src/app/admin/(protected)/torneos/[id]/page.test.tsx'
```

Expected: PASS.

- [ ] **Step 8: Commit integration**

```bash
git add 'src/app/admin/(protected)/torneos/[id]/page.tsx' 'src/app/admin/(protected)/torneos/[id]/page.test.tsx'
git commit -m "feat: show rosters in tournament teams"
```

---

### Task 8: Focused Verification

**Files:**
- No planned code changes.

- [ ] **Step 1: Run focused tests**

Run:

```bash
npm test -- src/features/football-tournaments/__tests__/database-schema.test.ts src/features/football-tournaments/__tests__/validation.test.ts src/features/football-tournaments/__tests__/data-formatting.test.ts src/features/football-tournaments/__tests__/actions.test.ts src/components/admin/AdminForms.test.tsx 'src/app/admin/(protected)/torneos/[id]/page.test.tsx'
```

Expected: all listed test files pass.

- [ ] **Step 2: Run production build**

Run:

```bash
npm run build
```

Expected: Next.js build passes with `/admin/torneos/[id]` still dynamic.

- [ ] **Step 3: Check whitespace**

Run:

```bash
git diff --check
```

Expected: no output.

- [ ] **Step 4: Inspect staged diff before final commit**

Run:

```bash
git status --short
git diff --stat
```

Expected: only files from this player-roster feature are modified, plus unrelated pre-existing dirty files remain unstaged if implementation happened in the main dirty tree.

---

## Plan Self-Review

Spec coverage:

- Mixed model: covered by Tasks 2, 4, 5, 7.
- Optional DNI/document number: covered by Tasks 2, 3, 6.
- No file uploads: enforced by UI and data model omissions in Tasks 2 and 6.
- Medical and insurance statuses: covered by Tasks 2, 3, 6, 7.
- Admin-only privacy: covered by Task 2 RLS and Task 4 admin-only helpers.
- Team-tab roster management: covered by Tasks 6 and 7.
- Phase 2 event/stat work: intentionally excluded and called out as a separate plan.

Placeholder scan:

- The plan avoids unspecified placeholders and includes exact paths, commands, and expected outcomes.

Type consistency:

- Status names match the spec and migration: `active`, `inactive`, `suspended`, `pending`, `approved`, `expired`.
- Client field names match validation schemas and Server Action payload helpers.
