# Fase 1 — El ganador avanza y el panel deja de estorbar

Fecha: 2026-07-30
Estado: aprobado, pendiente de plan de implementación

## Problema

Dos problemas distintos que comparten los mismos archivos, por eso van juntos.

**El ganador de un partido de copa nunca avanza.** `updateMatchResult`
(`src/features/football-tournaments/actions.ts:2160`) y `submitViewerMatchResult`
(`:2270`) guardan el resultado y no escriben nada en el partido apuntado por
`next_match_id`. No hay trigger en `supabase/schema.sql` que lo compense. Un
torneo de copa se queda trabado en la primera ronda para siempre.

Además falta el dato de **a qué slot** avanza el ganador. `generatePrunedTree`
lo calcula correctamente (`src/lib/tree-generator.ts:177`,
`isHomeSlotInNextMatch`) y `BracketGeneratorDialog` lo serializa entero en el
payload (`src/components/admin/AdminForms.tsx:2499`), pero el servidor lo
descarta: `isBracketFixtureNode` (`actions.ts:156`) no lo valida y el insert
(`actions.ts:1811`) no lo persiste. Sin ese dato, `tree-reconstructor.ts:52-56`
ordena los hijos por `id.localeCompare` y lo admite en un comentario.

**El panel de admin y veedor tiene fricción medible.** Duplicación de datos en
el dashboard, una tabla de equipos donde una columna contiene notas + acciones +
plantel, un bracket con dos tercios de lienzo vacío, un panel lateral que tapa el
contenido, y una acción irreversible del veedor sin confirmación.

## Decisiones tomadas

- No hay torneos de copa en producción todavía → la migración puede ser simple,
  con backfill defensivo para datos de desarrollo.
- Si se corrige un resultado y la ronda siguiente **ya tiene resultado cargado**,
  se **bloquea** la corrección. No hay cascada.
- Eliminación simple: solo avanza el ganador. Sin partido por el tercer puesto.
- Los veedores usan celular y compu → mobile-first que escala a escritorio.
- El plantel sale de la card de equipo y se abre en un drawer.

## A. Propagación del ganador

### A.1 Migración

`supabase/migrations/20260730000000_add_next_match_slot.sql`:

1. `alter table public.football_matches add column next_match_slot text` con
   `check (next_match_slot in ('home','away'))`.
2. Backfill de filas existentes:
   `row_number() over (partition by next_match_id order by created_at, id)`
   → 1 = `home`, 2 = `away`. Reproduce el orden que hoy usa
   `tree-reconstructor.ts:56`, así que ningún bracket ya cargado cambia de forma.
3. Recién después del backfill:
   `check ((next_match_id is null) = (next_match_slot is null))`.
4. Índice único parcial sobre `(next_match_id, next_match_slot)` where
   `next_match_id is not null` — garantía dura de que dos partidos no pueden
   alimentar el mismo slot.

El mismo cambio se espeja en `supabase/schema.sql`.

### A.2 Persistir el slot al generar

- `BracketFixtureNode` (`actions.ts:47`) suma `isHomeSlotInNextMatch: boolean`;
  `isBracketFixtureNode` (`:156`) lo valida.
- `generateBracketFixture` (`:1811`) escribe
  `next_match_slot: node.isHomeSlotInNextMatch ? 'home' : 'away'`.
- `buildBracketFixture` (`src/features/football-tournaments/fixture.ts:417-418`):
  `prevHomeMatch` → `'home'`, `prevAwayMatch` → `'away'`.
- `buildPlaceholderPlayoff` (`fixture.ts:223`): paridad del índice
  (`index % 2 === 0` → `'home'`).
- `GeneratedBracketMatch` suma `nextMatchSlot: 'home' | 'away' | null`.
- `generateGroupPlayoffFixture` (`actions.ts:1963`) lo persiste.

### A.3 Consumir el slot

- `data.ts`: agregar `next_match_slot` a los selects de las líneas 136, 174 y
  1729; mapear a `nextMatchSlot` en `AdminMatch`, `PublicFootballMatch` y
  `UIFootballMatch`.
