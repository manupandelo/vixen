# Fase 1 — El ganador avanza y el panel deja de estorbar

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Que el ganador de un partido de copa avance automáticamente a la ronda siguiente, y que el panel de admin y veedor deje de tener duplicación, lienzos vacíos y acciones irreversibles sin confirmación.

**Architecture:** El slot destino (`home`/`away`) ya lo calcula `tree-generator.ts` y ya viaja en el payload del cliente; se persiste en una columna nueva `next_match_slot`. La lógica de "quién ganó" y "se puede avanzar" vive en un módulo puro sin dependencias de Supabase, testeable sin base. Las dos server actions de resultado comparten un helper que hace pre-flight y después siembra. En UI, un primitivo `AdminSheet` (drawer) reemplaza al panel lateral fijo y se reusa para el plantel.

**Tech Stack:** Next.js 16 (App Router, server actions), React 19, Supabase (Postgres + RLS), Tailwind v4, Radix UI (`react-dialog`, `react-alert-dialog` — ya son dependencias), Zod v4, Vitest + Testing Library.

## Global Constraints

- **Este NO es el Next.js de siempre.** Antes de escribir código de framework, leé la guía relevante en `node_modules/next/dist/docs/`. APIs, convenciones y estructura de archivos difieren. Respetá los avisos de deprecación. (Regla de `AGENTS.md`.)
- **Todo el texto de cara al usuario va en español rioplatense** (voseo: "cargá", "revisá", "guardá"). Seguí el tono de los mensajes existentes en `actions.ts`.
- **Hay otro agente trabajando en este repo en paralelo.** Re-leé cada archivo antes de editarlo. No confíes en los números de línea de este plan; usá `grep` para ubicar el código.
- **Tests:** `npm test` corre `vitest run --passWithNoTests`. Para un archivo puntual: `npx vitest run <ruta>`.
- **Lint:** `npm run lint` antes de cada commit.
- **No inventes migraciones aplicadas.** Las migraciones se aplican a mano en Supabase; el repo solo las versiona. `supabase/schema.sql` es el estado esperado y debe quedar sincronizado.
- **Tokens de color:** usá las variables CSS existentes (`--color-accent`, `--color-warm`, `--color-muted`, `--color-base`), nunca hex sueltos.
- **Objetivos táctiles mínimos de 44px** en todo control nuevo (los veedores cargan desde el celular).

---

## File Structure

**Crear:**
- `supabase/migrations/20260730000000_add_next_match_slot.sql` — columna, backfill, constraints, índice único.
- `src/features/football-tournaments/bracket-progression.ts` — lógica pura: ganador y bloqueo de avance.
- `src/features/football-tournaments/__tests__/bracket-progression.test.ts`
- `src/components/admin/AdminSheet.tsx` — drawer reusable.
- `src/components/admin/AdminSheet.test.tsx`
- `src/components/admin/TeamCard.tsx` — card de equipo + drawer de plantel.
- `src/components/admin/PendingMatchesPanel.tsx` — lista de partidos pendientes del dashboard.
- `src/components/veedor/ViewerMatchCard.tsx` — card de partido del veedor con confirmación.

**Modificar:**
- `supabase/schema.sql` — espejo de la migración.
- `src/features/football-tournaments/fixture.ts` — `nextMatchSlot` en los generadores.
- `src/features/football-tournaments/actions.ts` — validar/persistir el slot, helper de avance, guard de equipos.
- `src/features/football-tournaments/data.ts` — leer `next_match_slot`, `getAdminPendingMatches`.
- `src/features/football-tournaments/types.ts` — `nextMatchSlot` en los tipos de UI.
- `src/lib/tree-reconstructor.ts` — ubicar hijos por slot.
- `src/components/football/shared/TournamentBracket.tsx` — altura adaptativa, escala medida.
- `src/components/admin/MatchSidePanel.tsx` — pasa a usar `AdminSheet`.
- `src/components/admin/BracketResultsViewer.tsx`, `LeagueMatchesViewer.tsx` — sacar el wrapper `flex`.
- `src/components/admin/AdminForms.tsx` — `MatchResultForm` reordenado.
- `src/app/admin/(protected)/page.tsx` — sacar duplicación, sumar pendientes.
- `src/app/admin/(protected)/torneos/[id]/page.tsx` — equipos en cards, stats colapsable.
- `src/app/veedor/page.tsx` — rediseño mobile-first.

---

### Task 1: Columna `next_match_slot` en la base

**Files:**
- Create: `supabase/migrations/20260730000000_add_next_match_slot.sql`
- Modify: `supabase/schema.sql` (bloque `create table public.football_matches`)
- Test: `src/features/football-tournaments/__tests__/database-schema.test.ts`

**Interfaces:**
- Consumes: nada.
- Produces: columna `football_matches.next_match_slot text` con valores `'home' | 'away'`, `null` si y solo si `next_match_id` es `null`. Índice único `(next_match_id, next_match_slot)`.

- [ ] **Step 1: Escribir el test que falla**

Agregá este `it` dentro del `describe("Supabase schema")` en `src/features/football-tournaments/__tests__/database-schema.test.ts`:

```ts
  it("records which slot of the next match a winner advances into", () => {
    expect(schemaSql).toContain("next_match_slot text");
    expect(schemaSql).toContain(
      "check ((next_match_id is null) = (next_match_slot is null))",
    );
    expect(schemaSql).toContain(
      "on public.football_matches (next_match_id, next_match_slot)",
    );
  });
```

- [ ] **Step 2: Correr el test y verificar que falla**

Run: `npx vitest run src/features/football-tournaments/__tests__/database-schema.test.ts`
Expected: FAIL — `expected '...' to contain 'next_match_slot text'`

- [ ] **Step 3: Escribir la migración**

Creá `supabase/migrations/20260730000000_add_next_match_slot.sql`:

```sql
-- Guarda a qué lado del partido siguiente avanza el ganador.
-- Sin este dato el bracket ordena los cruces por id y el ganador no puede sembrarse.

alter table public.football_matches
  add column if not exists next_match_slot text;

-- Backfill determinista para llaves ya cargadas: reproduce el orden por id
-- que usaba tree-reconstructor.ts, así ningún bracket existente cambia de forma.
update public.football_matches m
set next_match_slot = ranked.slot
from (
  select
    id,
    case
      row_number() over (partition by next_match_id order by created_at, id)
      when 1 then 'home'
      else 'away'
    end as slot
  from public.football_matches
  where next_match_id is not null
) ranked
where m.id = ranked.id
  and m.next_match_slot is null;

alter table public.football_matches
  add constraint football_matches_next_match_slot_check
  check (next_match_slot is null or next_match_slot in ('home', 'away'));

alter table public.football_matches
  add constraint football_matches_next_match_slot_pair_check
  check ((next_match_id is null) = (next_match_slot is null));

-- Garantía dura: dos partidos no pueden alimentar el mismo lado del siguiente.
create unique index if not exists football_matches_next_match_slot_key
  on public.football_matches (next_match_id, next_match_slot)
  where next_match_id is not null;
```

Nota para quien la aplique: si la creación del índice único falla, significa que hay un partido con más de dos alimentadores — la llave está corrupta y hay que regenerar el fixture de esa categoría.

- [ ] **Step 4: Espejar en `schema.sql`**

En `supabase/schema.sql`, dentro de `create table public.football_matches`, justo debajo de la línea `next_match_id uuid references public.football_matches(id) on delete set null,`, agregá:

```sql
  next_match_slot text,
```

Y dentro del mismo `create table`, junto a los otros `constraint ... check`, agregá:

```sql
  constraint football_matches_next_match_slot_check
    check (next_match_slot is null or next_match_slot in ('home', 'away')),
  constraint football_matches_next_match_slot_pair_check
    check ((next_match_id is null) = (next_match_slot is null)),
```

Después del `create table` (junto a los otros `create index` de esa tabla), agregá:

```sql
create unique index football_matches_next_match_slot_key
on public.football_matches (next_match_id, next_match_slot)
where next_match_id is not null;
```

- [ ] **Step 5: Correr el test y verificar que pasa**

Run: `npx vitest run src/features/football-tournaments/__tests__/database-schema.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add supabase/migrations/20260730000000_add_next_match_slot.sql supabase/schema.sql src/features/football-tournaments/__tests__/database-schema.test.ts
git commit -m "feat(db): agrega next_match_slot para sembrar al ganador en la llave"
```

---

### Task 2: Módulo puro `bracket-progression`

**Files:**
- Create: `src/features/football-tournaments/bracket-progression.ts`
- Test: `src/features/football-tournaments/__tests__/bracket-progression.test.ts`

**Interfaces:**
- Consumes: nada (módulo puro, sin Supabase, sin React).
- Produces:
  - `type MatchSlot = "home" | "away"`
  - `resolveMatchWinner(match: WinnerResolvableMatch): string | null`
  - `findAdvancementBlock(nextMatch: AdvancementTargetMatch, slot: MatchSlot, winnerTeamId: string): string | null`
  - `type WinnerResolvableMatch = { homeTeamId, awayTeamId: string | null; homeScore, awayScore: number | null; homePenaltyScore?, awayPenaltyScore?: number | null }`
  - `type AdvancementTargetMatch = { roundLabel: string; homeTeamId, awayTeamId: string | null; homeScore, awayScore: number | null; status: string }`

- [ ] **Step 1: Escribir el test que falla**

