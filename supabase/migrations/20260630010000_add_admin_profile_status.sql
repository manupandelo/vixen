alter table public.admin_profiles
  add column if not exists status text not null default 'active',
  add column if not exists suspended_at timestamptz,
  add column if not exists suspended_reason text,
  add column if not exists updated_at timestamptz not null default now();

alter table public.admin_profiles
  drop constraint if exists admin_profiles_status_check;

alter table public.admin_profiles
  add constraint admin_profiles_status_check
  check (status in ('active', 'suspended'));

drop trigger if exists admin_profiles_set_updated_at on public.admin_profiles;

create trigger admin_profiles_set_updated_at
before update on public.admin_profiles
for each row execute function public.set_updated_at();

create or replace function public.is_admin()
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
      and role = 'admin'
      and status = 'active'
  );
$$;

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
      and status = 'active'
  );
$$;

drop policy if exists "Viewers can read assigned matches"
on public.football_matches;

create policy "Viewers can read assigned matches"
on public.football_matches for select
using (
  public.is_viewer()
  and assigned_viewer_id = auth.uid()
);

drop policy if exists "Viewers can submit assigned unlocked results"
on public.football_matches;

create policy "Viewers can submit assigned unlocked results"
on public.football_matches for update
using (
  public.is_viewer()
  and assigned_viewer_id = auth.uid()
  and result_locked_at is null
)
with check (
  public.is_viewer()
  and assigned_viewer_id = auth.uid()
  and result_locked_at is not null
  and result_submitted_by = auth.uid()
  and status = 'completed'
  and home_score is not null
  and away_score is not null
);
