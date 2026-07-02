-- Consolidated reference schema for the current Vixen football admin database.
-- Keep migrations as the deployable source of truth. Use this file to understand
-- the final shape after all migrations in supabase/migrations have run.

create extension if not exists "pgcrypto";

create type football_tournament_status as enum (
  'draft',
  'published',
  'active',
  'completed',
  'archived'
);

create type football_tournament_category_status as enum (
  'draft',
  'published',
  'active',
  'completed',
  'archived'
);

create type football_match_status as enum (
  'scheduled',
  'completed',
  'postponed',
  'cancelled'
);

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

create table public.admin_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  role text not null check (role in ('admin', 'viewer')),
  status text not null default 'active' check (status in ('active', 'suspended')),
  suspended_at timestamptz,
  suspended_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.football_tournaments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  season text not null,
  category text not null,
  status football_tournament_status not null default 'draft',
  format text not null default 'league'
    check (format in ('league', 'cup', 'league_playoff')),
  starts_at date,
  ends_at date,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
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

create table public.football_teams (
  id uuid primary key default gen_random_uuid(),
  -- Nullable legacy column kept after teams became reusable across tournaments.
  -- Tournament membership is represented by football_tournament_teams.
  tournament_id uuid references public.football_tournaments(id) on delete cascade,
  name text not null,
  short_name text,
  photo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.football_tournament_teams (
  tournament_id uuid not null references public.football_tournaments(id) on delete cascade,
  category_id uuid not null references public.football_tournament_categories(id) on delete cascade,
  team_id uuid not null references public.football_teams(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (category_id, team_id),
  constraint football_tournament_teams_tournament_category_fkey
    foreign key (tournament_id, category_id)
    references public.football_tournament_categories(tournament_id, id)
    on delete cascade
);

create table public.football_tournament_groups (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.football_tournaments(id) on delete cascade,
  category_id uuid not null references public.football_tournament_categories(id) on delete cascade,
  name text not null,
  position integer not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (category_id, name),
  unique (category_id, position),
  unique (id, category_id),
  constraint football_tournament_groups_tournament_category_fkey
    foreign key (tournament_id, category_id)
    references public.football_tournament_categories(tournament_id, id)
    on delete cascade,
  check (position > 0)
);

create table public.football_tournament_group_teams (
  group_id uuid not null references public.football_tournament_groups(id) on delete cascade,
  category_id uuid not null references public.football_tournament_categories(id) on delete cascade,
  team_id uuid not null references public.football_teams(id) on delete cascade,
  seed integer not null,
  created_at timestamptz not null default now(),
  primary key (group_id, team_id),
  unique (group_id, seed),
  constraint football_tournament_group_teams_group_category_fkey
    foreign key (group_id, category_id)
    references public.football_tournament_groups(id, category_id)
    on delete cascade,
  constraint football_tournament_group_teams_category_team_fkey
    foreign key (category_id, team_id)
    references public.football_tournament_teams(category_id, team_id)
    on delete cascade,
  check (seed > 0)
);

create table public.football_team_admin_details (
  team_id uuid primary key references public.football_teams(id) on delete cascade,
  captain_name text,
  contact_phone text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
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
  category_id uuid not null references public.football_tournament_categories(id) on delete cascade,
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
  unique (category_id, player_id),
  constraint football_roster_entries_category_team_fkey
    foreign key (category_id, team_id)
    references public.football_tournament_teams(category_id, team_id)
    on delete cascade,
  constraint football_roster_entries_tournament_category_fkey
    foreign key (tournament_id, category_id)
    references public.football_tournament_categories(tournament_id, id)
    on delete cascade,
  constraint football_roster_entries_shirt_number_check
    check (shirt_number is null or shirt_number between 0 and 99)
);

create unique index football_roster_entries_team_shirt_number_key
on public.football_roster_entries(category_id, team_id, shirt_number)
where shirt_number is not null;

create table public.football_matches (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.football_tournaments(id) on delete cascade,
  category_id uuid not null references public.football_tournament_categories(id) on delete cascade,
  round_label text not null,
  scheduled_at timestamptz,
  home_team_id uuid references public.football_teams(id) on delete restrict,
  away_team_id uuid references public.football_teams(id) on delete restrict,
  group_id uuid,
  next_match_id uuid references public.football_matches(id) on delete set null,
  home_score integer,
  away_score integer,
  status football_match_status not null default 'scheduled',
  notes text,
  assigned_viewer_id uuid references public.admin_profiles(id) on delete set null,
  result_locked_at timestamptz,
  result_submitted_by uuid references public.admin_profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint football_matches_tournament_category_fkey
    foreign key (tournament_id, category_id)
    references public.football_tournament_categories(tournament_id, id)
    on delete cascade,
  constraint football_matches_group_category_fkey
    foreign key (group_id, category_id)
    references public.football_tournament_groups(id, category_id)
    on delete set null (group_id),
  constraint football_matches_teams_check
    check (home_team_id is null or away_team_id is null or home_team_id <> away_team_id),
  constraint football_matches_home_score_check
    check (home_score is null or home_score >= 0),
  constraint football_matches_away_score_check
    check (away_score is null or away_score >= 0),
  constraint football_matches_status_check check (
    (
      status = 'completed'
      and home_score is not null
      and away_score is not null
    )
    or
    (
      status <> 'completed'
      and home_score is null
      and away_score is null
    )
  )
);

create table public.football_audit_events (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid references public.football_tournaments(id) on delete set null,
  actor_profile_id uuid references public.admin_profiles(id) on delete set null,
  actor_email text not null,
  entity_type text not null
    check (
      entity_type in (
        'tournament',
        'team',
        'match',
        'viewer_assignment',
        'match_result'
      )
    ),
  entity_id uuid not null,
  action text not null
    check (
      action in (
        'created',
        'updated',
        'deleted',
        'removed_from_tournament',
        'assigned',
        'submitted'
      )
    ),
  summary text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index football_audit_events_tournament_created_idx
on public.football_audit_events (tournament_id, created_at desc);

create index football_audit_events_actor_created_idx
on public.football_audit_events (actor_profile_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger admin_profiles_set_updated_at
before update on public.admin_profiles
for each row execute function public.set_updated_at();

create trigger football_tournaments_set_updated_at
before update on public.football_tournaments
for each row execute function public.set_updated_at();

create trigger football_tournament_categories_set_updated_at
before update on public.football_tournament_categories
for each row execute function public.set_updated_at();

create trigger football_teams_set_updated_at
before update on public.football_teams
for each row execute function public.set_updated_at();

create trigger football_tournament_groups_set_updated_at
before update on public.football_tournament_groups
for each row execute function public.set_updated_at();

create trigger football_team_admin_details_set_updated_at
before update on public.football_team_admin_details
for each row execute function public.set_updated_at();

create trigger football_players_set_updated_at
before update on public.football_players
for each row execute function public.set_updated_at();

create trigger football_roster_entries_set_updated_at
before update on public.football_roster_entries
for each row execute function public.set_updated_at();

create trigger football_matches_set_updated_at
before update on public.football_matches
for each row execute function public.set_updated_at();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_profiles
    where id = auth.uid()
      and role = 'admin'
      and status = 'active'
  );
$$;

create or replace function public.is_viewer()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_profiles
    where id = auth.uid()
      and role = 'viewer'
      and status = 'active'
  );
$$;

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

create trigger football_matches_team_tournament_check
before insert or update on public.football_matches
for each row execute function public.match_teams_belong_to_tournament();

alter table public.admin_profiles enable row level security;
alter table public.football_tournaments enable row level security;
alter table public.football_tournament_categories enable row level security;
alter table public.football_teams enable row level security;
alter table public.football_tournament_teams enable row level security;
alter table public.football_tournament_groups enable row level security;
alter table public.football_tournament_group_teams enable row level security;
alter table public.football_team_admin_details enable row level security;
alter table public.football_players enable row level security;
alter table public.football_roster_entries enable row level security;
alter table public.football_matches enable row level security;
alter table public.football_audit_events enable row level security;

create policy "Admins can read admin profiles"
on public.admin_profiles for select
using (public.is_admin());

create policy "Active staff can read own profile"
on public.admin_profiles for select
using (
  id = auth.uid()
  and role in ('admin', 'viewer')
  and status = 'active'
);

create policy "Admins can manage tournaments"
on public.football_tournaments for all
using (public.is_admin())
with check (public.is_admin());

create policy "Public can read visible tournaments"
on public.football_tournaments for select
using (status in ('published', 'active', 'completed'));

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

create policy "Admins can manage teams"
on public.football_teams for all
using (public.is_admin())
with check (public.is_admin());

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
      and tournament.status in ('published', 'active', 'completed')
      and category.status in ('published', 'active', 'completed')
  )
);