Creá `src/features/football-tournaments/__tests__/bracket-progression.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import {
  findAdvancementBlock,
  resolveMatchWinner,
} from "@/features/football-tournaments/bracket-progression";

const baseMatch = {
  homeTeamId: "team-home",
  awayTeamId: "team-away",
  homeScore: null as number | null,
  awayScore: null as number | null,
};

describe("resolveMatchWinner", () => {
  it("devuelve el local cuando gana en el marcador", () => {
    expect(
      resolveMatchWinner({ ...baseMatch, homeScore: 2, awayScore: 1 }),
    ).toBe("team-home");
  });

  it("devuelve el visitante cuando gana en el marcador", () => {
    expect(
      resolveMatchWinner({ ...baseMatch, homeScore: 0, awayScore: 3 }),
    ).toBe("team-away");
  });

  it("desempata por penales cuando el marcador quedó igualado", () => {
    expect(
      resolveMatchWinner({
        ...baseMatch,
        homeScore: 1,
        awayScore: 1,
        homePenaltyScore: 3,
        awayPenaltyScore: 4,
      }),
    ).toBe("team-away");
  });

  it("resuelve un 0 a 0 definido por penales", () => {
    expect(
      resolveMatchWinner({
        ...baseMatch,
        homeScore: 0,
        awayScore: 0,
        homePenaltyScore: 5,
        awayPenaltyScore: 4,
      }),
    ).toBe("team-home");
  });

  it("no devuelve ganador si el empate no tiene penales", () => {
    expect(
      resolveMatchWinner({ ...baseMatch, homeScore: 2, awayScore: 2 }),
    ).toBeNull();
  });

  it("no devuelve ganador si el marcador está incompleto", () => {
    expect(
      resolveMatchWinner({ ...baseMatch, homeScore: 2, awayScore: null }),
    ).toBeNull();
  });

  it("no devuelve ganador si falta alguno de los equipos", () => {
    expect(
      resolveMatchWinner({
        ...baseMatch,
        awayTeamId: null,
        homeScore: 2,
        awayScore: 1,
      }),
    ).toBeNull();
  });

  it("no devuelve ganador si los penales quedaron iguales", () => {
    expect(
      resolveMatchWinner({
        ...baseMatch,
        homeScore: 1,
        awayScore: 1,
        homePenaltyScore: 3,
        awayPenaltyScore: 3,
      }),
    ).toBeNull();
  });
});

describe("findAdvancementBlock", () => {
  const pendingNext = {
    roundLabel: "Final",
    homeTeamId: null as string | null,
    awayTeamId: null as string | null,
    homeScore: null as number | null,
    awayScore: null as number | null,
    status: "scheduled",
  };

  it("deja avanzar cuando el slot está vacío", () => {
    expect(findAdvancementBlock(pendingNext, "home", "team-home")).toBeNull();
  });

  it("deja avanzar cuando el slot ya tiene al mismo equipo", () => {
    expect(
      findAdvancementBlock(
        { ...pendingNext, homeTeamId: "team-home" },
        "home",
        "team-home",
      ),
    ).toBeNull();
  });

  it("deja reemplazar el equipo si el partido siguiente no tiene resultado", () => {
    expect(
      findAdvancementBlock(
        { ...pendingNext, homeTeamId: "team-otro" },
        "home",
        "team-home",
      ),
    ).toBeNull();
  });

  it("bloquea si cambia el equipo y el partido siguiente ya tiene resultado", () => {
    expect(
      findAdvancementBlock(
        {
          ...pendingNext,
          homeTeamId: "team-otro",
          homeScore: 2,
          awayScore: 0,
          status: "completed",
        },
        "home",
        "team-home",
      ),
    ).toBe(
      "No se puede cambiar el ganador: Final ya tiene resultado cargado. Borrá ese resultado primero.",
    );
  });

  it("no bloquea si el equipo no cambia aunque el siguiente tenga resultado", () => {
    expect(
      findAdvancementBlock(
        {
          ...pendingNext,
          homeTeamId: "team-home",
          homeScore: 2,
          awayScore: 0,
          status: "completed",
        },
        "home",
        "team-home",
      ),
    ).toBeNull();
  });
});
```

- [ ] **Step 2: Correr el test y verificar que falla**

Run: `npx vitest run src/features/football-tournaments/__tests__/bracket-progression.test.ts`
Expected: FAIL — no se puede resolver el módulo `bracket-progression`

- [ ] **Step 3: Escribir la implementación**

Creá `src/features/football-tournaments/bracket-progression.ts`:

```ts
export type MatchSlot = "home" | "away";

export type WinnerResolvableMatch = {
  homeTeamId: string | null;
  awayTeamId: string | null;
  homeScore: number | null;
  awayScore: number | null;
  homePenaltyScore?: number | null;
  awayPenaltyScore?: number | null;
};

export type AdvancementTargetMatch = {
  roundLabel: string;
  homeTeamId: string | null;
  awayTeamId: string | null;
  homeScore: number | null;
  awayScore: number | null;
  status: string;
};

/**
 * Devuelve el id del equipo ganador, o null si el partido todavía no define uno.
 * Los penales solo se miran cuando el marcador quedó igualado.
 */
export function resolveMatchWinner(match: WinnerResolvableMatch): string | null {
  const { homeTeamId, awayTeamId, homeScore, awayScore } = match;

  if (!homeTeamId || !awayTeamId) return null;
  if (homeScore === null || awayScore === null) return null;

  if (homeScore > awayScore) return homeTeamId;
  if (awayScore > homeScore) return awayTeamId;

  const homePenalties = match.homePenaltyScore ?? null;
  const awayPenalties = match.awayPenaltyScore ?? null;

  if (homePenalties === null || awayPenalties === null) return null;
  if (homePenalties > awayPenalties) return homeTeamId;
  if (awayPenalties > homePenalties) return awayTeamId;

  return null;
}

function hasLoadedResult(match: AdvancementTargetMatch) {
  return (
    match.status === "completed" &&
    match.homeScore !== null &&
    match.awayScore !== null
  );
}

/**
 * Devuelve el motivo por el que NO se puede sembrar al ganador, o null si se puede.
 * Bloquea solo cuando el equipo del slot cambia y el partido destino ya tiene resultado:
 * pisarlo dejaría cargado un resultado entre equipos que nunca jugaron.
 */
export function findAdvancementBlock(
  nextMatch: AdvancementTargetMatch,
  slot: MatchSlot,
  winnerTeamId: string,
): string | null {
  const currentTeamId =
    slot === "home" ? nextMatch.homeTeamId : nextMatch.awayTeamId;

  if (currentTeamId === winnerTeamId) return null;
  if (!hasLoadedResult(nextMatch)) return null;

  return `No se puede cambiar el ganador: ${nextMatch.roundLabel} ya tiene resultado cargado. Borrá ese resultado primero.`;
}
```

- [ ] **Step 4: Correr el test y verificar que pasa**

Run: `npx vitest run src/features/football-tournaments/__tests__/bracket-progression.test.ts`
Expected: PASS (14 tests)

- [ ] **Step 5: Commit**

```bash
git add src/features/football-tournaments/bracket-progression.ts src/features/football-tournaments/__tests__/bracket-progression.test.ts
git commit -m "feat: agrega logica pura de ganador y bloqueo de avance en llaves"
```

---

### Task 3: Persistir el slot al generar el fixture

**Files:**
- Modify: `src/features/football-tournaments/fixture.ts`
- Modify: `src/features/football-tournaments/actions.ts`
- Test: `src/features/football-tournaments/__tests__/fixture.test.ts`

**Interfaces:**
- Consumes: `MatchSlot` de Task 2.
- Produces: `GeneratedBracketMatch` gana `nextMatchSlot: MatchSlot | null`. `BracketFixtureNode` gana `isHomeSlotInNextMatch: boolean`. Las filas insertadas en `football_matches` incluyen `next_match_slot`.

- [ ] **Step 1: Escribir el test que falla**

Agregá a `src/features/football-tournaments/__tests__/fixture.test.ts` (importá `buildBracketFixture` si no está ya importado):

```ts
describe("buildBracketFixture slots", () => {
  it("asigna slots alternados home/away a los alimentadores de cada partido", () => {
    const matches = buildBracketFixture(
      [
        { homeTeamId: "a", awayTeamId: "b" },
        { homeTeamId: "c", awayTeamId: "d" },
        { homeTeamId: "e", awayTeamId: "f" },
        { homeTeamId: "g", awayTeamId: "h" },
      ],
      "2026-08-01",
      7,
    );

    const byNext = new Map<string, string[]>();

    for (const match of matches) {
      if (!match.nextMatchId) continue;
      expect(match.nextMatchSlot).not.toBeNull();
      const slots = byNext.get(match.nextMatchId) ?? [];
      slots.push(match.nextMatchSlot as string);
      byNext.set(match.nextMatchId, slots);
    }

    expect(byNext.size).toBeGreaterThan(0);

    for (const slots of byNext.values()) {
      expect([...slots].sort()).toEqual(["away", "home"]);
    }
  });

  it("deja el slot en null para la final", () => {
    const matches = buildBracketFixture(
      [
        { homeTeamId: "a", awayTeamId: "b" },
        { homeTeamId: "c", awayTeamId: "d" },
      ],
      null,
      7,
    );
    const final = matches.find((match) => match.nextMatchId === null);

    expect(final?.nextMatchSlot).toBeNull();
  });
});
```

- [ ] **Step 2: Correr el test y verificar que falla**

Run: `npx vitest run src/features/football-tournaments/__tests__/fixture.test.ts`
Expected: FAIL — `expected undefined not to be null` (la propiedad `nextMatchSlot` no existe)

- [ ] **Step 3: Agregar `nextMatchSlot` en `fixture.ts`**

En el tipo `GeneratedBracketMatch`, agregá el campo:

```ts
export type GeneratedBracketMatch = {
  id: string;
  roundLabel: string;
  scheduledAt: string | null;
  homeTeamId: string | null;
  awayTeamId: string | null;
  nextMatchId: string | null;
  nextMatchSlot: MatchSlot | null;
};
```

Importá el tipo arriba del archivo:

```ts
import type { MatchSlot } from "./bracket-progression";
```

En `buildBracketFixture`, los tres literales de objeto que crean partidos deben inicializar `nextMatchSlot: null` (el de la primera ronda y el de `nextMatch`). Y donde hoy se enlaza:

```ts
      // Link matches
      prevHomeMatch.nextMatchId = nextMatch.id;
      prevHomeMatch.nextMatchSlot = "home";
      prevAwayMatch.nextMatchId = nextMatch.id;
      prevAwayMatch.nextMatchSlot = "away";
```

En `buildPlaceholderPlayoff`, el literal del `.map` inicializa `nextMatchSlot: null`, y el bucle de enlazado queda:

```ts
  while (roundSize > 1) {
    const nextRoundStart = roundStart + roundSize;
    for (let index = 0; index < roundSize; index += 1) {
      matches[roundStart + index].nextMatchId =
        matches[nextRoundStart + Math.floor(index / 2)].id;
      matches[roundStart + index].nextMatchSlot =
        index % 2 === 0 ? "home" : "away";
    }
    roundStart = nextRoundStart;
    roundSize /= 2;
  }
```

- [ ] **Step 4: Correr el test y verificar que pasa**

Run: `npx vitest run src/features/football-tournaments/__tests__/fixture.test.ts`
Expected: PASS

- [ ] **Step 5: Escribir el test de persistencia en la server action**

En `src/features/football-tournaments/__tests__/actions.test.ts`, buscá el test existente de `generateBracketFixture` (grep `generateBracketFixture`) y agregá junto a él:

```ts
  it("persiste el slot destino de cada cruce al generar la llave", async () => {
    requireAdminMock.mockResolvedValue({
      id: "admin-1",
      email: "admin@vixen.test",
      role: "admin",
    });
    insertMock.mockResolvedValue({ error: null });

    const semifinalA = crypto.randomUUID();
    const semifinalB = crypto.randomUUID();
    const finalId = crypto.randomUUID();

    const state = await generateBracketFixture(
      "tournament-1",
      "category-1",
      { ok: false, message: "" },
      formData({
        bracketData: JSON.stringify({
          startsAt: "2026-08-01",
          daysBetweenRounds: 7,
          initialMatches: [
            {
              id: semifinalA,
              depth: 1,
              roundLabel: "Semifinal",
              homeTeamId: "team-a",
              awayTeamId: "team-b",
              nextMatchId: finalId,
              isHomeSlotInNextMatch: true,
            },
            {
              id: semifinalB,
              depth: 1,
              roundLabel: "Semifinal",
              homeTeamId: "team-c",
              awayTeamId: "team-d",
              nextMatchId: finalId,
              isHomeSlotInNextMatch: false,
            },
            {
              id: finalId,
              depth: 0,
              roundLabel: "Final",
              homeTeamId: null,
              awayTeamId: null,
              nextMatchId: null,
              isHomeSlotInNextMatch: true,
            },
          ],
        }),
      }),
    );

    expect(state.ok).toBe(true);

    const inserted = insertMock.mock.calls[0][0] as Array<{
      round_label: string;
      next_match_slot: string | null;
    }>;
    const slots = inserted
      .filter((row) => row.round_label === "Semifinal")
      .map((row) => row.next_match_slot)
      .sort();

    expect(slots).toEqual(["away", "home"]);
    expect(
      inserted.find((row) => row.round_label === "Final")?.next_match_slot,
    ).toBeNull();
  });
```

