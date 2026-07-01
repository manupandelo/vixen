alter table public.football_tournaments
  add column if not exists format text not null default 'league'
  check (format in ('league', 'cup', 'league_playoff'));
