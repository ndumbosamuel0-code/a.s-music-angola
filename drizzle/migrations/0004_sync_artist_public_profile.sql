CREATE OR REPLACE FUNCTION public.sync_artist_public_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.artists
  SET
    name = COALESCE(NULLIF(BTRIM(NEW.artist_name), ''), public.artists.name),
    bio = NEW.bio,
    province = NEW.province
  WHERE owner_id = NEW.id;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.sync_artist_public_profile() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS profiles_sync_artist_public_profile ON public.profiles;
CREATE TRIGGER profiles_sync_artist_public_profile
AFTER UPDATE OF artist_name, bio, province ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.sync_artist_public_profile();

UPDATE public.artists AS a
SET
  name = COALESCE(NULLIF(BTRIM(p.artist_name), ''), a.name),
  bio = p.bio,
  province = p.province
FROM public.profiles AS p
WHERE a.owner_id = p.id;

COMMENT ON FUNCTION public.sync_artist_public_profile() IS 'Synchronizes only safe public profile fields from an owner account; administrative artist fields remain admin-only.';