- [ ] **Step 6: Correr el test y verificar que falla**

Run: `npx vitest run src/features/football-tournaments/__tests__/actions.test.ts -t "persiste el slot destino"`
Expected: FAIL — `expected [ undefined, undefined ] to equal [ 'away', 'home' ]`

- [ ] **Step 7: Persistir el slot en `actions.ts`**

En el tipo `BracketFixtureNode`, agregá el campo:

```ts
type BracketFixtureNode = {
  id: string;
  depth: number;
  roundLabel: string;
  homeTeamId: string | null;
  awayTeamId: string | null;
  nextMatchId: string | null;
  isHomeSlotInNextMatch: boolean;
};
```

En `isBracketFixtureNode`, sumá la validación:

```ts
    isNullableString(node.nextMatchId) &&
    typeof node.isHomeSlotInNextMatch === "boolean"
```

En `generateBracketFixture`, dentro del `.map` que arma las filas, agregá el campo después de `next_match_id`:

```ts
        next_match_id: nextMatchId,
        next_match_slot: nextMatchId
          ? node.isHomeSlotInNextMatch
            ? "home"
            : "away"
          : null,
```

En `generateGroupPlayoffFixture`, donde hoy se arman las filas de playoff (grep `next_match_id: match.nextMatchId`), agregá:

```ts
    next_match_id: match.nextMatchId,
    next_match_slot: match.nextMatchSlot,
```

Y en el otro literal de esa función que inserta partidos de zona (grep `next_match_id: null`), agregá `next_match_slot: null,`.

- [ ] **Step 8: Correr los tests y verificar que pasan**

Run: `npx vitest run src/features/football-tournaments/__tests__/actions.test.ts src/features/football-tournaments/__tests__/fixture.test.ts`
Expected: PASS

- [ ] **Step 9: Lint y commit**

```bash
npm run lint
git add src/features/football-tournaments/fixture.ts src/features/football-tournaments/actions.ts src/features/football-tournaments/__tests__/
git commit -m "feat: persiste el slot destino al generar llaves y playoffs"
```

---

### Task 4: Leer el slot y usarlo para dibujar el bracket

**Files:**
- Modify: `src/features/football-tournaments/data.ts`
- Modify: `src/features/football-tournaments/types.ts`
- Modify: `src/lib/tree-reconstructor.ts`
- Test: `src/lib/tree-reconstructor.test.ts` (crear si no existe)

**Interfaces:**
- Consumes: `MatchSlot` de Task 2; columna `next_match_slot` de Task 1.
- Produces: `AdminMatch.nextMatchSlot?: MatchSlot | null`, `UIFootballMatch.nextMatchSlot?: MatchSlot | null`, `PublicFootballMatch.nextMatchSlot?: MatchSlot | null`. `TreeReconstructableMatch` gana `nextMatchSlot?: MatchSlot | null`.

- [ ] **Step 1: Escribir el test que falla**

Creá `src/lib/tree-reconstructor.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import { reconstructTreeFromMatches } from "@/lib/tree-reconstructor";

describe("reconstructTreeFromMatches", () => {
  it("ubica arriba al alimentador del slot home sin importar el orden de los ids", () => {
    // El feeder "home" tiene un id que ordena DESPUÉS que el "away":
    // si se ordenara por id, quedaría abajo.
    const tree = reconstructTreeFromMatches([
      { id: "final", nextMatchId: null, roundLabel: "Final" },
      {
        id: "zz-semi-home",
        nextMatchId: "final",
        nextMatchSlot: "home",
        roundLabel: "Semifinal",
      },
      {
        id: "aa-semi-away",
        nextMatchId: "final",
        nextMatchSlot: "away",
        roundLabel: "Semifinal",
      },
    ]);

    const home = tree.find((node) => node.id === "zz-semi-home");
    const away = tree.find((node) => node.id === "aa-semi-away");

    expect(home?.isHomeSlotInNextMatch).toBe(true);
    expect(away?.isHomeSlotInNextMatch).toBe(false);
    expect(home?.gridRowStart).toBeLessThan(away?.gridRowStart as number);
  });

  it("cae al orden por id cuando no hay slot cargado", () => {
    const tree = reconstructTreeFromMatches([
      { id: "final", nextMatchId: null, roundLabel: "Final" },
      { id: "bb-semi", nextMatchId: "final", roundLabel: "Semifinal" },
      { id: "aa-semi", nextMatchId: "final", roundLabel: "Semifinal" },
    ]);

    const first = tree.find((node) => node.id === "aa-semi");
    const second = tree.find((node) => node.id === "bb-semi");

    expect(first?.gridRowStart).toBeLessThan(second?.gridRowStart as number);
  });
});
```

- [ ] **Step 2: Correr el test y verificar que falla**

Run: `npx vitest run src/lib/tree-reconstructor.test.ts`
Expected: FAIL — el primer test falla porque hoy ordena por id (`aa-semi-away` queda arriba)

- [ ] **Step 3: Usar el slot en `tree-reconstructor.ts`**

Agregá el campo al tipo:

```ts
import type { MatchSlot } from "@/features/football-tournaments/bracket-progression";

export type TreeReconstructableMatch = {
  id: string;
  nextMatchId?: string | null;
  nextMatchSlot?: MatchSlot | null;
  homeTeamId?: string | null;
  awayTeamId?: string | null;
  roundLabel?: string;
};
```

Reemplazá el bloque de ordenamiento dentro de `traverse` (el que hoy dice "Ideally we would know which one is home/away, but since we don't"):

```ts
    // Si conocemos el slot destino, lo usamos: el alimentador del lado "home"
    // se dibuja arriba. Si falta el dato (llaves previas a la migración),
    // caemos al orden por id, que es estable.
    const hasSlots = children.some((child) => Boolean(child.nextMatchSlot));

    if (hasSlots) {
      children.sort((a, b) => {
        const rank = (slot: MatchSlot | null | undefined) =>
          slot === "home" ? 0 : 1;
        return rank(a.nextMatchSlot) - rank(b.nextMatchSlot);
      });
    } else {
      children.sort((a, b) => a.id.localeCompare(b.id));
    }
```

- [ ] **Step 4: Correr el test y verificar que pasa**

Run: `npx vitest run src/lib/tree-reconstructor.test.ts`
Expected: PASS

- [ ] **Step 5: Propagar el campo por los tipos y los selects**

En `src/features/football-tournaments/types.ts`, agregá a `PublicFootballMatch` y a `UIFootballMatch`:

```ts
  nextMatchSlot?: MatchSlot | null;
```

con `import type { MatchSlot } from "./bracket-progression";` arriba.

En `src/features/football-tournaments/data.ts`:
- Agregá `nextMatchSlot?: MatchSlot | null;` al tipo `AdminMatch` y `next_match_slot?: string | null;` a los tipos de fila que hoy declaran `next_match_id`.
- Agregá `next_match_slot` a cada lista de columnas del `select` que ya pide `next_match_id` (buscá con `grep -n "next_match_id" src/features/football-tournaments/data.ts`).
- En cada mapeo que hoy hace `nextMatchId: row.next_match_id ?? null`, agregá al lado:

```ts
    nextMatchSlot: (row.next_match_slot as MatchSlot | null) ?? null,
```

En `src/components/football/shared/TournamentBracket.tsx`, `PublicBracketViewer.tsx` y `CompactFixture.tsx`, donde ya se pasa `nextMatchId: match.nextMatchId`, agregá `nextMatchSlot: match.nextMatchSlot`.

- [ ] **Step 6: Correr toda la suite y typecheck**

Run: `npm test && npx tsc --noEmit`
Expected: PASS, sin errores de tipos

- [ ] **Step 7: Lint y commit**

```bash
npm run lint
git add src/features/football-tournaments/data.ts src/features/football-tournaments/types.ts src/lib/tree-reconstructor.ts src/lib/tree-reconstructor.test.ts src/components/football/
git commit -m "feat: dibuja la llave usando el slot destino en vez del orden por id"
```

---

### Task 5: El ganador avanza al guardar el resultado

**Files:**
- Modify: `src/features/football-tournaments/actions.ts`
- Test: `src/features/football-tournaments/__tests__/actions.test.ts`

**Interfaces:**
- Consumes: `resolveMatchWinner`, `findAdvancementBlock`, `MatchSlot` de Task 2; `next_match_slot` de Task 1.
- Produces: helper interno `advanceWinnerToNextMatch(supabase, match, result)` que devuelve `{ blocked: string } | { advancedTo: string | null }`. `MatchResultMatchContext` gana `next_match_slot: string | null`.

- [ ] **Step 1: Escribir los tests que fallan**

Agregá a `src/features/football-tournaments/__tests__/actions.test.ts`:

```ts
  it("siembra al ganador en el slot del partido siguiente", async () => {
    requireAdminMock.mockResolvedValue({
      id: "admin-1",
      email: "admin@vixen.test",
      role: "admin",
    });
    // 1. el partido que se está cargando
    maybeSingleMock.mockResolvedValueOnce({
      data: {
        id: "match-1",
        tournament_id: "tournament-1",
        category_id: "category-1",
        home_team_id: "team-home",
        away_team_id: "team-away",
        group_id: null,
        next_match_id: "match-final",
        next_match_slot: "away",
        result_locked_at: null,
        football_tournaments: { format: "cup" },
      },
      error: null,
    });
    // 2. el partido siguiente (pre-flight)
    maybeSingleMock.mockResolvedValueOnce({
      data: {
        id: "match-final",
        round_label: "Final",
        home_team_id: null,
        away_team_id: null,
        home_score: null,
        away_score: null,
        status: "scheduled",
      },
      error: null,
    });
    // 3. el update del resultado
    maybeSingleMock.mockResolvedValueOnce({
      data: { id: "match-1" },
      error: null,
    });

    const state = await updateMatchResult(
      "tournament-1",
      "match-1",
      { ok: false, message: "" },
      formData({ homeScore: "1", awayScore: "3" }),
    );

    expect(state.ok).toBe(true);
    expect(updateMock).toHaveBeenCalledWith({ away_team_id: "team-away" });
    expect(eqMock).toHaveBeenCalledWith("id", "match-final");
  });

  it("bloquea la correccion si la ronda siguiente ya tiene resultado", async () => {
    requireAdminMock.mockResolvedValue({
      id: "admin-1",
      email: "admin@vixen.test",
      role: "admin",
    });
    maybeSingleMock.mockResolvedValueOnce({
      data: {
        id: "match-1",
        tournament_id: "tournament-1",
        category_id: "category-1",
        home_team_id: "team-home",
        away_team_id: "team-away",
        group_id: null,
        next_match_id: "match-final",
        next_match_slot: "home",
        result_locked_at: null,
        football_tournaments: { format: "cup" },
      },
      error: null,
    });
    maybeSingleMock.mockResolvedValueOnce({
      data: {
        id: "match-final",
        round_label: "Final",
        home_team_id: "team-away",
        away_team_id: "team-otro",
        home_score: 2,
        away_score: 1,
        status: "completed",
      },
      error: null,
    });

    const state = await updateMatchResult(
      "tournament-1",
      "match-1",
      { ok: false, message: "" },
      formData({ homeScore: "3", awayScore: "0" }),
    );

    expect(state).toEqual<ActionState>({
      ok: false,
      message:
        "No se puede cambiar el ganador: Final ya tiene resultado cargado. Borrá ese resultado primero.",
    });
    // no debe haber tocado la base
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("rechaza cargar un resultado si faltan definir los equipos", async () => {
    requireAdminMock.mockResolvedValue({
      id: "admin-1",
      email: "admin@vixen.test",
      role: "admin",
    });
    maybeSingleMock.mockResolvedValueOnce({
      data: {
        id: "match-final",
        tournament_id: "tournament-1",
        category_id: "category-1",
        home_team_id: null,
        away_team_id: null,
        group_id: null,
        next_match_id: null,
        next_match_slot: null,
        result_locked_at: null,
        football_tournaments: { format: "cup" },
      },
      error: null,
    });

    const state = await updateMatchResult(
      "tournament-1",
      "match-final",
      { ok: false, message: "" },
      formData({ homeScore: "1", awayScore: "0" }),
    );

    expect(state).toEqual<ActionState>({
      ok: false,
      message: "Faltan definir los equipos de este partido.",
    });
    expect(updateMock).not.toHaveBeenCalled();
  });
```