- `tree-reconstructor.ts`: ubicar los hijos por `nextMatchSlot` (home arriba,
  away abajo) en vez de ordenar por id. El `localeCompare` queda solo como
  fallback cuando el dato falta.

### A.4 Módulo `bracket-progression.ts`

Nuevo, puro, sin dependencias de Supabase:

```ts
resolveMatchWinner(match): string | null
```
Devuelve el `teamId` ganador. Los penales desempatan. Devuelve `null` si el
marcador está incompleto, si falta alguno de los dos equipos, o si es empate sin
penales.

```ts
findAdvancementBlock(nextMatch, slot, winnerTeamId): string | null
```
Devuelve el motivo del bloqueo, o `null` si se puede avanzar. Bloquea cuando el
slot destino ya tiene **otro** equipo y el partido siguiente ya tiene resultado
cargado.

### A.5 Helper compartido en las acciones

`advanceWinnerToNextMatch(supabase, match, result)`, usado por
`updateMatchResult` y `submitViewerMatchResult`:

1. Calcula el ganador.
2. Si `next_match_id` es `null`, no hace nada.
3. **Pre-flight, antes de escribir el resultado**: si `findAdvancementBlock`
   devuelve motivo, retorna `{ ok: false, message }` sin tocar la base. Mensaje:
   *"No se puede cambiar el ganador: Semifinal ya tiene resultado cargado. Borrá
   ese resultado primero."*
4. Si no está bloqueado, escribe el ganador en `home_team_id` o `away_team_id`
   del siguiente partido según `next_match_slot`.
5. Registra evento de auditoría con `entityType: "match_advancement"`.

El chequeo va **antes** del `update` del resultado para que nunca quede el
resultado guardado y el avance a medias. Como se bloquea siempre que el destino
ya tenga resultado, no hace falta cascada recursiva: si el partido siguiente no
tiene resultado, no pudo haber sembrado nada más abajo.

El toast de éxito pasa de *"Resultado guardado."* a *"Resultado guardado.
Atalanta pasa a la Final."*, usando el `ActionState.message` que ya existe.

### A.6 Guard de equipos indefinidos

Hoy el veedor puede cargar el resultado de una Final cuyos equipos son `null`.
Se rechaza en servidor (ambas acciones) y se deshabilita el submit en cliente
con el motivo visible.

## B. Primitivo `AdminSheet`

Drawer en `src/components/admin/AdminUI.tsx` sobre `@radix-ui/react-dialog` (ya
es dependencia): overlay + panel que entra desde la derecha en `sm:` y desde
abajo en mobile, `max-h-[90dvh]`, scroll interno, cierre con Esc, foco atrapado.

`MatchSidePanel` deja de ser un `<div className="w-[360px] h-[600px]">` dentro de
un `flex` — que es la causa de que tape la Final. `BracketResultsViewer` y
`LeagueMatchesViewer` pierden el wrapper `flex gap-4` y el bracket recupera el
ancho completo. El mismo primitivo lo reusa el drawer de plantel.

## C. Dashboard (`src/app/admin/(protected)/page.tsx`)

- Se elimina el panel "Estado de competencia": duplica el hero.
- Se eliminan las tiles "Progreso" y "Carga" del hero: duplican la fila de
  métricas. Hoy el mismo número aparece cinco veces.
- `DailyStatusPanel` elige el ícono por tono (`AlertTriangle` cuando hay
  pendientes). Hoy muestra `CheckCircle2` verde junto a "Hay carga pendiente".
- En el espacio liberado, panel **"Partidos pendientes"** con la lista real.
- Las tiles "Pendientes" y "Próxima fecha" pasan a ser links a esa lista.

Nueva función en `data.ts`:

```ts
getAdminPendingMatches(limit?: number): Promise<AdminPendingMatch[]>
```

Devuelve torneo, categoría, ronda, nombres de equipos, fecha y href directo al
partido. Orden: vencidos primero, después por fecha ascendente, después los sin
fecha.

