-- Guarda a qué lado del partido siguiente avanza el ganador.
-- Sin este dato el bracket ordena los cruces por id y el ganador no puede sembrarse.

alter table public.football_matches
  add column if not exists next_match_slot text;

-- Backfill determinista para llaves ya cargadas: reproduce el orden por id
-- que usaba tree-reconstructor.ts, así ningún bracket existente cambia de forma.
update public.football_matches m
set next_match_slot = ranked.slot
from (
  select
    id,
    case
      row_number() over (partition by next_match_id order by created_at, id)
      when 1 then 'home'
      else 'away'
    end as slot
  from public.football_matches
  where next_match_id is not null
) ranked
where m.id = ranked.id
  and m.next_match_slot is null;

alter table public.football_matches
  add constraint football_matches_next_match_slot_check
  check (next_match_slot is null or next_match_slot in ('home', 'away'));

alter table public.football_matches
  add constraint football_matches_next_match_slot_pair_check
  check ((next_match_id is null) = (next_match_slot is null));

-- Garantía dura: dos partidos no pueden alimentar el mismo lado del siguiente.
-- Si esta creación falla, hay un partido con más de dos alimentadores: la llave
-- está corrupta y hay que regenerar el fixture de esa categoría.
create unique index if not exists football_matches_next_match_slot_key
  on public.football_matches (next_match_id, next_match_slot)
  where next_match_id is not null;
