create table public.football_tournament_teams (
  tournament_id uuid not null references public.football_tournaments(id) on delete cascade,
  team_id uuid not null references public.football_teams(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (tournament_id, team_id)
);

insert into public.football_tournament_teams (tournament_id, team_id)
select tournament_id, id
from public.football_teams
where tournament_id is not null
on conflict do nothing;

drop trigger if exists football_matches_team_tournament_check on public.football_matches;
drop trigger if exists football_teams_prevent_tournament_change on public.football_teams;
drop function if exists public.prevent_team_tournament_change();

alter table public.football_teams
  alter column tournament_id drop not null;

alter table public.football_teams
  drop constraint if exists football_teams_tournament_id_name_key;

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

alter table public.football_tournament_teams enable row level security;

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

drop policy if exists "Public can read teams from visible tournaments"
on public.football_teams;

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
