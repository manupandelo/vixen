-- Hardening for football reads and result integrity.

create index if not exists football_matches_category_schedule_idx
on public.football_matches(tournament_id, category_id, scheduled_at);

create index if not exists football_matches_viewer_unlocked_idx
on public.football_matches(assigned_viewer_id, result_locked_at)
where assigned_viewer_id is not null;

create index if not exists football_roster_entries_category_team_idx
on public.football_roster_entries(category_id, team_id);

create index if not exists football_match_events_match_team_idx
on public.football_match_events(match_id, team_id);

create unique index if not exists football_match_events_player_yellow_card_key
on public.football_match_events(match_id, roster_entry_id)
where roster_entry_id is not null and event_type = 'yellow_card';

create unique index if not exists football_match_events_player_red_card_key
on public.football_match_events(match_id, roster_entry_id)
where roster_entry_id is not null and event_type = 'red_card';

create or replace function public.elimination_matches_require_winner()
returns trigger
language plpgsql
as $$
declare
  tournament_format text;
begin
  if new.status = 'completed'
    and new.home_score is not null
    and new.away_score is not null
    and new.home_score = new.away_score
  then
    select tournament.format
    into tournament_format
    from public.football_tournaments tournament
    where tournament.id = new.tournament_id;

    if tournament_format = 'cup'
      or (tournament_format = 'league_playoff' and new.group_id is null)
    then
      if new.home_penalty_score is null
        or new.away_penalty_score is null
        or new.home_penalty_score = new.away_penalty_score
      then
        raise exception 'tied elimination matches require a penalty winner';
      end if;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists football_matches_elimination_winner_check on public.football_matches;

create trigger football_matches_elimination_winner_check
before insert or update of
  tournament_id,
  group_id,
  status,
  home_score,
  away_score,
  home_penalty_score,
  away_penalty_score
on public.football_matches
for each row execute function public.elimination_matches_require_winner();

create or replace function public.match_events_belong_to_match()
returns trigger
language plpgsql
as $$
declare
  football_match public.football_matches%rowtype;
begin
  select *
  into football_match
  from public.football_matches
  where id = new.match_id;

  if football_match.id is null then
    raise exception 'match event does not belong to an existing match';
  end if;

  if new.tournament_id <> football_match.tournament_id
    or new.category_id <> football_match.category_id
  then
    raise exception 'match event tournament category does not match';
  end if;

  if football_match.home_team_id is null
    or football_match.away_team_id is null
    or new.team_id not in (football_match.home_team_id, football_match.away_team_id)
  then
    raise exception 'match event team does not belong to match';
  end if;

  if new.roster_entry_id is not null and not exists (
    select 1
    from public.football_roster_entries roster
    where roster.id = new.roster_entry_id
      and roster.category_id = football_match.category_id
      and roster.team_id = new.team_id
      and roster.player_id = new.player_id
  ) then
    raise exception 'match event roster entry does not belong to match team';
  end if;

  return new;
end;
$$;

drop trigger if exists football_match_events_match_roster_check on public.football_match_events;

create trigger football_match_events_match_roster_check
before insert or update of
  match_id,
  tournament_id,
  category_id,
  team_id,
  roster_entry_id,
  player_id
on public.football_match_events
for each row execute function public.match_events_belong_to_match();