## D. Equipos (pestaña `equipos`)

De tabla a grilla de cards. Cada card: escudo (o iniciales), nombre, nombre
corto, badge "N jugadores", y menú `⋮` con Editar / Quitar.

Capitán y teléfono se muestran **solo si existen** — hoy "Sin capitán" y "Sin
teléfono" ocupan el 40% del ancho para no decir nada.

El plantel sale de la card y se abre en `AdminSheet`, con el alta de jugador
adentro. Desaparece la columna "Notas privadas" que hoy contiene notas, botones
de acción y el plantel entero. Las filas de ~300px pasan a cards de ~120px.

## E. Partidos (pestaña `partidos`)

**Bracket** (`src/components/football/shared/TournamentBracket.tsx`):
- La altura fija `h-[600px]` pasa a calcularse del contenido: `clamp` entre 320 y
  680 según cantidad de rondas.
- `fitScale` se calcula contra el ancho **medido** con un `ref`, en vez de la
  constante hardcodeada `availableWidth = 900` (línea 71).

**Panel de estadísticas** (`CategoryMatchStatsPanel`, `page.tsx:301`): si no hay
ningún evento cargado, colapsa a una línea en vez de tres cajas vacías.

**`MatchResultForm`** (`AdminForms.tsx:2917`) reordenado:
1. Marcador grande arriba (se mantiene el stepper actual, que funciona bien).
2. Penales en una fila compacta `Penales [ ] – [ ]`, en vez de la tarjeta con
   borde y dos líneas de explicación. Sigue apareciendo solo cuando es knockout
   y hay empate, porque es un campo requerido en ese caso.
3. Detalle de goles y tarjetas dentro de un `<details>` cerrado por defecto, con
   badge de cuántos eventos hay cargados. Hoy es una grilla siempre abierta.

Fecha, equipos y veedor bajan a una sección secundaria del drawer.

## F. Veedor (`src/app/veedor/page.tsx`)

Mobile-first que escala a escritorio. Se elimina la grilla
`lg:grid-cols-[1fr_0.8fr_0.85fr]` cuya columna del medio queda casi vacía.

Una card por partido, ancho completo: torneo + ronda arriba, los dos equipos con
el marcador al lado, fecha, y el formulario compacto abajo. Partidos agrupados
por fecha. "Por definirse" cuando falta un equipo, con la carga deshabilitada.

**Confirmación antes de bloquear**: `AlertDialog` (`@radix-ui/react-alert-dialog`,
ya es dependencia) — *"Vas a cargar 2 - 1 como resultado final de Roma vs Boca
Juniors. Después solo un administrador puede corregirlo."* Hoy un toque en
"Cargar final" es irreversible sin ninguna red de contención.

## G. Tests

Nuevos:
- `bracket-progression.test.ts`: ganador con y sin penales, marcador incompleto,
  empate en liga, equipos en `null`.
- Test de `AdminSheet`: abre, cierra con Esc, atrapa el foco.

Casos agregados:
- `fixture.test.ts`: los slots alternan `home`/`away` en cada ronda.
- `actions.test.ts`: el avance escribe el slot correcto; la corrección bloqueada
  devuelve error **sin** modificar la base; se rechaza el resultado de un partido
  sin ambos equipos.
- `database-schema.test.ts`: la columna `next_match_slot` y su constraint.

A actualizar por el rediseño:
- `src/app/admin/(protected)/torneos/[id]/page.test.tsx`
- `src/components/admin/AdminForms.test.tsx`
- `src/app/veedor/page.test.tsx`
- `src/app/admin/(protected)/page.test.tsx`

## Fuera de alcance

Fases siguientes, cada una con su propio spec:

- **Fase 2** — Seeding de zonas → playoff: hoy los partidos de playoff se crean
  con equipos en `null` y nada los llena desde la tabla de posiciones.
- **Fase 3** — Feed de actividad global y estado de fixture por torneo.
- **Fase 4** — Wizard de creación de torneos y generadores de fixture.
