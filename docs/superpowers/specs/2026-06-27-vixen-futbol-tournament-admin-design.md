# Vixen Club - Football Tournament Admin Portal

**Date:** 2026-06-27
**Status:** Approved design base
**Scope:** private football tournament admin portal plus public `/futbol` tournament display

## Goal

Add a private portal where Vixen Club staff can manage football tournaments and
match results without changing code. The public football page should then show
active tournaments, upcoming matches, recent results, and standings calculated
from the recorded results.

This is a product shift from a static marketing page to a small operational
system for football tournaments.

## Current Project Context

The project is currently a Next.js 16 landing site with static content:

- `/futbol` is implemented in `src/app/futbol/page.tsx`.
- Football copy and CTAs live in `src/content.ts`.
- The home page has a static tournament proof section in
  `src/components/sections/Tournaments.tsx`.
- There is no database, authentication, server-side admin flow, or editable
  tournament model today.

Before writing implementation code, read the relevant local Next.js 16 guides in
`node_modules/next/dist/docs/` because this repo explicitly warns that the Next
APIs and conventions may differ from older versions.

## Decisions Already Made

- The MVP is **football only**.
- Pádel tournaments are out of scope for now.
- Supabase will provide database and authentication.
- Someone from the club will load data through a private admin panel.
- Fixtures are created manually, match by match.
- Standings are calculated automatically from completed match results.
- The public `/futbol` page is the first consumer of this data.

## Recommended Approach

Build a focused MVP with Supabase and Next:

- Supabase Postgres stores tournament data.
- Supabase Auth protects staff access.
- Row Level Security limits writes to approved admin users.
- Next server-side code reads public published data for `/futbol`.
- Next admin routes write through authenticated server actions or route
  handlers, depending on the current Next 16 documentation.

This is preferable to building a custom backend now. It gives the club a real
admin flow while keeping infrastructure small.

## Data Model

Use football-specific table names to avoid premature multi-sport abstraction.

### `football_tournaments`

Stores each football tournament.

Fields:

- `id`
- `name`
- `slug`
- `season`
- `category`
- `status`: `draft`, `published`, `active`, `completed`, `archived`
- `starts_at`
- `ends_at`
- `description`
- `created_at`
- `updated_at`

Public pages should only show tournaments with `published`, `active`, or
`completed` status.

### `football_teams`

Stores teams inside a tournament.

Fields:

- `id`
- `tournament_id`
- `name`
- `short_name`
- `captain_name`
- `contact_phone`
- `notes`
- `created_at`
- `updated_at`

`captain_name`, `contact_phone`, and `notes` are private admin data and should
not be exposed on the public page.

### `football_matches`

Stores fixture items and final results.

Fields:

- `id`
- `tournament_id`
- `round_label`
- `scheduled_at`
- `home_team_id`
- `away_team_id`
- `home_score`
- `away_score`
- `status`: `scheduled`, `completed`, `postponed`, `cancelled`
- `notes`
- `created_at`
- `updated_at`

Validation rules:

- `home_team_id` and `away_team_id` must be different.
- both teams must belong to the selected tournament.
- scores are required when status is `completed`.
- scores should be empty when a match is not completed.
- cancelled matches do not count toward standings.

### `admin_profiles`

Stores which authenticated Supabase users can access the admin portal.

Fields:

- `id`, matching `auth.users.id`
- `email`
- `role`: `admin`
- `created_at`

For MVP, one `admin` role is enough.

## Standings Calculation

Do not store standings manually in Supabase for the MVP. Calculate them from
`football_matches` where `status = completed`.

For each team:

- `PJ`: completed matches played
- `PG`: wins
- `PE`: draws
- `PP`: losses
- `GF`: goals for
- `GC`: goals against
- `DG`: goal difference
- `PTS`: 3 for win, 1 for draw, 0 for loss

Sorting order:

1. points descending
2. goal difference descending
3. goals for descending
4. team name ascending

This keeps the public table consistent with the loaded results and avoids
manual maintenance errors.

## Admin Experience

The admin portal should be private and task-oriented, not a marketing surface.

Routes:

- `/admin/login`: staff login
- `/admin`: dashboard with active tournament summary
- `/admin/torneos`: tournament list
- `/admin/torneos/nuevo`: create tournament
- `/admin/torneos/[id]`: tournament detail
- `/admin/torneos/[id]/equipos`: manage teams
- `/admin/torneos/[id]/partidos`: manage fixture and results

Primary workflows:

1. Create tournament.
2. Add teams.
3. Add matches manually.
4. Mark a match as completed and enter the result.
5. Review the automatically calculated standings.
6. Publish or archive tournaments as needed.

The admin should optimize repeated entry:

- compact tables
- clear create/edit forms
- inline result editing where practical
- visible save/error states
- no decorative hero sections inside admin pages

## Public Football Page

Redesign `/futbol` around real tournament data while keeping the existing Vixen
brand direction.

Recommended structure:

1. football hero with CTA for inscription by WhatsApp
2. active tournament selector or active tournament highlight
3. standings table
4. upcoming matches
5. latest results
6. tournament information and contact CTA

If no tournament is published yet, `/futbol` should still render a strong static
football page with the existing CTA and a message that tournament information is
coming soon.

## Security

Supabase Row Level Security should be enabled.

Public anonymous reads:

- can read published/active/completed tournaments
- can read teams for visible tournaments
- can read matches for visible tournaments

Admin writes:

- require authenticated Supabase user
- require matching row in `admin_profiles`
- can create/update/delete tournaments, teams, and matches

Private fields such as contact phone and notes should only be readable by admin
users.

## Environment And Deployment

Expected environment variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`, server-only if needed for admin-only operations

The service role key must never be exposed to client components.

For local development, provide a sample `.env.example` with placeholder values.

## Testing Strategy

Unit tests:

- standings calculation
- match validation helpers
- public data formatting

Component tests:

- `/futbol` renders empty state without tournament data
- standings display sorted rows
- admin forms show validation errors

Build verification:

- `npm run test`
- `npm run build`

Manual verification:

- login required for `/admin`
- public `/futbol` loads without authentication
- creating a completed match updates standings
- private team contact fields do not appear publicly

## Out Of Scope

- pádel tournaments
- player rosters and player statistics
- automatic fixture generation
- payments
- team self-registration
- public user accounts
- multiple admin roles
- live match updates
- importing spreadsheets

## Success Criteria

- Club staff can manage football tournaments without code changes.
- Public users can see active football tournament information on `/futbol`.
- Standings always match completed results.
- Private admin data is not visible publicly.
- The system can launch as a small MVP without blocking future improvements.
