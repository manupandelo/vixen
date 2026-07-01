alter table public.football_teams
  add column if not exists photo_url text;

insert into storage.buckets (id, name, public)
values ('team-photos', 'team-photos', true)
on conflict (id) do update set public = excluded.public;

create policy "Public can read team photos"
on storage.objects for select
using (bucket_id = 'team-photos');

create policy "Admins can upload team photos"
on storage.objects for insert
with check (
  bucket_id = 'team-photos'
  and public.is_admin()
);

create policy "Admins can update team photos"
on storage.objects for update
using (
  bucket_id = 'team-photos'
  and public.is_admin()
)
with check (
  bucket_id = 'team-photos'
  and public.is_admin()
);
