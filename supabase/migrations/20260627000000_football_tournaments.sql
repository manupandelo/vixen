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
  role text not null check (role = 'admin'),
  created_at timestamptz not null default now()
);

create table public.football_tournaments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  season text not null,
  category text not null,
  status football_tournament_status not null default 'draft',
  starts_at date,
  ends_at date,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.football_teams (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.football_tournaments(id) on delete cascade,
  name text not null,
  short_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tournament_id, name)
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

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

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
  );
$$;

create or replace function public.match_teams_belong_to_tournament()
returns trigger
language plpgsql
as $$
declare
  home_tournament uuid;
  away_tournament uuid;
begin
  select tournament_id into home_tournament
  from public.football_teams
  where id = new.home_team_id;

  select tournament_id into away_tournament
  from public.football_teams
  where id = new.away_team_id;

  if home_tournament is distinct from new.tournament_id then
    raise exception 'home team does not belong to match tournament';
  end if;

  if away_tournament is distinct from new.tournament_id then
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
alter table public.football_team_admin_details enable row level security;
alter table public.football_matches enable row level security;

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

create policy "Public can read teams from visible tournaments"
on public.football_teams for select
using (
  exists (
    select 1
    from public.football_tournaments t
    where t.id = football_teams.tournament_id
      and t.status in ('published', 'active', 'completed')
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
    from public.football_tournaments t
    where t.id = football_matches.tournament_id
      and t.status in ('published', 'active', 'completed')
  )
);
