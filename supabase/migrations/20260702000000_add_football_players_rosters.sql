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
  constraint football_roster_entries_tournament_team_fkey
    foreign key (tournament_id, team_id)
    references public.football_tournament_teams(tournament_id, team_id)
    on delete cascade,
  constraint football_roster_entries_shirt_number_check
    check (shirt_number is null or shirt_number between 0 and 99)
);

create unique index football_roster_entries_team_shirt_number_key
on public.football_roster_entries(tournament_id, team_id, shirt_number)
where shirt_number is not null;

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

notify pgrst, 'reload schema';
