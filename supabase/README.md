# Supabase database

Este directorio tiene dos tipos de archivos:

- `migrations/`: historial ejecutable. No conviene reescribirlo si ya fue aplicado en Supabase.
- `schema.sql`: foto consolidada del esquema actual, pensada para leer rapido como esta armada la base.

## Modelo principal

La base esta armada alrededor de torneos de futbol:

- `football_tournaments`: datos base del torneo, estado publico y formato.
- `football_teams`: equipos reutilizables. El `tournament_id` queda como columna legacy nullable; la relacion vigente con torneos es por tabla puente.
- `football_tournament_teams`: inscripcion de equipos en torneos.
- `football_team_admin_details`: datos privados del equipo, como capitan, telefono y notas internas.
- `football_matches`: fixture, veedor asignado, resultado y bloqueo de resultado cargado por veedor.
- `football_audit_events`: historial de cambios relevantes por usuario.
- `admin_profiles`: perfil interno de usuarios del panel, conectado a `auth.users`.

## Relaciones

- Un torneo tiene muchos partidos por `football_matches.tournament_id`.
- Un torneo tiene muchos equipos por `football_tournament_teams.tournament_id`.
- Un equipo puede participar en muchos torneos por `football_tournament_teams.team_id`.
- Un equipo tiene un unico bloque privado en `football_team_admin_details`.
- Un partido referencia equipo local y visitante con `home_team_id` y `away_team_id`.
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

- Publico anonimo puede leer torneos, equipos, inscripciones y partidos solo si el torneo esta `published`, `active` o `completed`.
- Admins activos pueden gestionar torneos, equipos, inscripciones, datos privados y partidos.
- Veedores activos solo pueden leer sus partidos asignados y cargar una vez el resultado de partidos desbloqueados.
- Datos privados de equipos viven en `football_team_admin_details` y no se exponen en la pagina publica.
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
- `match_teams_belong_to_tournament()`: impide crear partidos con equipos que no esten registrados en el torneo.

## Migraciones aplicadas

- `20260627000000_football_tournaments.sql`: base inicial de torneos, equipos, partidos, RLS y politicas publicas/admin.
- `20260629000000_add_football_tournament_format.sql`: formato de torneo.
- `20260629010000_add_football_viewers.sql`: veedores y carga de resultados.
- `20260629020000_add_football_team_photos.sql`: fotos de equipos y bucket de storage.
- `20260630000000_add_global_football_teams.sql`: equipos reutilizables y tabla puente de inscripciones.
- `20260630010000_add_admin_profile_status.sql`: estado activo/suspendido de usuarios internos.
- `20260701000000_add_football_audit_events.sql`: auditoria por torneo y usuario.

## Como mantener esto

Cuando agregues una migracion nueva:

1. Deja la migracion en `supabase/migrations`.
2. Actualiza `schema.sql` para reflejar el estado final.
3. Actualiza este README si cambia el modelo, las relaciones o las politicas.