- [ ] **Step 2: Correr los tests y verificar que fallan**

Run: `npx vitest run src/features/football-tournaments/__tests__/actions.test.ts -t "siembra al ganador"`
Expected: FAIL — `updateMock` no fue llamado con `{ away_team_id: "team-away" }`

- [ ] **Step 3: Implementar el guard y el helper de avance**

En `actions.ts`, agregá el import:

```ts
import {
  findAdvancementBlock,
  resolveMatchWinner,
  type MatchSlot,
} from "./bracket-progression";
```

Agregá `next_match_slot: string | null;` al tipo `MatchResultMatchContext`, y agregá `next_match_slot` a los dos strings de `select` que hoy piden `next_match_id` en `updateMatchResult` y `submitViewerMatchResult`.

Agregá estas dos funciones antes de `updateMatchResult`:

```ts
function validateMatchTeams(match: MatchResultMatchContext): ActionState | null {
  if (!match.home_team_id || !match.away_team_id) {
    return {
      ok: false,
      message: "Faltan definir los equipos de este partido.",
    };
  }

  return null;
}

type AdvancementOutcome =
  | { blocked: string; advancedTo?: never }
  | { blocked?: never; advancedTo: string | null };

/**
 * Siembra al ganador en el partido siguiente de la llave.
 *
 * El chequeo de bloqueo corre ANTES de guardar el resultado, para que nunca
 * quede el resultado escrito y el avance a medias.
 */
async function advanceWinnerToNextMatch(
  supabase: SupabaseServerClient,
  match: MatchResultMatchContext,
  result: {
    home_score: number;
    away_score: number;
    home_penalty_score: number | null;
    away_penalty_score: number | null;
  },
): Promise<AdvancementOutcome> {
  if (!match.next_match_id || !match.next_match_slot) {
    return { advancedTo: null };
  }

  const winnerTeamId = resolveMatchWinner({
    homeTeamId: match.home_team_id,
    awayTeamId: match.away_team_id,
    homeScore: result.home_score,
    awayScore: result.away_score,
    homePenaltyScore: result.home_penalty_score,
    awayPenaltyScore: result.away_penalty_score,
  });

  if (!winnerTeamId) return { advancedTo: null };

  const slot = match.next_match_slot as MatchSlot;
  const { data: nextMatch, error } = await supabase
    .from("football_matches")
    .select(
      "id, round_label, home_team_id, away_team_id, home_score, away_score, status",
    )
    .eq("id", match.next_match_id)
    .maybeSingle();

  if (error || !nextMatch) {
    return { blocked: "No pudimos encontrar el partido siguiente de la llave." };
  }

  const target = nextMatch as unknown as {
    id: string;
    round_label: string;
    home_team_id: string | null;
    away_team_id: string | null;
    home_score: number | null;
    away_score: number | null;
    status: string;
  };

  const block = findAdvancementBlock(
    {
      roundLabel: target.round_label,
      homeTeamId: target.home_team_id,
      awayTeamId: target.away_team_id,
      homeScore: target.home_score,
      awayScore: target.away_score,
      status: target.status,
    },
    slot,
    winnerTeamId,
  );

  if (block) return { blocked: block };

  const currentTeamId =
    slot === "home" ? target.home_team_id : target.away_team_id;

  if (currentTeamId === winnerTeamId) {
    return { advancedTo: target.round_label };
  }

  const { error: advanceError } = await supabase
    .from("football_matches")
    .update(
      slot === "home"
        ? { home_team_id: winnerTeamId }
        : { away_team_id: winnerTeamId },
    )
    .eq("id", target.id);

  if (advanceError) {
    return { blocked: advanceError.message };
  }

  return { advancedTo: target.round_label };
}
```

- [ ] **Step 4: Conectarlo en `updateMatchResult`**

Justo después de obtener `matchContext` y antes de `validatePenaltyResult`, agregá el guard:

```ts
  const matchContext = match as unknown as MatchResultMatchContext;
  const teamsError = validateMatchTeams(matchContext);

  if (teamsError) return teamsError;

  const penaltyError = validatePenaltyResult(payload, matchContext);

  if (penaltyError) return penaltyError;
```

Después del chequeo de `eventRows.error` y **antes** del `supabase.from("football_matches").update(payload.result)`, agregá:

```ts
  const advancement = await advanceWinnerToNextMatch(
    supabase,
    matchContext,
    payload.result,
  );

  if (advancement.blocked) {
    return { ok: false, message: advancement.blocked };
  }
```

Y el return final pasa a:

```ts
  return {
    ok: true,
    message: advancement.advancedTo
      ? `Resultado guardado. El ganador pasa a ${advancement.advancedTo}.`
      : "Resultado guardado.",
  };
```

- [ ] **Step 5: Conectarlo igual en `submitViewerMatchResult`**

Mismo patrón: `validateMatchTeams` después de armar `matchContext`; `advanceWinnerToNextMatch` antes del `update` que escribe el resultado y el lock; y el return final:

```ts
  return {
    ok: true,
    message: advancement.advancedTo
      ? `Resultado final cargado. El ganador pasa a ${advancement.advancedTo}.`
      : "Resultado final cargado.",
  };
```

- [ ] **Step 6: Correr los tests y verificar que pasan**

Run: `npx vitest run src/features/football-tournaments/__tests__/actions.test.ts`
Expected: PASS. Los tests existentes que esperan `"Resultado guardado."` exacto siguen verdes porque usan `next_match_id: null`. Si alguno rompe por el nuevo campo `next_match_slot` faltante en su mock, agregale `next_match_slot: null`.

- [ ] **Step 7: Lint y commit**

```bash
npm run lint && npm test
git add src/features/football-tournaments/actions.ts src/features/football-tournaments/__tests__/actions.test.ts
git commit -m "feat: el ganador de copa avanza a la ronda siguiente al cargar el resultado"
```

---

### Task 6: Primitivo `AdminSheet`

**Files:**
- Create: `src/components/admin/AdminSheet.tsx`
- Test: `src/components/admin/AdminSheet.test.tsx`

**Interfaces:**
- Consumes: `@radix-ui/react-dialog` (ya es dependencia).
- Produces:

```ts
type AdminSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
};
export function AdminSheet(props: AdminSheetProps): JSX.Element;
```

- [ ] **Step 1: Escribir el test que falla**

Creá `src/components/admin/AdminSheet.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { AdminSheet } from "@/components/admin/AdminSheet";

describe("AdminSheet", () => {
  it("muestra titulo y contenido cuando esta abierto", () => {
    render(
      <AdminSheet open onOpenChange={() => {}} title="Plantel de Boca">
        <p>Contenido del panel</p>
      </AdminSheet>,
    );

    expect(
      screen.getByRole("dialog", { name: "Plantel de Boca" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Contenido del panel")).toBeInTheDocument();
  });

  it("no renderiza nada cuando esta cerrado", () => {
    render(
      <AdminSheet open={false} onOpenChange={() => {}} title="Plantel de Boca">
        <p>Contenido del panel</p>
      </AdminSheet>,
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("avisa que se cerro al apretar Escape", async () => {
    const onOpenChange = vi.fn();
    const user = userEvent.setup();

    render(
      <AdminSheet open onOpenChange={onOpenChange} title="Plantel de Boca">
        <p>Contenido del panel</p>
      </AdminSheet>,
    );

    await user.keyboard("{Escape}");

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("cierra desde el boton de cerrar", async () => {
    const onOpenChange = vi.fn();
    const user = userEvent.setup();

    render(
      <AdminSheet open onOpenChange={onOpenChange} title="Plantel de Boca">
        <p>Contenido del panel</p>
      </AdminSheet>,
    );

    await user.click(screen.getByRole("button", { name: "Cerrar" }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
```

- [ ] **Step 2: Correr el test y verificar que falla**

Run: `npx vitest run src/components/admin/AdminSheet.test.tsx`
Expected: FAIL — no se puede resolver `@/components/admin/AdminSheet`

- [ ] **Step 3: Escribir el componente**

Creá `src/components/admin/AdminSheet.tsx`:

```tsx
"use client";

import type { ReactNode } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";

type AdminSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
};

/**
 * Panel deslizante: entra desde abajo en mobile y desde la derecha en escritorio.
 * Reemplaza al panel lateral fijo, que empujaba el contenido y lo tapaba.
 */
export function AdminSheet({
  open,
  onOpenChange,
  title,
  description,
  children,
}: AdminSheetProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in" />
        <Dialog.Content
          className="fixed inset-x-0 bottom-0 z-50 flex max-h-[90dvh] flex-col rounded-t-2xl border border-white/10 bg-[#0F1411] shadow-[0_-12px_60px_rgb(0_0_0_/_0.55)] sm:inset-y-0 sm:left-auto sm:right-0 sm:max-h-none sm:w-[min(26rem,100vw)] sm:rounded-none sm:rounded-l-2xl sm:border-y-0 sm:border-r-0"
        >
          <div className="flex items-start justify-between gap-4 border-b border-white/10 bg-white/[0.02] p-5">
            <div className="min-w-0">
              <Dialog.Title className="text-sm font-bold uppercase tracking-wider text-white">
                {title}
              </Dialog.Title>
              {description ? (
                <Dialog.Description className="mt-1 text-xs text-white/50">
                  {description}
                </Dialog.Description>
              ) : (
                <Dialog.Description className="sr-only">
                  {title}
                </Dialog.Description>
              )}
            </div>
            <Dialog.Close asChild>
              <button
                type="button"
                aria-label="Cerrar"
                className="grid size-11 shrink-0 place-items-center rounded-full bg-white/5 text-white/60 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
              >
                <X size={16} aria-hidden="true" />
              </button>
            </Dialog.Close>
          </div>

          <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto">
            {children}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
```

- [ ] **Step 4: Correr el test y verificar que pasa**

