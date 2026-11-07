-- Profiles are readable only by authenticated users under RLS.
-- Prevent public/anonymous access and prevent users from changing role or identity columns.
revoke all on table public.profiles from anon, authenticated;
grant select on table public.profiles to authenticated;
grant insert (id, email, full_name, display_name, role)
  on table public.profiles to authenticated;
grant update (full_name, display_name, avatar_url, artist_name, province, phone, bio)
  on table public.profiles to authenticated;
