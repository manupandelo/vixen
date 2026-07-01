alter table public.admin_profiles
  drop constraint if exists admin_profiles_role_check;

alter table public.admin_profiles
  add constraint admin_profiles_role_check
  check (role in ('admin', 'viewer'));

alter table public.football_matches
  add column if not exists assigned_viewer_id uuid
    references public.admin_profiles(id) on delete set null,
  add column if not exists result_locked_at timestamptz,
  add column if not exists result_submitted_by uuid
    references public.admin_profiles(id) on delete set null;

create or replace function public.is_viewer()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_profiles
    where id = auth.uid()
      and role = 'viewer'
  );
$$;

create policy "Viewers can read assigned matches"
on public.football_matches for select
using (assigned_viewer_id = auth.uid());

create policy "Viewers can submit assigned unlocked results"
on public.football_matches for update
using (
  assigned_viewer_id = auth.uid()
  and result_locked_at is null
)
with check (
  assigned_viewer_id = auth.uid()
  and result_locked_at is not null
  and result_submitted_by = auth.uid()
  and status = 'completed'
  and home_score is not null
  and away_score is not null
);