create policy "Admins can manage tournament team registrations"
on public.football_tournament_teams for all
using (public.is_admin())
with check (public.is_admin());

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

create policy "Admins can manage tournament groups"
on public.football_tournament_groups for all
using (public.is_admin())
with check (public.is_admin());

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

create policy "Admins can manage tournament group teams"
on public.football_tournament_group_teams for all
using (public.is_admin())
with check (public.is_admin());

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

create policy "Admins can manage team private details"
on public.football_team_admin_details for all
using (public.is_admin())
with check (public.is_admin());

create policy "Admins can manage football players"
on public.football_players for all
using (public.is_admin())
with check (public.is_admin());

create policy "Admins can manage football roster entries"
on public.football_roster_entries for all
using (public.is_admin())
with check (public.is_admin());

create policy "Admins can manage matches"
on public.football_matches for all
using (public.is_admin())
with check (public.is_admin());

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

create policy "Viewers can read assigned matches"
on public.football_matches for select
using (
  public.is_viewer()
  and assigned_viewer_id = auth.uid()
);

create policy "Viewers can submit assigned unlocked results"
on public.football_matches for update
using (
  public.is_viewer()
  and assigned_viewer_id = auth.uid()
  and result_locked_at is null
)
with check (
  public.is_viewer()
  and assigned_viewer_id = auth.uid()
  and result_locked_at is not null
  and result_submitted_by = auth.uid()
  and status = 'completed'
  and home_score is not null
  and away_score is not null
);

create policy "Admins can read football audit events"
on public.football_audit_events for select
using (public.is_admin());

create policy "Active staff can create football audit events"
on public.football_audit_events for insert
with check (
  (public.is_admin() or public.is_viewer())
  and actor_profile_id = auth.uid()
);

insert into storage.buckets (id, name, public)
values ('team-photos', 'team-photos', true)
on conflict (id) do update set public = excluded.public;

create policy "Public can read team photos"
on storage.objects for select
using (bucket_id = 'team-photos');

create policy "Admins can upload team photos"
on storage.objects for insert
with check (
  bucket_id = 'team-photos'
  and public.is_admin()
);

create policy "Admins can update team photos"
on storage.objects for update
using (
  bucket_id = 'team-photos'
  and public.is_admin()
)
with check (
  bucket_id = 'team-photos'
  and public.is_admin()
);