Run: `npx vitest run src/components/admin/AdminSheet.test.tsx`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
npm run lint
git add src/components/admin/AdminSheet.tsx src/components/admin/AdminSheet.test.tsx
git commit -m "feat: agrega AdminSheet, drawer reusable para el panel admin"
```

---

### Task 7: El panel de partido deja de tapar el bracket

**Files:**
- Modify: `src/components/admin/MatchSidePanel.tsx`
- Modify: `src/components/admin/BracketResultsViewer.tsx`
- Modify: `src/components/admin/LeagueMatchesViewer.tsx`

**Interfaces:**
- Consumes: `AdminSheet` de Task 6.
- Produces: `MatchSidePanel` mantiene la misma prop `onClose`, pero ahora renderiza dentro de `AdminSheet`.

- [ ] **Step 1: Reescribir `MatchSidePanel` sobre `AdminSheet`**

Reemplazá el `<div className="w-full h-[600px] md:w-[360px] ...">` y su cabecera propia por el drawer. El cuerpo (formulario de resultado, asignación de veedor, edición) queda igual:

```tsx
"use client";

import { AdminSheet } from "./AdminSheet";
// ...resto de imports igual que antes, sin X de lucide-react

export function MatchSidePanel({
  match,
  teams,
  viewers,
  rosterEntries,
  isKnockout,
  updateResultAction,
  assignViewerAction,
  updateMatchAction,
  onClose,
  roundLabel,
}: MatchSidePanelProps) {
  const getTeamName = (id: string | null) => {
    if (!id) return "Por definirse";
    return teams.find((t) => t.id === id)?.name || "Por definirse";
  };

  const homeTeamName = getTeamName(match.homeTeamId);
  const awayTeamName = getTeamName(match.awayTeamId);

  return (
    <AdminSheet
      open
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      title={roundLabel ?? match.roundLabel}
      description={
        match.scheduledAt
          ? new Date(match.scheduledAt).toLocaleString("es-AR", {
              dateStyle: "medium",
              timeStyle: "short",
            })
          : "Sin fecha asignada"
      }
    >
      <div className="p-5">
        <h4 className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-accent)]">
          Resultado
        </h4>
        <p className="mb-4 text-xs leading-5 text-[var(--color-muted)]">
          {homeTeamName} vs {awayTeamName}
        </p>
        <MatchResultForm
          action={updateResultAction}
          homeScore={match.homeScore}
          awayScore={match.awayScore}
          homePenaltyScore={match.homePenaltyScore}
          awayPenaltyScore={match.awayPenaltyScore}
          homeTeamId={match.homeTeamId}
          awayTeamId={match.awayTeamId}
          isKnockout={isKnockout}
          rosterEntries={rosterEntries}
          matchEvents={match.events}
        />
      </div>

      <div className="border-t border-white/5 p-5">
        <MatchViewerAssignmentForm
          action={assignViewerAction}
          viewers={viewers}
          assignedViewerId={match.assignedViewerId}
        />
      </div>

      <div className="flex justify-center border-t border-white/5 p-5 pb-8">
        <MatchEditDialog
          action={updateMatchAction}
          match={match}
          teams={teams}
        />
      </div>
    </AdminSheet>
  );
}
```

- [ ] **Step 2: Sacar el wrapper `flex` de los dos viewers**

En `BracketResultsViewer.tsx` y en `LeagueMatchesViewer.tsx`, reemplazá:

```tsx
    <div className="flex gap-4">
      <div className="flex-1 min-w-0">
        {/* bracket o fixture */}
      </div>
      {selectedMatch ? (<MatchSidePanel ... />) : null}
    </div>
```

por:

```tsx
    <>
      {/* bracket o fixture, sin wrapper */}
      {selectedMatch ? (<MatchSidePanel ... />) : null}
    </>
```

El bracket ya no compite por el ancho con el panel: el drawer flota encima con overlay.

- [ ] **Step 3: Verificar en el navegador**

```bash
npm run dev
```

Abrí `/admin/torneos/<id>?tab=partidos` en un torneo de copa, clickeá una semifinal. Verificá:
- El drawer entra desde la derecha y **no** tapa la Final: el bracket queda detrás del overlay, completo.
- En viewport angosto (< 640px) el drawer entra desde abajo.
- Escape lo cierra.

- [ ] **Step 4: Correr la suite y commit**

```bash
npm test && npm run lint
git add src/components/admin/MatchSidePanel.tsx src/components/admin/BracketResultsViewer.tsx src/components/admin/LeagueMatchesViewer.tsx
git commit -m "fix: el panel de partido pasa a drawer y deja de tapar la llave"
```

---

### Task 8: Formulario de resultado más liviano

**Files:**
- Modify: `src/components/admin/AdminForms.tsx` (`MatchResultForm`)
- Test: `src/components/admin/AdminForms.test.tsx`

**Interfaces:**
- Consumes: props actuales de `MatchResultForm`, sin cambios de firma.
- Produces: mismo `name` de campos en el `FormData` (`homeScore`, `awayScore`, `homePenaltyScore`, `awayPenaltyScore`, `goals:<id>`, `yellowCards:<id>`, `redCards:<id>`). No cambia el contrato con el servidor.

- [ ] **Step 1: Escribir los tests que fallan**

Agregá a `src/components/admin/AdminForms.test.tsx`:

```tsx
  it("deshabilita la carga cuando faltan definir los equipos", () => {
    render(
      <MatchResultForm
        action={async () => ({ ok: true, message: "" })}
        homeScore={null}
        awayScore={null}
        homeTeamId={null}
        awayTeamId={null}
        isKnockout
      />,
    );

    expect(screen.getByRole("button", { name: /guardar resultado/i })).toBeDisabled();
    expect(
      screen.getByText(/faltan definir los equipos/i),
    ).toBeInTheDocument();
  });

  it("mantiene el detalle de goles y tarjetas colapsado por defecto", () => {
    render(
      <MatchResultForm
        action={async () => ({ ok: true, message: "" })}
        homeScore={0}
        awayScore={0}
        homeTeamId="team-home"
        awayTeamId="team-away"
        rosterEntries={[
          {
            id: "roster-1",
            teamId: "team-home",
            playerId: "player-1",
            shirtNumber: 10,
            displayName: "Riquelme",
          },
        ]}
      />,
    );

    const details = screen.getByText(/detalle de goles y tarjetas/i).closest("details");

    expect(details).not.toBeNull();
    expect((details as HTMLDetailsElement).open).toBe(false);
  });
```

Importá `MatchResultForm` si el archivo de test todavía no lo hace.

- [ ] **Step 2: Correr los tests y verificar que fallan**

Run: `npx vitest run src/components/admin/AdminForms.test.tsx -t "faltan definir"`
Expected: FAIL — el botón no está deshabilitado

- [ ] **Step 3: Agregar el guard de equipos**

En `MatchResultForm`, después de los `useMemo` existentes:

```ts
  const hasBothTeams = Boolean(homeTeamId && awayTeamId);
```

Antes del botón de submit, agregá el aviso:

```tsx
      {!hasBothTeams ? (
        <p className="rounded-xl border border-[var(--color-warm)]/25 bg-[var(--color-warm)]/8 p-3 text-xs leading-5 text-white/80">
          Faltan definir los equipos de este partido. Se van a completar cuando
          se carguen los resultados de la ronda anterior.
        </p>
      ) : null}
```

Y el botón:

```tsx
      <button
        type="submit"
        disabled={isPending || hasEventOverflow || !hasBothTeams}
        className={`${primaryButtonClass} w-full sm:w-full`}
      >
        {isPending ? "Guardando..." : submitLabel}
      </button>
```

- [ ] **Step 4: Compactar el bloque de penales**

Reemplazá el bloque `{shouldShowPenalties ? (...) : null}` por una versión de una fila (sigue visible siempre que haya empate en knockout, porque es un campo requerido):

```tsx
      {shouldShowPenalties ? (
        <div className="grid gap-2 rounded-xl border border-[var(--color-accent)]/25 bg-[var(--color-accent)]/5 p-3 sm:grid-cols-[auto_minmax(0,1fr)_minmax(0,1fr)] sm:items-center sm:gap-3">
          <span className={labelClass}>Penales</span>
          <input
            type="number"
            name="homePenaltyScore"
            aria-label="Penales del local"
            min={0}
            value={localHomePenalties}
            onChange={(event) =>
              setLocalHomePenalties(Math.max(0, Number(event.target.value)))
            }
            className={inputClass}
          />
          <input
            type="number"
            name="awayPenaltyScore"
            aria-label="Penales del visitante"
            min={0}
            value={localAwayPenalties}
            onChange={(event) =>
              setLocalAwayPenalties(Math.max(0, Number(event.target.value)))
            }
            className={inputClass}
          />
        </div>
      ) : null}
```

- [ ] **Step 5: Colapsar el detalle de goles y tarjetas**

Envolvé el bloque `{hasRosterEntries ? (<div className="grid gap-4 rounded-2xl ...">...</div>) : (...)}` en un `<details>`. El contenido interno (contadores asignados, aviso de overflow, y las dos listas Local/Visitante) queda **exactamente igual**; solo cambia el envoltorio:

```tsx
      {hasRosterEntries ? (
        <details className="rounded-2xl border border-white/10 bg-white/[0.025]">
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 p-4 text-sm font-semibold text-white marker:content-none">
            <span>Detalle de goles y tarjetas</span>
            <span className="text-xs font-semibold text-[var(--color-muted)]">
              {loadedEventCount > 0
                ? `${loadedEventCount} cargados`
                : "Opcional"}
            </span>
          </summary>
          <div className="grid gap-4 border-t border-white/8 p-4">
            {/* contenido actual sin cambios */}
          </div>
        </details>
      ) : (
        <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4 text-xs leading-5 text-[var(--color-muted)]">
          No hay jugadores cargados para estos equipos. Podés guardar el
          resultado igual.
        </div>
      )}
```

Y calculá el contador junto a los otros `useMemo`:

```ts
  const loadedEventCount = useMemo(
    () =>
      Object.values(eventCounts).reduce(
        (total, counts) =>
          total + counts.goals + counts.yellowCards + counts.redCards,
        0,
      ),
    [eventCounts],
  );
```

- [ ] **Step 6: Correr los tests y verificar que pasan**

Run: `npx vitest run src/components/admin/AdminForms.test.tsx`
Expected: PASS. Si algún test existente busca los inputs de eventos, ahora están dentro de un `<details>` cerrado — en jsdom siguen estando en el DOM y accesibles por `getByLabelText`, así que no deberían romperse. Si alguno usa `toBeVisible()`, cambialo a abrir el `<details>` primero con `await user.click(screen.getByText(/detalle de goles/i))`.

- [ ] **Step 7: Lint y commit**

```bash
npm run lint
git add src/components/admin/AdminForms.tsx src/components/admin/AdminForms.test.tsx
git commit -m "feat: aliviana el formulario de resultado y bloquea partidos sin equipos"
```

---

### Task 9: El bracket deja de tener lienzo muerto

**Files:**
- Modify: `src/components/football/shared/TournamentBracket.tsx`

**Interfaces:**
- Consumes: `UIFootballMatch` con `nextMatchSlot` (Task 4).
- Produces: sin cambios de API pública.

- [ ] **Step 1: Medir el ancho real del contenedor**

Hoy la escala se calcula contra la constante `availableWidth = 900`, y la altura está fija en `h-[600px]`. Con 3 partidos eso deja dos tercios de pantalla en negro.

Agregá el import y el medidor:

```tsx
import { useState, useMemo, useRef, useLayoutEffect } from "react";
```

Dentro del componente, antes del `return`:

```tsx
  const containerRef = useRef<HTMLDivElement>(null);
  const [measuredWidth, setMeasuredWidth] = useState(900);

  useLayoutEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const observer = new ResizeObserver(([entry]) => {
      setMeasuredWidth(entry.contentRect.width);
    });

    observer.observe(node);
    return () => observer.disconnect();
  }, []);
