-- Restrict platform control visibility and role administration to the principal admin.
drop policy if exists "Authenticated users can read platform control" on public.platform_control;
drop policy if exists "Principal admin reads platform control" on public.platform_control;
create policy "Principal admin reads platform control"
on public.platform_control
for select
to authenticated
using (principal_admin_id = (select auth.uid()));

drop policy if exists "Admins insert roles" on public.user_roles;
drop policy if exists "Admins update roles" on public.user_roles;
drop policy if exists "Admins delete roles" on public.user_roles;

create policy "Principal admin inserts roles"
on public.user_roles
for insert
to authenticated
with check (
  exists (
    select 1 from public.platform_control pc
    where pc.id = true and pc.principal_admin_id = (select auth.uid())
  )
);

create policy "Principal admin updates roles"
on public.user_roles
for update
to authenticated
using (
  exists (
    select 1 from public.platform_control pc
    where pc.id = true and pc.principal_admin_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1 from public.platform_control pc
    where pc.id = true and pc.principal_admin_id = (select auth.uid())
  )
);

create policy "Principal admin deletes roles"
on public.user_roles
for delete
to authenticated
using (
  exists (
    select 1 from public.platform_control pc
    where pc.id = true and pc.principal_admin_id = (select auth.uid())
  )
);
