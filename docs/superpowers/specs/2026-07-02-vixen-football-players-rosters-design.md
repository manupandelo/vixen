# Vixen Club - Football Players, Rosters, and Match Events

**Date:** 2026-07-02
**Status:** Approved design base
**Scope:** football player records, per-tournament rosters, documentation status, and future match event attribution

## Goal

Extend the football tournament system so Vixen staff can manage players inside
each team and tournament. The first implementation should make rosters useful
for operations without adding file-storage complexity. A later implementation
should let staff attribute goals and cards to players, enabling scorer tables,
discipline summaries, and richer match details.

This keeps the existing football-only scope and builds on the current model:
tournaments, reusable teams, tournament-team registrations, matches, and
automatically derived standings.

## Product Decisions

- Use a **mixed player model**:
  - global player records store stable personal data.
  - tournament roster entries store the player's participation in a specific
    tournament team.
- DNI/document number is **optional** for now.
- Do not upload DNI, medical certificate, or insurance files in the MVP.
- Track medical certificate and insurance as admin-only statuses.
- Keep sensitive player data private to admin users.
- Public pages may later show player names and sports stats, but never document
  numbers, phone numbers, internal notes, or documentation status.
- Build this in two phases:
  1. players, roster entries, and documentation status.
  2. match events and public/statistical views.

## Why The Mixed Model

Teams are reusable across tournaments, but rosters can change between
tournaments. A global-only player list would make historical tournament data
fragile: editing a team roster for a future tournament could appear to change
the context of old matches.

The mixed model avoids that:

- `football_players` identifies the person.
- `football_roster_entries` records that person's role in one tournament,
  for one team, with the shirt number and documentation state used at that
  time.

When match events are added later, each event should point at a roster entry
rather than only a global player. That preserves history if the same player
changes team, number, or documentation state in another tournament.

## Data Model

### `football_players`

Stores reusable player records.

Fields:

- `id`
- `first_name`
- `last_name`
- `public_name`
- `document_number`
- `birth_date`
- `phone`
- `notes`
- `created_at`
- `updated_at`

Rules:

- `first_name` and `last_name` are required.
- `document_number` is optional.
- `public_name` is optional; if empty, public surfaces can derive a safe display
  name from first name and last initial.
- `phone`, `document_number`, `birth_date`, and `notes` are admin-only.
- If a document number is present, the admin UI can use it to help identify
  duplicate players, but it should not block player creation.

### `football_roster_entries`

Stores a player's participation in a specific tournament team.

Fields:

- `id`
- `tournament_id`
- `team_id`
- `player_id`
- `shirt_number`
- `status`: `active`, `inactive`, `suspended`
- `medical_status`: `pending`, `approved`, `expired`
- `insurance_status`: `pending`, `approved`, `expired`
- `registered_at`
- `notes`
- `created_at`
- `updated_at`

Rules:

- `tournament_id` must reference an existing football tournament.
- `team_id` must reference a team registered in that tournament.
- `player_id` must reference `football_players`.
- A player can only have one roster entry per tournament.
- Shirt numbers are optional, but if present should be unique per team inside
  the same tournament.
- `notes`, medical status, and insurance status are admin-only.

### Future `football_match_events`

This table is intentionally phase two. It should not block roster management.

Fields:

- `id`
- `match_id`
- `tournament_id`
- `team_id`
- `roster_entry_id`
- `event_type`: `goal`, `own_goal`, `yellow_card`, `red_card`,
  `second_yellow`
- `minute`
- `notes`
- `created_at`
- `updated_at`

Rules:

- `roster_entry_id` must belong to the same tournament as the match.
- `team_id` must match the roster entry team.
- For goals and own goals, the event can be used to derive scorer tables.
- Before locking a completed result, the UI should warn if goal events do not
  match the final score.

## Admin Experience

Roster management should live inside the existing tournament team flow, not in
a separate top-level product area.

Recommended placement:

- `/admin/torneos/[id]`, inside the Teams tab.
- Each team card or row gets a "Plantel" section.
- Staff can expand a team to see roster entries.

Primary actions:

1. Add a new player to the roster.
2. Add an existing player to the roster.
3. Edit shirt number.
4. Edit roster status.
5. Edit medical certificate status.
6. Edit insurance status.
7. Edit internal roster notes.
8. Remove a player from a roster when no locked match events depend on it.

The UI should optimize repeated entry:

- compact forms
- searchable existing-player selector
- visible documentation badges
- clear empty state for teams without players
- no file upload controls in the MVP

## Public Experience

Phase one does not need to expose rosters publicly.

After match events exist, public tournament detail pages can add:

- scorer table
- card table or discipline summary
- match details with goal authors

Public display names should use `public_name` when available. If it is absent,
use a conservative display such as first name plus last initial.

## Privacy And Permissions

Player records and roster entries contain private operational data. RLS should
follow the same policy direction as private team details:

- admins can manage players and roster entries.
- public users cannot read private player fields.
- public users should only read future stat views or sanitized projections, not
  raw player tables.

Do not expose:

- document number
- phone
- birth date
- internal notes
- medical status
- insurance status

## Validation And Edge Cases

- A player can be created without DNI/document number.
- Duplicate names should be allowed because they are realistic.
- If DNI/document number is present, use it as a warning signal for possible
  duplicates rather than as a hard blocker.
- A player should not appear twice in the same tournament, even if a team tries
  to add them again.
- Shirt numbers are optional at creation time.
- If a shirt number is present, prevent duplicate numbers within the same team
  and tournament.
- A roster entry with existing match events should not be hard-deleted; mark it
  inactive or preserve it for history.
- Suspended players should remain selectable in historical views but should be
  visually flagged in admin workflows.

## Implementation Phases

### Phase 1 - Players And Rosters

Deliverables:

- Supabase migration for `football_players`.
- Supabase migration for `football_roster_entries`.
- RLS policies for admin-only raw access.
- Admin data helpers for listing players and roster entries.
- Server actions for create/update/remove roster entries.
- Team tab UI showing roster counts and documentation badges.
- Forms to add new or existing players to a team roster.
- Tests for schema, actions, validation, and the admin UI.

Out of scope:

- file uploads
- public roster pages
- match event entry
- scorer tables

### Phase 2 - Match Events And Stats

Deliverables:

- Supabase migration for `football_match_events`.
- Admin event-entry UI inside match result editing.
- Result-lock validation that compares goal events with score.
- Derived scorer table.
- Derived card table or discipline summary.
- Public tournament detail section for scorer leaders and match event details.

## Testing Strategy

Schema tests:

- tables exist with expected columns and constraints.
- DNI/document number is nullable.
- roster entries reference tournament, team, and player.
- roster uniqueness rules are present.
- RLS policies avoid public raw access.

Action tests:

- create a player without document number.
- add a new player to a tournament team roster.
- add an existing player to a tournament team roster.
- reject duplicate roster entry in the same tournament.
- reject duplicate shirt number inside the same team and tournament.
- update documentation statuses.
- prevent destructive removal when historical events exist after phase two.

UI tests:

- team tab shows roster affordance.
- team without players shows a clear empty state.
- roster rows show shirt number, player name, player status, medical status,
  and insurance status.
- form allows document number to stay empty.

## Open Implementation Notes

- Keep file names and helpers aligned with the existing
  `src/features/football-tournaments` module.
- Avoid a broad multi-sport abstraction.
- Keep public projections explicit instead of exposing raw player tables.
- Prefer derived stats over manually stored scorer/card tables.