```

- [ ] **Step 2: Derivar altura y escala del contenido**

Reemplazá el bloque que hoy calcula `availableWidth` / `availableHeight` / `fitScale` / `minZoom`:

```tsx
  const availableWidth = measuredWidth || 900;
  // La altura sigue al contenido en vez de quedar clavada en 600px:
  // una llave de 3 partidos no necesita media pantalla en negro.
  const viewportHeight = Math.min(680, Math.max(320, innerHeight));
  const fitScale = Math.min(
    1.1,
    Math.min(availableWidth / innerWidth, viewportHeight / innerHeight),
  );
  const isSmall = innerWidth <= availableWidth && innerHeight <= viewportHeight;
  const minZoom = isSmall ? fitScale : fitScale * 0.5;
```

Y el contenedor raíz pasa de `h-[600px]` a la altura calculada:

```tsx
    <div
      ref={containerRef}
      style={{ height: viewportHeight }}
      className="relative isolate w-full overflow-hidden bg-[#111111] sm:rounded-xl sm:border border-white/5"
    >
```

Agregá `measuredWidth` a la key del `TransformWrapper` para que recalcule al cambiar el tamaño:

```tsx
      <TransformWrapper
        key={`bracket-${matches.length}-${Math.round(availableWidth)}`}
```

- [ ] **Step 3: Verificar en el navegador**

```bash
npm run dev
```

Abrí un torneo de copa con 3 partidos (2 semis + final) en `/admin/torneos/<id>?tab=partidos`. Verificá:
- No hay una franja negra gigante debajo de la llave.
- Al angostar la ventana, la llave se reescala en vez de recortarse.

- [ ] **Step 4: Correr la suite y commit**

```bash
npm test && npm run lint
git add src/components/football/shared/TournamentBracket.tsx
git commit -m "fix: la llave adapta su alto y escala al espacio real disponible"
```

---

### Task 10: Estadísticas de categoría colapsables

**Files:**
- Modify: `src/app/admin/(protected)/torneos/[id]/page.tsx` (`CategoryMatchStatsPanel`)

**Interfaces:**
- Consumes: `buildCategoryMatchStats` (ya existe en el mismo archivo).
- Produces: sin cambios de API.

- [ ] **Step 1: Colapsar cuando no hay datos**

Hoy, sin eventos cargados, el panel muestra tres cajas grandes que dicen "Sin goles asignados", "Sin tarjetas cargadas" y una lista de equipos en cero. Agregá el corto-circuito al principio del `return` de `CategoryMatchStatsPanel`, después de calcular `stats` y `hasEvents`:

```tsx
  if (!hasEvents) {
    return (
      <AdminPanel className="flex flex-wrap items-center justify-between gap-3 p-4 sm:p-5">
        <p className="text-sm text-[var(--color-muted)]">
          Todavía no hay goles ni tarjetas cargados en esta categoría.
        </p>
        <AdminStatusPill tone="muted">Sin eventos</AdminStatusPill>
      </AdminPanel>
    );
  }
```

El resto del componente queda igual para cuando sí hay eventos.

- [ ] **Step 2: Verificar en el navegador**

```bash
npm run dev
```

En una categoría sin eventos, el panel es una línea. Cargá un gol desde el drawer de un partido y verificá que vuelve a expandirse con la grilla de tres columnas.

- [ ] **Step 3: Correr la suite y commit**

```bash
npm test && npm run lint
git add "src/app/admin/(protected)/torneos/[id]/page.tsx"
git commit -m "fix: colapsa el panel de estadisticas cuando no hay eventos cargados"
```

---

### Task 11: Equipos en cards con drawer de plantel

**Files:**
- Create: `src/components/admin/TeamCard.tsx`
- Modify: `src/app/admin/(protected)/torneos/[id]/page.tsx` (`TeamsTab`)
- Test: `src/app/admin/(protected)/torneos/[id]/page.test.tsx`

**Interfaces:**
- Consumes: `AdminSheet` (Task 6); `AdminTeam`, `AdminRosterEntry`, `AdminPlayer` de `data.ts`; los diálogos existentes `TeamEditDialog`, `TeamRemoveDialog`, `RosterEntryCreateDialog`, `RosterEntryEditDialog`, `RosterEntryRemoveDialog`.
- Produces:

```ts
type TeamCardProps = {
  team: AdminTeam;
  rosterEntries: AdminRosterEntry[];
  editSlot: ReactNode;
  removeSlot: ReactNode;
  rosterCreateSlot: ReactNode;
  renderRosterEntry: (entry: AdminRosterEntry) => ReactNode;
};
export function TeamCard(props: TeamCardProps): JSX.Element;
```

Los `*Slot` reciben los diálogos ya bindeados desde el server component, porque las server actions no pueden crearse dentro de un client component.

- [ ] **Step 1: Escribir el test que falla**

`src/app/admin/(protected)/torneos/[id]/page.test.tsx` renderiza con
`render(await AdminTournamentWorkspacePage({ params, searchParams }))` y consulta
con `screen`. Los mocks se sobreescriben por test con `vi.mocked(fn).mockResolvedValueOnce(...)`.
Seguí ese patrón y agregá:

```tsx
  it("muestra los equipos como cards con la cuenta de jugadores", async () => {
    vi.mocked(getAdminTeams).mockResolvedValueOnce([
      {
        id: "team-1",
        name: "Boca Juniors",
        shortName: "BOC",
        photoUrl: null,
        captainName: null,
        contactPhone: null,
        notes: null,
      },
    ] as never);
    vi.mocked(getAdminRosterEntries).mockResolvedValueOnce([
      { id: "roster-1", teamId: "team-1" },
      { id: "roster-2", teamId: "team-1" },
    ] as never);

    render(
      await AdminTournamentWorkspacePage({
        params: Promise.resolve({ id: "tournament-1" }),
        searchParams: Promise.resolve({ tab: "equipos" }),
      }),
    );

    expect(screen.getByText("Boca Juniors")).toBeInTheDocument();
    expect(screen.getByText("2 jugadores")).toBeInTheDocument();
    // Ya no existe la columna que mezclaba notas, acciones y plantel:
    expect(screen.queryByText("Notas privadas")).not.toBeInTheDocument();
  });
```

Agregá `getAdminRosterEntries` (y `getAdminAvailableTeams` / `getAdminAvailablePlayers`
si no están) al `vi.mock` de `@/features/football-tournaments/data` y al bloque de
imports del test.

- [ ] **Step 2: Correr el test y verificar que falla**

Run: `npx vitest run "src/app/admin/(protected)/torneos/[id]/page.test.tsx"`
Expected: FAIL — no aparece "2 jugadores"

- [ ] **Step 3: Escribir `TeamCard`**

Creá `src/components/admin/TeamCard.tsx`:

```tsx
"use client";

import { useState, type ReactNode } from "react";
import Image from "next/image";
import { Users } from "lucide-react";

import type { AdminRosterEntry, AdminTeam } from "@/features/football-tournaments/data";
import { AdminSheet } from "./AdminSheet";

type TeamCardProps = {
  team: AdminTeam;
  rosterEntries: AdminRosterEntry[];
  editSlot: ReactNode;
  removeSlot: ReactNode;
  rosterCreateSlot: ReactNode;
  renderRosterEntry: (entry: AdminRosterEntry) => ReactNode;
};

export function TeamCard({
  team,
  rosterEntries,
  editSlot,
  removeSlot,
  rosterCreateSlot,
  renderRosterEntry,
}: TeamCardProps) {
  const [rosterOpen, setRosterOpen] = useState(false);
  const playerCount = rosterEntries.length;

  return (
    <article className="flex flex-col gap-4 rounded-xl border border-white/10 bg-[#121212] p-4">
      <div className="flex min-w-0 items-center gap-3">
        {team.photoUrl ? (
          <Image
            src={team.photoUrl}
            alt=""
            width={48}
            height={48}
            unoptimized
            className="size-12 shrink-0 rounded-[0.7rem] object-cover"
          />
        ) : (
          <span className="grid size-12 shrink-0 place-items-center rounded-[0.7rem] border border-white/10 bg-white/[0.035] text-base font-semibold text-white">
            {team.name.slice(0, 2).toUpperCase()}
          </span>
        )}
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold text-white">
            {team.name}
          </h3>
          {team.shortName ? (
            <p className="truncate text-xs text-[var(--color-muted)]">
              {team.shortName}
            </p>
          ) : null}
        </div>
      </div>

      {/* Capitán y teléfono solo si existen: "Sin capitán" no aporta nada. */}
      {team.captainName || team.contactPhone ? (
        <dl className="grid gap-1 text-xs text-white/70">
          {team.captainName ? <dd>{team.captainName}</dd> : null}
          {team.contactPhone ? <dd>{team.contactPhone}</dd> : null}
        </dl>
      ) : null}

      <button
        type="button"
        onClick={() => setRosterOpen(true)}
        className="inline-flex min-h-11 items-center justify-between gap-2 rounded-lg border border-white/10 bg-white/[0.025] px-3 text-sm font-semibold text-white/80 transition hover:border-[var(--color-accent)]/40 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
      >
        <span className="inline-flex items-center gap-2">
          <Users size={16} aria-hidden="true" />
          Ver plantel
        </span>
        <span className="text-[var(--color-muted)]">
          {playerCount === 1 ? "1 jugador" : `${playerCount} jugadores`}
        </span>
      </button>

      <div className="grid gap-2">
        {editSlot}
        {removeSlot}
      </div>

      <AdminSheet
        open={rosterOpen}
        onOpenChange={setRosterOpen}
        title={`Plantel de ${team.name}`}
        description={
          playerCount === 1 ? "1 jugador" : `${playerCount} jugadores`
        }
      >
        <div className="grid gap-3 p-5">
          {rosterCreateSlot}

          {playerCount > 0 ? (
            <div className="grid gap-2">
              {rosterEntries.map((entry) => renderRosterEntry(entry))}
            </div>
          ) : (
            <p className="text-sm text-[var(--color-muted)]">
              Sin jugadores cargados.
            </p>
          )}
        </div>
      </AdminSheet>
    </article>
  );
}
```

- [ ] **Step 4: Cambiar `TeamsTab` a la grilla de cards**

En `src/app/admin/(protected)/torneos/[id]/page.tsx`, reemplazá el bloque `<AdminPanel>` con `AdminTableHeader` + `divide-y` por:

```tsx
      {teams.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {teams.map((team) => {
            const teamRosterEntries = rosterEntries.filter(
              (entry) => entry.teamId === team.id,
            );

            return (
              <TeamCard
                key={team.id}
                team={team}
                rosterEntries={teamRosterEntries}
                editSlot={
                  <TeamEditDialog
                    action={updateTeam.bind(null, tournament.id, team.id)}
                    team={team}
                  />
                }
                removeSlot={
                  <TeamRemoveDialog
                    action={removeTeamFromTournament.bind(
                      null,
                      tournament.id,
                      team.id,
                    )}
                    teamName={team.name}
                  />
                }
                rosterCreateSlot={
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
                }
                renderRosterEntry={(entry) => (
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
                )}
              />
            );
          })}
        </div>
      ) : (
        /* AdminEmptyState existente, sin cambios */
      )}
