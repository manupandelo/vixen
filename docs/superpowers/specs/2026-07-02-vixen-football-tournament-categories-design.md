# Vixen Football Tournament Categories Design

## Context

The football tournament model currently treats `football_tournaments.category` as a single text field. Teams, roster entries, groups, and matches all attach directly to `football_tournaments.id`.

That works for a simple tournament, but it does not support a real club tournament where one tournament contains separate competitive categories such as Primera, Reserva, and Menores. The user clarified that each category has separate teams. The tournament format is shared across all categories: if the parent tournament is a league, every category is a league; if it is a cup, every category is a cup.

## Product Decision

Use a parent tournament plus category children.

- Parent tournament: shared identity, season, format, publication, and general description.
- Tournament category: competitive unit with its own teams, roster entries, groups, matches, standings, and fixture.
- Teams are not shared between categories by default. The same real-world club name can be reused, but each category registration is separate.

## Public URLs

Use stable category URLs:

- `/futbol/torneos/[slug]` shows the tournament overview and defaults to the first visible category.
- `/futbol/torneos/[slug]/[categorySlug]` shows one category detail.

This is preferred over `?categoria=` because direct links are clearer, browser history works naturally, and pages can be shared without preserving UI state.

If a tournament has one category, the UI should not feel more complex: the category switcher can be hidden or rendered as compact context.

## Admin UX

The admin keeps using `/admin/torneos/[id]` as the tournament workspace.

Add a category selector in the tournament workspace. The selected category scopes the current operational tabs:

- Equipos: teams registered in the selected category.
- Partidos: matches and fixture generation for the selected category.
- Actividad: audit events can remain tournament-level initially, with metadata for category when actions are category-scoped.

Add a `Categorías` management surface inside the tournament workspace:

- Create category.
- Rename category.
- Reorder categories.
- Change category status.
- Set optional category date overrides.

The tournament form keeps one shared format field. Category forms do not choose format.

## Data Model

Add `football_tournament_categories`:

- `id uuid primary key`
- `tournament_id uuid not null references football_tournaments(id) on delete cascade`
- `name text not null`
- `slug text not null`
- `status football_tournament_category_status not null default 'draft'`
- `position integer not null default 0`
- `starts_at date null`
- `ends_at date null`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`
- unique `(tournament_id, slug)`
- unique `(tournament_id, position)`

Recommended statuses:

- `draft`
- `published`
- `active`
- `completed`
- `archived`

Move competitive tables to category scope:

- `football_tournament_teams` gets `category_id`.
- `football_tournament_groups` gets `category_id`.
- `football_roster_entries` gets `category_id`.
- `football_matches` gets `category_id`.

During migration, create a default category for each existing tournament using the current `football_tournaments.category` value. Then assign existing teams, groups, roster entries, and matches to that category.

Keep `football_tournaments.category` temporarily during migration compatibility, but new code should read categories from `football_tournament_categories`. Once the app is fully migrated and data is stable, the old text column can be removed in a later cleanup migration.

## Constraints

The parent tournament format controls all categories. This avoids mixed-format complexity inside one tournament.

Category-scoped fixture generation must only read teams and matches from the selected category. It must not detect matches from sibling categories as blockers.

Roster uniqueness becomes category-scoped:

- A player can only appear once per category.
- Shirt numbers are unique per category and team.

Team registration becomes category-scoped:

- The same global `football_teams.id` may appear in multiple categories if admins intentionally register it there.
- Removing a team from one category must not affect sibling categories.

## Public Data Flow

Public tournament queries load visible parent tournaments and their visible categories.

The `/futbol` landing page shows a compact tournament card:

- parent tournament name
- shared format
- season
- category chips
- next match summary from the nearest category with an upcoming match

The category detail page computes standings and match displays from one category at a time.

Archived categories are not shown publicly.

## Admin Data Flow

Admin tournament detail loads:

- parent tournament
- categories for that tournament
- selected category
- selected category teams, roster entries, groups, matches, and viewers as needed

Actions that currently receive `tournamentId` and operate on teams, rosters, groups, or matches should receive `categoryId` too. They should still receive or derive `tournamentId` for revalidation and audit context.

Examples:

- `createTeam(tournamentId, categoryId, formData)`
- `createRosterEntry(tournamentId, categoryId, teamId, formData)`
- `generateLeagueFixture(tournamentId, categoryId, formData)`
- `updateMatch(tournamentId, categoryId, matchId, formData)`

## Error Handling

If a category slug does not exist or is not visible, public pages return `notFound()`.

If a selected admin category is missing, the admin workspace should default to the first category. If no category exists, show an empty category setup state instead of trying to load teams or matches.

Database constraints should prevent cross-category mistakes:

- matches can only use teams registered in the same category
- roster entries can only use teams registered in the same category
- group membership must stay within category

## Testing

Schema tests:

- category table exists with unique tournament slug and position constraints
- team registration, groups, rosters, and matches contain category references
- constraints prevent duplicate player/category registration and duplicate shirt numbers per category/team

Data tests:

- public formatting groups categories under a parent tournament
- category detail only computes matches and standings for one category
- archived categories are excluded publicly

Action tests:

- category creation and update
- team registration scoped to category
- fixture generation ignores sibling category matches
- roster entries scoped to category

UI tests:

- admin tournament page shows category selector and category management
- admin teams tab shows selected category teams only
- public tournament detail renders category navigation and selected category content

## Migration Strategy

Implement in phases.

1. Add category schema and migrate existing data into default categories.
2. Update read helpers and types to support categories while preserving old public/admin behavior for one-category tournaments.
3. Update admin category management and category-scoped teams/rosters.
4. Update category-scoped match and fixture flows.
5. Update public tournament routes and category navigation.
6. Remove or ignore old `football_tournaments.category` usage in app code.

This sequence keeps the app usable after each phase and reduces the risk of breaking current tournament pages.
