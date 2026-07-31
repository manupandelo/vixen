-- Expone goleadores y tarjetas en la web pública sin filtrar datos personales.
--
-- football_players guarda DNI, teléfono y fecha de nacimiento en la misma fila
-- que el nombre. RLS en Postgres es por fila, no por columna: dar lectura
-- pública a la tabla expondría todo eso a cualquiera con la anon key. Por eso
-- se publica una vista con las dos únicas columnas que la web necesita.

create or replace view public.football_public_player_names as
select
  player.id,
  coalesce(
    nullif(btrim(player.public_name), ''),
    btrim(player.first_name || ' ' || player.last_name)
  ) as display_name
from public.football_players player;

-- La vista corre con los privilegios de su dueño, así que no hace falta abrir
-- RLS sobre football_players.
grant select on public.football_public_player_names to anon, authenticated;

-- Los eventos no exponen nada personal por sí solos (referencian ids) y se
-- limitan a torneos y categorías visibles, igual que football_matches.
create policy "Public can read events from visible tournaments"
on public.football_match_events for select
using (
  exists (
    select 1
    from public.football_tournament_categories category
    join public.football_tournaments tournament
      on tournament.id = category.tournament_id
    where category.id = football_match_events.category_id
      and tournament.id = football_match_events.tournament_id
      and category.status in ('published', 'active', 'completed')
      and tournament.status in ('published', 'active', 'completed')
  )
);

-- El numero de camiseta vive en la inscripcion, que tampoco es publica: la
-- tabla ademas guarda estado medico, seguro y notas internas. Misma solucion,
-- una vista con lo minimo para mostrar el numero junto al nombre.
create or replace view public.football_public_roster_numbers as
select
  entry.category_id,
  entry.player_id,
  entry.shirt_number
from public.football_roster_entries entry;

grant select on public.football_public_roster_numbers to anon, authenticated;
