create policy "Active staff can read own profile"
on public.admin_profiles for select
using (
  id = auth.uid()
  and role in ('admin', 'viewer')
  and status = 'active'
);