```

Agregá `import { TeamCard } from "@/components/admin/TeamCard";` y sacá los imports que queden sin uso (`Image` si ya no se usa en este archivo, `AdminTableHeader` si ninguna otra pestaña lo usa — verificá antes con grep).

- [ ] **Step 5: Correr el test y verificar que pasa**

Run: `npx vitest run "src/app/admin/(protected)/torneos/[id]/page.test.tsx"`
Expected: PASS

- [ ] **Step 6: Verificar en el navegador**

```bash
npm run dev
```

En `?tab=equipos`: cards de ~120px en grilla, sin "Sin capitán"/"Sin teléfono", y el plantel abriéndose en drawer con el alta adentro.

- [ ] **Step 7: Lint y commit**

```bash
npm test && npm run lint
git add src/components/admin/TeamCard.tsx "src/app/admin/(protected)/torneos/[id]/"
git commit -m "feat: equipos en cards con el plantel en un drawer"
```

---

### Task 12: Dashboard sin duplicación y con pendientes reales

**Files:**
- Modify: `src/features/football-tournaments/data.ts`
- Create: `src/components/admin/PendingMatchesPanel.tsx`
- Modify: `src/app/admin/(protected)/page.tsx`
- Test: `src/app/admin/(protected)/page.test.tsx`

**Interfaces:**
- Consumes: cliente Supabase de `data.ts`.
- Produces:

```ts
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

export async function getAdminPendingMatches(
  limit?: number,
): Promise<AdminPendingMatch[]>;
```

`href` es `/admin/torneos/<tournamentId>?tab=partidos`.

- [ ] **Step 1: Escribir el test que falla**

`src/app/admin/(protected)/page.test.tsx` usa un `vi.mock` con factory inline y renderiza con `render(await AdminDashboardPage())` + `screen`. Seguí ese mismo patrón.

Primero, dentro del objeto que devuelve el `vi.mock("@/features/football-tournaments/data", ...)` existente, agregá junto a `getAdminDashboardSummary`:

```tsx
  getAdminPendingMatches: vi.fn(async () => [
    {
      id: "match-1",
      tournamentId: "tournament-1",
      tournamentName: "Torneo Prueba 2",
      categoryName: "Primera",
      roundLabel: "Semifinal",
      homeTeamName: "Roma",
      awayTeamName: "Boca Juniors",
      scheduledAt: null,
      isOverdue: false,
      href: "/admin/torneos/tournament-1?tab=partidos",
    },
  ]),
```

Después agregá el test dentro del `describe("AdminDashboardPage")`:

```tsx
  it("lista los partidos que faltan cargar en vez de solo contarlos", async () => {
    render(await AdminDashboardPage());

    expect(screen.getByText("Roma vs Boca Juniors")).toBeInTheDocument();
    expect(
      screen.getByText(/Torneo Prueba 2 · Primera · Semifinal/),
    ).toBeInTheDocument();
    // El panel duplicado desaparece:
    expect(screen.queryByText("Estado de competencia")).not.toBeInTheDocument();
  });
```

- [ ] **Step 2: Correr el test y verificar que falla**

Run: `npx vitest run "src/app/admin/(protected)/page.test.tsx"`
Expected: FAIL — `getAdminPendingMatches` no existe

- [ ] **Step 3: Escribir `getAdminPendingMatches` en `data.ts`**

Agregá al final del archivo, siguiendo el patrón de las otras funciones (que ya usan `requireAdmin()` + `createSupabaseServerClient()`):

```ts
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
  const [, supabase] = await Promise.all([
    requireAdmin(),
    createSupabaseServerClient(),
  ]);

  const { data, error } = await supabase
    .from("football_matches")
    .select(
      `
        id,
        tournament_id,
        round_label,
        scheduled_at,
        football_tournaments(name),
        football_tournament_categories(name),
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
```

`firstRelatedRow` ya existe en este archivo (buscá `function firstRelatedRow`). Reusalo, no lo dupliques.

- [ ] **Step 4: Escribir `PendingMatchesPanel`**

Creá `src/components/admin/PendingMatchesPanel.tsx`:

```tsx
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import type { AdminPendingMatch } from "@/features/football-tournaments/data";
import { AdminPanel, AdminStatusPill } from "./AdminUI";

const dateFormatter = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Argentina/Buenos_Aires",
});

export function PendingMatchesPanel({
  matches,
}: {
  matches: AdminPendingMatch[];
}) {
  return (
    <AdminPanel className="p-5 sm:p-6">
      <div className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-accent)] sm:text-sm">
          Qué falta cargar
        </p>
        <h2 className="mt-3 text-xl font-semibold text-white">
          Partidos pendientes
        </h2>
      </div>

      {matches.length > 0 ? (
        <div className="grid gap-2">
          {matches.map((match) => (
            <Link
              key={match.id}
              href={match.href}
              className="group grid gap-2 rounded-[0.9rem] border border-white/10 bg-black/16 p-4 transition hover:border-[var(--color-accent)]/35 hover:bg-white/[0.035] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">
                  {match.homeTeamName ?? "Por definirse"} vs{" "}
                  {match.awayTeamName ?? "Por definirse"}
                </p>
                <p className="mt-1 truncate text-xs text-[var(--color-muted)]">
                  {match.tournamentName}
                  {match.categoryName ? ` · ${match.categoryName}` : ""} ·{" "}
                  {match.roundLabel}
                </p>
              </div>
              <div className="flex items-center gap-3 sm:justify-self-end">
                <AdminStatusPill tone={match.isOverdue ? "warning" : "muted"}>
                  {match.scheduledAt
                    ? dateFormatter.format(new Date(match.scheduledAt))
                    : "Sin fecha"}
                </AdminStatusPill>
                <ArrowRight
                  size={16}
                  aria-hidden="true"
                  className="text-white/40 transition group-hover:text-[var(--color-accent)]"
                />
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-sm leading-6 text-[var(--color-muted)]">
          No hay partidos esperando resultado. La carga está al día.
        </p>
      )}
    </AdminPanel>
  );
}
```

- [ ] **Step 5: Limpiar el dashboard**

En `src/app/admin/(protected)/page.tsx`:

1. **Borrá** la `<section>` entera que contiene el `AdminPanel` de "Estado de competencia" junto al de "Pendientes accionables" (la que hoy tiene `xl:grid-cols-[minmax(0,1fr)_24rem]`). Duplica el hero y las métricas.
2. En su lugar:

```tsx
      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <PendingMatchesPanel matches={pendingMatches} />

        <AdminPanel className="p-5 sm:p-6">
          <div className="mb-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-accent)] sm:text-sm">
              Qué revisar
            </p>
            <h2 className="mt-3 text-xl font-semibold text-white">
              Pendientes accionables
            </h2>
          </div>
          <AttentionList items={summary.attentionItems} />
        </AdminPanel>
      </section>
```

3. En `DailyStatusPanel`, **borrá** el `<div className="grid grid-cols-2 gap-3 lg:grid-cols-1">` con las tiles "Progreso" y "Carga": repiten la fila de métricas de abajo. El grid del panel pasa de `lg:grid-cols-[minmax(0,1fr)_18rem]` a una sola columna. También podés borrar las variables `loadedLabel` y `progressLabel`, que quedan sin uso.
4. Corregí el ícono, que hoy muestra un ✓ verde junto a "Hay carga pendiente":

```tsx
            {status.tone === "good" ? (
              <CheckCircle2 size={20} aria-hidden="true" />
            ) : (
              <AlertTriangle size={20} aria-hidden="true" />
            )}
```

y el `toneClass` correspondiente:

```tsx
  const toneClass =
    status.tone === "good"
      ? "border-[var(--color-accent)]/28 bg-[var(--color-accent)]/10 text-[var(--color-accent)]"
      : "border-[var(--color-warm)]/35 bg-[var(--color-warm)]/10 text-[var(--color-warm)]";
```

5. Cargá los pendientes en paralelo con el resumen:

```tsx
  const [summary, pendingMatches] = await Promise.all([
    getAdminDashboardSummary(),
    getAdminPendingMatches(),
  ]);
```

6. Envolvé el valor de las tiles "Pendientes" y "Próxima fecha" en un `Link` a `#partidos-pendientes`, y agregá `id="partidos-pendientes"` al `PendingMatchesPanel` vía un `<div id="partidos-pendientes">` que lo envuelva.

- [ ] **Step 6: Correr el test y verificar que pasa**

Run: `npx vitest run "src/app/admin/(protected)/page.test.tsx"`
Expected: PASS

- [ ] **Step 7: Verificar en el navegador**

```bash
npm run dev
```

En `/admin`: el porcentaje aparece **una** sola vez (en las métricas), el ícono del hero es naranja cuando hay pendientes, y abajo se ve la lista real de partidos por cargar con link directo.

- [ ] **Step 8: Lint y commit**

```bash
npm test && npm run lint
git add src/features/football-tournaments/data.ts src/components/admin/PendingMatchesPanel.tsx "src/app/admin/(protected)/page.tsx" "src/app/admin/(protected)/page.test.tsx"
git commit -m "feat: el dashboard muestra los partidos pendientes y deja de repetir el mismo dato"
```

---

### Task 13: Panel de veedor mobile-first con confirmación

**Files:**
- Create: `src/components/veedor/ViewerMatchCard.tsx`
- Modify: `src/app/veedor/page.tsx`
- Test: `src/app/veedor/page.test.tsx`
- Test: `src/components/veedor/ViewerMatchCard.test.tsx`

**Interfaces:**
- Consumes: `getViewerAssignedMatches` de `data.ts`; `MatchResultForm` de `AdminForms`; `@radix-ui/react-alert-dialog`.
- Produces:

```ts
type ViewerMatchCardProps = {
  match: ViewerAssignedMatch;
  submitAction: (prevState: ActionState, payload: FormData) => Promise<ActionState>;
};
export function ViewerMatchCard(props: ViewerMatchCardProps): JSX.Element;
```

- [ ] **Step 1: Escribir el test que falla**

Creá `src/components/veedor/ViewerMatchCard.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ViewerMatchCard } from "@/components/veedor/ViewerMatchCard";

const baseMatch = {
  id: "match-1",
  tournamentName: "Torneo Prueba 2",
  roundLabel: "Semifinal",
  scheduledAt: null,
  homeTeamId: "team-home",
  awayTeamId: "team-away",
  homeTeamName: "Roma",
  awayTeamName: "Boca Juniors",
  homeScore: null,
  awayScore: null,
  homePenaltyScore: null,
  awayPenaltyScore: null,
  isKnockout: true,
  resultLockedAt: null,
  rosterEntries: [],
};

describe("ViewerMatchCard", () => {
  it("pide confirmacion antes de bloquear el resultado", async () => {
    const submitAction = vi.fn(async () => ({ ok: true, message: "" }));
    const user = userEvent.setup();

    render(
      <ViewerMatchCard match={baseMatch as never} submitAction={submitAction} />,
    );

    await user.click(screen.getByRole("button", { name: /cargar final/i }));

    expect(
      await screen.findByText(/solo un administrador puede corregirlo/i),
    ).toBeInTheDocument();
    expect(submitAction).not.toHaveBeenCalled();
  });

  it("no deja cargar cuando falta definir un equipo", () => {
    render(
      <ViewerMatchCard
        match={
          {
            ...baseMatch,
            homeTeamId: null,
            // data.ts rellena el nombre igual; el card debe ignorarlo.
            homeTeamName: "Equipo local",
          } as never
        }
        submitAction={vi.fn()}
      />,
    );

    expect(screen.getByText("Por definirse")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /cargar final/i })).toBeDisabled();
  });

  it("muestra el resultado bloqueado sin formulario", () => {
    render(
      <ViewerMatchCard
        match={
          {
            ...baseMatch,
            homeScore: 2,
            awayScore: 1,
            resultLockedAt: "2026-07-30T12:00:00-03:00",
          } as never
        }
        submitAction={vi.fn()}
      />,
    );

    expect(screen.getByText("2 - 1")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /cargar final/i }),
    ).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Correr el test y verificar que falla**

Run: `npx vitest run src/components/veedor/ViewerMatchCard.test.tsx`
Expected: FAIL — no se puede resolver `@/components/veedor/ViewerMatchCard`

- [ ] **Step 3: Escribir `ViewerMatchCard`**

Creá `src/components/veedor/ViewerMatchCard.tsx`. La confirmación intercepta el submit: el `MatchResultForm` queda dentro del card y el `AlertDialog` se dispara antes de mandar la acción.

```tsx
"use client";

import { useRef, useState } from "react";
import * as AlertDialog from "@radix-ui/react-alert-dialog";

import { MatchResultForm } from "@/components/admin/AdminForms";
import type { ActionState } from "@/features/football-tournaments/actions";
import type { ViewerAssignedMatch } from "@/features/football-tournaments/data";

const scheduledAtFormatter = new Intl.DateTimeFormat("es-AR", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "America/Argentina/Buenos_Aires",
});

