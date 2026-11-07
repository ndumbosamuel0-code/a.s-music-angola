-- Fix signup failures: profiles.role is intentionally limited to user/admin.
-- Account-specific roles belong in public.user_roles.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  profile_name text;
  requested_role public.app_role;
begin
  profile_name := coalesce(new.raw_user_meta_data ->> 'full_name', '');

  requested_role := case
    when new.raw_user_meta_data ->> 'account_type' = 'artist'
      then 'artist'::public.app_role
    when new.raw_user_meta_data ->> 'account_type' = 'distributor'
      then 'distributor'::public.app_role
    else 'user'::public.app_role
  end;

  insert into public.profiles (id, email, full_name, display_name, role)
  values (new.id, new.email, profile_name, profile_name, 'user')
  on conflict (id) do update
    set email = excluded.email,
        full_name = excluded.full_name,
        display_name = excluded.display_name;

  insert into public.user_roles (user_id, role)
  values (new.id, requested_role)
  on conflict (user_id, role) do nothing;

  return new;
end;
$function$;
