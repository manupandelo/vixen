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
  unique (tournament_id, id),
  constraint football_tournament_categories_name_check check (length(trim(name)) >= 2),
  constraint football_tournament_categories_slug_check check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
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
  tournament.id,
  tournament.category,
  coalesce(
    nullif(
      lower(
        trim(
          both '-'
          from regexp_replace(tournament.category, '[^a-zA-Z0-9]+', '-', 'g')
        )
      ),
      ''
    ),
    'categoria'
  ),
  tournament.status::text::public.football_tournament_category_status,
  0,
  tournament.starts_at,
  tournament.ends_at
from public.football_tournaments tournament;

alter table public.football_tournament_teams
  add column category_id uuid references public.football_tournament_categories(id) on delete cascade;

update public.football_tournament_teams registration
set category_id = category.id
from public.football_tournament_categories category
where category.tournament_id = registration.tournament_id;

alter table public.football_roster_entries
  drop constraint if exists football_roster_entries_tournament_team_fkey;

alter table public.football_tournament_teams
  alter column category_id set not null,
  drop constraint if exists football_tournament_teams_pkey,
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
  alter column category_id set not null,
  drop constraint if exists football_tournament_groups_tournament_id_name_key,
  drop constraint if exists football_tournament_groups_tournament_id_position_key,
  add constraint football_tournament_groups_category_name_key unique (category_id, name),
  add constraint football_tournament_groups_category_position_key unique (category_id, position),
  add constraint football_tournament_groups_id_category_key unique (id, category_id),
  add constraint football_tournament_groups_tournament_category_fkey
    foreign key (tournament_id, category_id)
    references public.football_tournament_categories(tournament_id, id)
    on delete cascade;

alter table public.football_tournament_group_teams
  add column category_id uuid references public.football_tournament_categories(id) on delete cascade;

update public.football_tournament_group_teams group_team
set category_id = tournament_group.category_id
from public.football_tournament_groups tournament_group
where tournament_group.id = group_team.group_id;

alter table public.football_tournament_group_teams
  alter column category_id set not null,
  add constraint football_tournament_group_teams_group_category_fkey
    foreign key (group_id, category_id)
    references public.football_tournament_groups(id, category_id)
    on delete cascade,
  add constraint football_tournament_group_teams_category_team_fkey
    foreign key (category_id, team_id)
    references public.football_tournament_teams(category_id, team_id)
    on delete cascade;

alter table public.football_roster_entries
  add column category_id uuid references public.football_tournament_categories(id) on delete cascade;

update public.football_roster_entries roster
set category_id = registration.category_id
from public.football_tournament_teams registration
where registration.tournament_id = roster.tournament_id
  and registration.team_id = roster.team_id;

alter table public.football_roster_entries
  alter column category_id set not null,
  drop constraint if exists football_roster_entries_tournament_id_player_id_key,
  drop constraint if exists football_roster_entries_tournament_team_fkey;

drop index if exists public.football_roster_entries_team_shirt_number_key;

alter table public.football_roster_entries
  add constraint football_roster_entries_category_player_key unique (category_id, player_id),
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

create or replace function public.match_teams_belong_to_tournament()
returns trigger
language plpgsql
as $$
begin
  if new.home_team_id is not null and not exists (
    select 1
    from public.football_tournament_teams registration
    where registration.category_id = new.category_id
      and registration.team_id = new.home_team_id
  ) then
    raise exception 'home team does not belong to match category';
  end if;

  if new.away_team_id is not null and not exists (
    select 1
    from public.football_tournament_teams registration
    where registration.category_id = new.category_id
      and registration.team_id = new.away_team_id
  ) then
    raise exception 'away team does not belong to match category';
  end if;

  return new;
end;
$$;

create trigger football_tournament_categories_set_updated_at
before update on public.football_tournament_categories
for each row execute function public.set_updated_at();

alter table public.football_tournament_categories enable row level security;

create policy "Admins can manage tournament categories"
on public.football_tournament_categories for all
using (public.is_admin())
with check (public.is_admin());

create policy "Public can read visible tournament categories"
on public.football_tournament_categories for select
using (
  status in ('published', 'active', 'completed')
  and exists (
    select 1
    from public.football_tournaments tournament
    where tournament.id = football_tournament_categories.tournament_id
      and tournament.status in ('published', 'active', 'completed')
  )
);

drop policy if exists "Public can read teams from visible tournament registrations"
on public.football_teams;

create policy "Public can read teams from visible tournament registrations"
on public.football_teams for select
using (
  exists (
    select 1
    from public.football_tournament_teams registration
    join public.football_tournament_categories category
      on category.id = registration.category_id
    join public.football_tournaments tournament
      on tournament.id = registration.tournament_id
    where registration.team_id = football_teams.id
      and category.status in ('published', 'active', 'completed')
      and tournament.status in ('published', 'active', 'completed')
  )
);

drop policy if exists "Public can read visible tournament team registrations"
on public.football_tournament_teams;

create policy "Public can read visible tournament team registrations"
on public.football_tournament_teams for select
using (
  exists (
    select 1
    from public.football_tournament_categories category
    join public.football_tournaments tournament
      on tournament.id = category.tournament_id
    where category.id = football_tournament_teams.category_id
      and tournament.id = football_tournament_teams.tournament_id
      and category.status in ('published', 'active', 'completed')
      and tournament.status in ('published', 'active', 'completed')
  )
);

drop policy if exists "Public can read visible tournament groups"
on public.football_tournament_groups;

create policy "Public can read visible tournament groups"
on public.football_tournament_groups for select
using (
  exists (
    select 1
    from public.football_tournament_categories category
    join public.football_tournaments tournament
      on tournament.id = category.tournament_id
    where category.id = football_tournament_groups.category_id
      and tournament.id = football_tournament_groups.tournament_id
      and category.status in ('published', 'active', 'completed')
      and tournament.status in ('published', 'active', 'completed')
  )
);

drop policy if exists "Public can read visible tournament group teams"
on public.football_tournament_group_teams;

create policy "Public can read visible tournament group teams"
on public.football_tournament_group_teams for select
using (
  exists (
    select 1
    from public.football_tournament_groups tournament_group
    join public.football_tournament_categories category
      on category.id = tournament_group.category_id
    join public.football_tournaments tournament
      on tournament.id = tournament_group.tournament_id
    where tournament_group.id = football_tournament_group_teams.group_id
      and category.status in ('published', 'active', 'completed')
      and tournament.status in ('published', 'active', 'completed')
  )
);

drop policy if exists "Public can read matches from visible tournaments"
on public.football_matches;

create policy "Public can read matches from visible tournaments"
on public.football_matches for select
using (
  exists (
    select 1
    from public.football_tournament_categories category
    join public.football_tournaments tournament
      on tournament.id = category.tournament_id
    where category.id = football_matches.category_id
      and tournament.id = football_matches.tournament_id
      and category.status in ('published', 'active', 'completed')
      and tournament.status in ('published', 'active', 'completed')
  )
);

notify pgrst, 'reload schema';
