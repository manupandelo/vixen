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

create type football_match_status as enum (
  'scheduled',
  'completed',
  'postponed',
  'cancelled'
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
  team_id uuid not null references public.football_teams(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (tournament_id, team_id)
);

create table public.football_team_admin_details (
  team_id uuid primary key references public.football_teams(id) on delete cascade,
  captain_name text,
  contact_phone text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.football_matches (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.football_tournaments(id) on delete cascade,
  round_label text not null,
  scheduled_at timestamptz,
  home_team_id uuid not null references public.football_teams(id) on delete restrict,
  away_team_id uuid not null references public.football_teams(id) on delete restrict,
  home_score integer,
  away_score integer,
  status football_match_status not null default 'scheduled',
  notes text,
  assigned_viewer_id uuid references public.admin_profiles(id) on delete set null,
  result_locked_at timestamptz,
  result_submitted_by uuid references public.admin_profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (home_team_id <> away_team_id),
  check (home_score is null or home_score >= 0),
  check (away_score is null or away_score >= 0),
  check (
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

create trigger football_teams_set_updated_at
before update on public.football_teams
for each row execute function public.set_updated_at();

create trigger football_team_admin_details_set_updated_at
before update on public.football_team_admin_details
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
  if not exists (
    select 1
    from public.football_tournament_teams registration
    where registration.tournament_id = new.tournament_id
      and registration.team_id = new.home_team_id
  ) then
    raise exception 'home team does not belong to match tournament';
  end if;

  if not exists (
    select 1
    from public.football_tournament_teams registration
    where registration.tournament_id = new.tournament_id
      and registration.team_id = new.away_team_id
  ) then
    raise exception 'away team does not belong to match tournament';
  end if;

  return new;
end;
$$;

create trigger football_matches_team_tournament_check
before insert or update on public.football_matches
for each row execute function public.match_teams_belong_to_tournament();

alter table public.admin_profiles enable row level security;
alter table public.football_tournaments enable row level security;
alter table public.football_teams enable row level security;
alter table public.football_tournament_teams enable row level security;
alter table public.football_team_admin_details enable row level security;
alter table public.football_matches enable row level security;
alter table public.football_audit_events enable row level security;

create policy "Admins can read admin profiles"
on public.admin_profiles for select
using (public.is_admin());

create policy "Admins can manage tournaments"
on public.football_tournaments for all
using (public.is_admin())
with check (public.is_admin());

create policy "Public can read visible tournaments"
on public.football_tournaments for select
using (status in ('published', 'active', 'completed'));

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
    join public.football_tournaments tournament
      on tournament.id = registration.tournament_id
    where registration.team_id = football_teams.id
      and tournament.status in ('published', 'active', 'completed')
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
    from public.football_tournaments tournament
    where tournament.id = football_tournament_teams.tournament_id
      and tournament.status in ('published', 'active', 'completed')
  )
);

create policy "Admins can manage team private details"
on public.football_team_admin_details for all
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
    from public.football_tournaments tournament
    where tournament.id = football_matches.tournament_id
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
