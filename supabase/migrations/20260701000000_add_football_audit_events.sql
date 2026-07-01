create table if not exists public.football_audit_events (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid references public.football_tournaments(id) on delete set null,
  actor_profile_id uuid references public.admin_profiles(id) on delete set null,
  actor_email text not null,
  entity_type text not null,
  entity_id uuid not null,
  action text not null,
  summary text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint football_audit_events_entity_type_check
    check (
      entity_type in (
        'tournament',
        'team',
        'match',
        'viewer_assignment',
        'match_result'
      )
    ),
  constraint football_audit_events_action_check
    check (
      action in (
        'created',
        'updated',
        'deleted',
        'removed_from_tournament',
        'assigned',
        'submitted'
      )
    )
);

create index if not exists football_audit_events_tournament_created_idx
on public.football_audit_events (tournament_id, created_at desc);

create index if not exists football_audit_events_actor_created_idx
on public.football_audit_events (actor_profile_id, created_at desc);

alter table public.football_audit_events enable row level security;

create policy "Admins can read football audit events"
on public.football_audit_events for select
using (public.is_admin());

create policy "Active staff can create football audit events"
on public.football_audit_events for insert
with check (
  (public.is_admin() or public.is_viewer())
  and actor_profile_id = auth.uid()
);
