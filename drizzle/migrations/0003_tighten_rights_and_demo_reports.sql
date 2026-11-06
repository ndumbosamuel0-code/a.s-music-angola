create or replace function public.enforce_track_rules()
returns trigger language plpgsql security definer set search_path = public as $$
declare lic record;
begin
  if not public.has_role(auth.uid(),'admin') then
    if tg_op = 'UPDATE' then raise exception 'Apenas o administrador pode alterar faixas'; end if;
    new.status := 'pending'; new.featured := false; new.download_allowed := false;
    new.license_id := null; new.is_demo := false; new.admin_notes := null;
    new.submitted_by := auth.uid();
    return new;
  end if;
  if new.status = 'approved' and not new.is_demo then
    select * into lic from public.licenses where id = new.license_id;
    if not new.rights_confirmed or not new.consent_streaming or new.rights_holders is null or btrim(new.rights_holders) = ''
       or lic.id is null or lic.verification_status <> 'verified' or not lic.allows_streaming
       or (lic.starts_at is not null and lic.starts_at > current_date)
       or (lic.ends_at is not null and lic.ends_at < current_date) then
      raise exception 'Publicação bloqueada: direitos, consentimento ou licença de streaming não confirmados';
    end if;
  end if;
  if new.download_allowed then
    select * into lic from public.licenses where id = new.license_id;
    if new.status <> 'approved' or new.is_demo or not new.rights_confirmed or not new.consent_download
       or lic.id is null or lic.verification_status <> 'verified' or not lic.allows_download
       or (lic.starts_at is not null and lic.starts_at > current_date)
       or (lic.ends_at is not null and lic.ends_at < current_date) then
      raise exception 'Download bloqueado: publicação, direitos ou licença de download não confirmados';
    end if;
  end if;
  return new;
end; $$;

create or replace function public.can_stream(_path text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.tracks t
    join public.licenses l on l.id = t.license_id
    where t.audio_path = _path
      and t.status = 'approved'
      and not t.is_demo
      and t.rights_confirmed
      and t.consent_streaming
      and l.verification_status = 'verified'
      and l.allows_streaming
      and (l.starts_at is null or l.starts_at <= current_date)
      and (l.ends_at is null or l.ends_at >= current_date)
  )
$$;

create or replace function public.can_read_cover(_path text)
returns boolean language sql stable security definer set search_path = public as $$
  select _path like 'brand/%' or _path like 'artists/%' or exists (
    select 1 from public.tracks t
    where t.cover_url = _path and t.status = 'approved'
  )
$$;

drop policy if exists "covers read all" on storage.objects;
create policy "covers read published" on storage.objects for select to anon, authenticated
using (bucket_id = 'covers' and public.can_read_cover(name));
create policy "covers own read" on storage.objects for select to authenticated
using (bucket_id = 'covers' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "settings public" on public.settings;
create policy "settings public" on public.settings for select to anon, authenticated using (id = 1);

create or replace function public.enforce_demo_report()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  new.is_demo := true;
  new.payment_status := 'pendente';
  return new;
end; $$;
create trigger financial_reports_demo_rules before insert or update on public.financial_reports
for each row execute function public.enforce_demo_report();

comment on table public.financial_reports is 'Demonstrative simulations only: no real revenue, payouts, or distribution agreements.';