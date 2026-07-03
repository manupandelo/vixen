# Supabase database

Este directorio tiene dos tipos de archivos:

- `migrations/`: historial ejecutable. No conviene reescribirlo si ya fue aplicado en Supabase.
- `schema.sql`: foto consolidada del esquema actual, pensada para leer rapido como esta armada la base.

## Modelo principal

La base esta armada alrededor de torneos de futbol:

- `football_tournaments`: datos base del torneo, estado publico y formato.
- `football_tournament_categories`: categorias competitivas dentro de un torneo.
- `football_teams`: equipos reutilizables. El `tournament_id` queda como columna legacy nullable; la relacion vigente con torneos es por tabla puente.
- `football_tournament_teams`: inscripcion de equipos en categorias de torneos.
- `football_tournament_groups`: zonas de una categoria con formato zonas + playoff.
- `football_tournament_group_teams`: equipos asignados a cada zona.
- `football_team_admin_details`: datos privados del equipo, como capitan, telefono y notas internas.
- `football_players`: datos privados reutilizables de jugadores.
- `football_roster_entries`: plantel de un equipo dentro de un torneo, con numero y estado documental.
- `football_matches`: fixture, progresion de llaves por `next_match_id`, veedor asignado, resultado y bloqueo de resultado cargado por veedor.
- `football_audit_events`: historial de cambios relevantes por usuario.
- `admin_profiles`: perfil interno de usuarios del panel, conectado a `auth.users`.

### football_tournament_categories

Competitive categories inside one parent football tournament. Categories own teams, rosters, groups, matches, standings, and fixture generation. Parent tournaments keep shared name, season, format, and publication.

Existing tournaments are migrated into one default category based on the former `football_tournaments.category` value.

## Relaciones

- Un torneo tiene muchos partidos por `football_matches.tournament_id`.
- Un torneo puede tener muchas categorias por `football_tournament_categories.tournament_id`.
- Una categoria tiene muchos partidos por `football_matches.category_id`.
- Una categoria tiene muchos equipos por `football_tournament_teams.category_id`.
- Una categoria puede tener muchas zonas por `football_tournament_groups.category_id`.
- Una zona tiene muchos equipos por `football_tournament_group_teams.group_id`.
- Un equipo puede participar en muchos torneos por `football_tournament_teams.team_id`, pero no puede estar en mas de una categoria del mismo torneo.
- Un equipo tiene un unico bloque privado en `football_team_admin_details`.
- Un jugador puede tener muchas inscripciones de plantel por `football_roster_entries.player_id`.
- Un torneo tiene muchos jugadores de plantel por `football_roster_entries.tournament_id`.
- Un equipo tiene muchos jugadores de plantel por `football_roster_entries.team_id`.
- La pertenencia del plantel a categoria/equipo se valida con una FK compuesta contra `football_tournament_teams`.
- Un partido referencia equipo local y visitante con `home_team_id` y `away_team_id`; en llaves de copa pueden quedar nulos hasta conocer los ganadores previos.
- Un partido de fase de grupos puede pertenecer a una zona por `group_id`.
- Un partido de copa puede apuntar al siguiente cruce con `next_match_id`.
- Un partido puede tener veedor asignado por `assigned_viewer_id`.
- Un resultado cargado por veedor queda marcado con `result_locked_at` y `result_submitted_by`.
- Un evento de auditoria guarda `actor_profile_id`, `actor_email`, entidad, accion, resumen y metadata.

## Estados y reglas

Torneos:

- `draft`: borrador privado.
- `published`: visible publicamente.
- `active`: visible publicamente y en gestion.
- `completed`: visible publicamente como cerrado.
- `archived`: privado/no visible.

Partidos:

- `scheduled`: programado, sin resultado.
- `completed`: finalizado, requiere `home_score` y `away_score`.
- `postponed`: postergado, sin resultado.
- `cancelled`: cancelado, sin resultado.

Formatos de torneo:

- `league`
- `cup`
- `league_playoff`

## Seguridad y datos privados

RLS esta activado en todas las tablas publicas del dominio de futbol.

- Publico anonimo puede leer torneos, categorias, equipos, inscripciones, zonas y partidos solo si el torneo y la categoria estan `published`, `active` o `completed`.
- Admins activos pueden gestionar torneos, categorias, equipos, inscripciones, zonas, datos privados y partidos.
- Staff activo puede leer su propio `admin_profiles`; esto permite que admins y veedores resuelvan su rol durante login.
- Veedores activos solo pueden leer sus partidos asignados y cargar una vez el resultado de partidos desbloqueados.
- Datos privados de equipos viven en `football_team_admin_details` y no se exponen en la pagina publica.
- Datos personales de jugadores viven en `football_players` y datos operativos del plantel en `football_roster_entries`; no se exponen en paginas publicas crudas.
- Auditoria puede ser leida por admins. Admins y veedores activos pueden insertar eventos de auditoria propios.

Las acciones de gestion de usuarios usan service role desde `staff-admin.server.ts`; por eso no dependen de politicas publicas de escritura sobre `admin_profiles`.

## Storage

Bucket:

- `team-photos`: publico, usado para fotos de equipos.

Politicas:

- Lectura publica de objetos del bucket.
- Upload/update solo para admins activos.

## Triggers y funciones

- `set_updated_at()`: mantiene `updated_at` en tablas editables.
- `is_admin()`: valida perfil admin activo.
- `is_viewer()`: valida perfil veedor activo.
- `match_teams_belong_to_tournament()`: impide crear partidos con equipos que no esten registrados en la categoria, permitiendo cruces futuros de copa con equipos pendientes.

## Migraciones aplicadas

- `20260627000000_football_tournaments.sql`: base inicial de torneos, equipos, partidos, RLS y politicas publicas/admin.
- `20260629000000_add_football_tournament_format.sql`: formato de torneo.
- `20260629010000_add_football_viewers.sql`: veedores y carga de resultados.
- `20260629020000_add_football_team_photos.sql`: fotos de equipos y bucket de storage.
- `20260630000000_add_global_football_teams.sql`: equipos reutilizables y tabla puente de inscripciones.
- `20260630010000_add_admin_profile_status.sql`: estado activo/suspendido de usuarios internos.
- `20260701000000_add_football_audit_events.sql`: auditoria por torneo y usuario.
- `20260701020000_update_football_matches_for_brackets.sql`: soporte para llaves copa/playoff con partidos futuros y progresion por `next_match_id`.
- `20260701030000_allow_staff_profile_self_read.sql`: lectura del perfil propio para login de admins y veedores.
- `20260701040000_add_football_tournament_groups.sql`: zonas y equipos por zona para torneos zonas + playoff.
- `20260702000000_add_football_players_rosters.sql`: jugadores reutilizables y planteles por torneo/equipo con estado documental.
- `20260702010000_add_football_tournament_categories.sql`: categorias competitivas por torneo y migracion de equipos, zonas, planteles y partidos a `category_id`.
- `20260702020000_prevent_team_multiple_tournament_categories.sql`: evita que un equipo quede anotado en mas de una categoria del mismo torneo.

## Como mantener esto

Cuando agregues una migracion nueva:

1. Deja la migracion en `supabase/migrations`.
2. Actualiza `schema.sql` para reflejar el estado final.
3. Actualiza este README si cambia el modelo, las relaciones o las politicas.
