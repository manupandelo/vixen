-- Allow null for future bracket matches
alter table public.football_matches alter column home_team_id drop not null;
alter table public.football_matches alter column away_team_id drop not null;

-- Add a column to define bracket progression
alter table public.football_matches
  add column if not exists next_match_id uuid references public.football_matches(id) on delete set null;

DO $$
BEGIN
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.football_matches'::regclass
      and conname = 'football_matches_teams_check'
  ) then
    alter table public.football_matches
      add constraint football_matches_teams_check
      check (home_team_id is null or away_team_id is null or home_team_id <> away_team_id);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.football_matches'::regclass
      and conname = 'football_matches_home_score_check'
  ) then
    alter table public.football_matches
      add constraint football_matches_home_score_check
      check (home_score is null or home_score >= 0);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.football_matches'::regclass
      and conname = 'football_matches_away_score_check'
  ) then
    alter table public.football_matches
      add constraint football_matches_away_score_check
      check (away_score is null or away_score >= 0);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.football_matches'::regclass
      and conname = 'football_matches_status_check'
  ) then
    alter table public.football_matches
      add constraint football_matches_status_check
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
      );
  end if;
END $$;

create or replace function public.match_teams_belong_to_tournament()
returns trigger
language plpgsql
as $$
begin
  if new.home_team_id is not null and not exists (
    select 1
    from public.football_tournament_teams registration
    where registration.tournament_id = new.tournament_id
      and registration.team_id = new.home_team_id
  ) then
    raise exception 'home team does not belong to match tournament';
  end if;

  if new.away_team_id is not null and not exists (
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

notify pgrst, 'reload schema';
