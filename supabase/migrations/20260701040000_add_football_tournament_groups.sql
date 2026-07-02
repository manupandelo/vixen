create table if not exists public.football_tournament_groups (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.football_tournaments(id) on delete cascade,
  name text not null,
  position integer not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tournament_id, name),
  unique (tournament_id, position),
  check (position > 0)
);

create table if not exists public.football_tournament_group_teams (
  group_id uuid not null references public.football_tournament_groups(id) on delete cascade,
  team_id uuid not null references public.football_teams(id) on delete cascade,
  seed integer not null,
  created_at timestamptz not null default now(),
  primary key (group_id, team_id),
  unique (group_id, seed),
  check (seed > 0)
);

alter table public.football_matches
  add column if not exists group_id uuid references public.football_tournament_groups(id) on delete set null;

create trigger football_tournament_groups_set_updated_at
before update on public.football_tournament_groups
for each row execute function public.set_updated_at();

alter table public.football_tournament_groups enable row level security;
alter table public.football_tournament_group_teams enable row level security;

create policy "Admins can manage tournament groups"
on public.football_tournament_groups for all
using (public.is_admin())
with check (public.is_admin());

create policy "Public can read visible tournament groups"
on public.football_tournament_groups for select
using (
  exists (
    select 1
    from public.football_tournaments tournament
    where tournament.id = football_tournament_groups.tournament_id
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
    join public.football_tournaments tournament
      on tournament.id = tournament_group.tournament_id
    where tournament_group.id = football_tournament_group_teams.group_id
      and tournament.status in ('published', 'active', 'completed')
  )
);

notify pgrst, 'reload schema';