type ViewerMatchCardProps = {
  match: ViewerAssignedMatch;
  submitAction: (
    prevState: ActionState,
    payload: FormData,
  ) => Promise<ActionState>;
};

export function ViewerMatchCard({ match, submitAction }: ViewerMatchCardProps) {
  const [pendingForm, setPendingForm] = useState<FormData | null>(null);
  const resolveRef = useRef<((state: ActionState) => void) | null>(null);

  const hasBothTeams = Boolean(match.homeTeamId && match.awayTeamId);
  // Ojo: data.ts rellena homeTeamName con "Equipo local" cuando el partido
  // todavía no tiene equipo (por eso la Final mostraba "Equipo local vs Equipo
  // visitante"). El estado "por definirse" se deriva del id, no del nombre.
  const homeName = match.homeTeamId ? match.homeTeamName : "Por definirse";
  const awayName = match.awayTeamId ? match.awayTeamName : "Por definirse";

  /**
   * Envuelve la server action: en vez de mandarla, guarda el FormData y abre
   * la confirmación. Cargar el resultado bloquea el partido, así que no puede
   * pasar por un solo toque sin red de contención.
   */
  const confirmThenSubmit = async (
    _prevState: ActionState,
    formData: FormData,
  ): Promise<ActionState> => {
    setPendingForm(formData);

    return new Promise<ActionState>((resolve) => {
      resolveRef.current = resolve;
    });
  };

  const cancel = () => {
    setPendingForm(null);
    resolveRef.current?.({ ok: false, message: "" });
    resolveRef.current = null;
  };

  const confirm = async () => {
    if (!pendingForm) return;

    const state = await submitAction({ ok: false, message: "" }, pendingForm);
    setPendingForm(null);
    resolveRef.current?.(state);
    resolveRef.current = null;
  };

  const pendingHome = pendingForm?.get("homeScore") ?? match.homeScore ?? 0;
  const pendingAway = pendingForm?.get("awayScore") ?? match.awayScore ?? 0;

  return (
    <article className="grid gap-4 rounded-xl border border-white/10 bg-[#121212] p-4 sm:p-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-accent)]">
          {match.tournamentName} · {match.roundLabel}
        </p>
        <div className="mt-3 grid gap-1">
          <p className="text-lg font-semibold text-white">{homeName}</p>
          <p className="text-lg font-semibold text-white">{awayName}</p>
        </div>
        <p className="mt-2 text-sm text-[var(--color-muted)]">
          {match.scheduledAt
            ? scheduledAtFormatter.format(new Date(match.scheduledAt))
            : "Sin fecha"}
        </p>
      </div>

      {match.resultLockedAt ? (
        <div className="grid gap-2 rounded-lg border border-white/10 bg-white/[0.025] p-4">
          <p className="text-2xl font-semibold text-white tabular-nums">
            {match.homeScore} - {match.awayScore}
          </p>
          <p className="text-sm leading-6 text-[var(--color-muted)]">
            Resultado final cargado. Para corregirlo, avisale a un administrador.
          </p>
        </div>
      ) : (
        <MatchResultForm
          action={confirmThenSubmit}
          homeScore={match.homeScore}
          awayScore={match.awayScore}
          homePenaltyScore={match.homePenaltyScore}
          awayPenaltyScore={match.awayPenaltyScore}
          homeTeamId={match.homeTeamId}
          awayTeamId={match.awayTeamId}
          isKnockout={match.isKnockout}
          rosterEntries={match.rosterEntries}
          submitLabel="Cargar final"
        />
      )}

      <AlertDialog.Root
        open={pendingForm !== null && hasBothTeams}
        onOpenChange={(open) => {
          if (!open) cancel();
        }}
      >
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" />
          <AlertDialog.Content className="fixed left-1/2 top-1/2 z-50 w-[min(28rem,92vw)] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-white/10 bg-[#111612] p-6 shadow-[0_24px_90px_rgb(0_0_0_/_0.42)]">
            <AlertDialog.Title className="text-xl font-semibold text-white">
              Confirmá el resultado final
            </AlertDialog.Title>
            <AlertDialog.Description className="mt-3 text-sm leading-6 text-[var(--color-muted)]">
              Vas a cargar {String(pendingHome)} - {String(pendingAway)} como
              resultado final de {homeName} vs {awayName}. Después solo un
              administrador puede corregirlo.
            </AlertDialog.Description>
            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <AlertDialog.Cancel asChild>
                <button
                  type="button"
                  className="inline-flex min-h-11 items-center justify-center rounded-lg border border-white/20 bg-white/[0.03] px-5 text-sm font-semibold text-white/90 transition hover:bg-white/[0.08]"
                >
                  Volver
                </button>
              </AlertDialog.Cancel>
              <AlertDialog.Action asChild>
                <button
                  type="button"
                  onClick={confirm}
                  className="inline-flex min-h-11 items-center justify-center rounded-lg border border-[var(--color-accent-strong)] bg-[var(--color-accent)] px-5 text-sm font-semibold text-[#07110a] transition hover:bg-[var(--color-accent-strong)]"
                >
                  Cargar final
                </button>
              </AlertDialog.Action>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </article>
  );
}
```

- [ ] **Step 4: Correr el test y verificar que pasa**

Run: `npx vitest run src/components/veedor/ViewerMatchCard.test.tsx`
Expected: PASS (3 tests)

- [ ] **Step 5: Reescribir la página del veedor**

En `src/app/veedor/page.tsx`, reemplazá el `<article>` con `lg:grid-cols-[1fr_0.8fr_0.85fr]` (cuya columna del medio queda casi vacía) por la card, y agrupá por fecha:

```tsx
const dayFormatter = new Intl.DateTimeFormat("es-AR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: "America/Argentina/Buenos_Aires",
});

function getDayLabel(value: string | null) {
  if (!value) return "Sin fecha asignada";

  return dayFormatter.format(new Date(value));
}
```

y en el cuerpo:

```tsx
        {matches.length > 0 ? (
          <div className="grid gap-8">
            {[...groupByDay(matches).entries()].map(([dayLabel, dayMatches]) => (
              <section key={dayLabel} className="grid gap-3">
                <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-white/44">
                  {dayLabel}
                </h2>
                <div className="grid gap-3 lg:grid-cols-2">
                  {dayMatches.map((match) => (
                    <ViewerMatchCard
                      key={match.id}
                      match={match}
                      submitAction={submitViewerMatchResult.bind(null, match.id)}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : (
          /* estado vacío existente, sin cambios */
        )}
```

con el agrupador, definido en el mismo archivo:

```tsx
function groupByDay(matches: ViewerAssignedMatch[]) {
  const groups = new Map<string, ViewerAssignedMatch[]>();

  for (const match of matches) {
    const label = getDayLabel(match.scheduledAt);
    groups.set(label, [...(groups.get(label) ?? []), match]);
  }

  return groups;
}
```

Bajá también el título: `text-display-sm` pasa a `text-2xl font-semibold sm:text-3xl`, que hoy ocupa media pantalla en mobile.

- [ ] **Step 6: Actualizar el test de la página**

El test existente afirma `screen.getByText("Norte vs Sur")`, que ya no existe:
ahora cada equipo va en su propia línea. Cambiá esa aserción por:

```tsx
    expect(screen.getByText("Norte")).toBeInTheDocument();
    expect(screen.getByText("Sur")).toBeInTheDocument();
```

Y agregá el test de agrupación (el mock del archivo tiene `scheduledAt: null`):

```tsx
  it("agrupa los partidos asignados por dia", async () => {
    render(await ViewerDashboardPage());

    expect(screen.getByText("Sin fecha asignada")).toBeInTheDocument();
  });
```

- [ ] **Step 7: Correr los tests**

Run: `npx vitest run src/app/veedor/ src/components/veedor/`
Expected: PASS

- [ ] **Step 8: Verificar en el navegador**

```bash
npm run dev
```

Entrá a `/veedor` con un usuario veedor. Verificá, en viewport de celular (390px):
- Una card por partido, sin columnas vacías.
- "Por definirse" y botón deshabilitado en la Final sin equipos.
- Al tocar "Cargar final" aparece la confirmación con el marcador, y "Volver" no guarda nada.

- [ ] **Step 9: Lint y commit**

```bash
npm test && npm run lint
git add src/components/veedor/ src/app/veedor/
git commit -m "feat: panel de veedor mobile-first con confirmacion antes de bloquear"
```

---

## Verificación final

- [ ] **Suite completa en verde**

```bash
npm test && npm run lint && npx tsc --noEmit && npm run build
```

- [ ] **Prueba manual del recorrido completo de copa**

1. Creá un torneo formato Copa con 4 equipos y generá la llave.
2. Cargá el resultado de la Semifinal 1. Verificá que el ganador **aparece en la Final** y que el toast dice "El ganador pasa a Final".
3. Cargá la Semifinal 2. La Final queda con los dos equipos.
4. Cargá la Final. Verificá que el campeón queda marcado.
5. Volvé a la Semifinal 1 e intentá invertir el resultado. Debe **rechazar** con "Final ya tiene resultado cargado".
6. Borrá el resultado de la Final y repetí el paso 5: ahora sí debe dejar, y el equipo del slot se reemplaza.
