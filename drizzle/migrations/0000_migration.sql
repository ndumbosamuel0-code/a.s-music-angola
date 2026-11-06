
create type public.app_role as enum ('admin','artist','user');
create type public.track_status as enum ('pending','approved','rejected','removed');
create type public.verification_status as enum ('pending','verified','rejected');
create type public.payment_status as enum ('pendente','pago');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  artist_name text,
  bio text,
  phone text,
  province text,
  created_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create policy "own profile read" on public.profiles for select to authenticated using (id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "own profile update" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy "own profile insert" on public.profiles for insert to authenticated with check (id = auth.uid());
create policy "own roles read" on public.user_roles for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "admin roles manage" on public.user_roles for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name) values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email,'@',1)));
  insert into public.user_roles (user_id, role) values (new.id, 'user');
  return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create table public.genres (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  sort int not null default 0
);
grant select on public.genres to anon, authenticated;
grant insert, update, delete on public.genres to authenticated;
grant all on public.genres to service_role;
alter table public.genres enable row level security;
create policy "genres public" on public.genres for select to anon, authenticated using (true);
create policy "genres admin" on public.genres for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create table public.artists (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  bio text,
  province text,
  image_url text,
  featured boolean not null default false,
  is_demo boolean not null default false,
  owner_id uuid,
  created_at timestamptz not null default now()
);
grant select on public.artists to anon, authenticated;
grant insert, update, delete on public.artists to authenticated;
grant all on public.artists to service_role;
alter table public.artists enable row level security;
create policy "artists public" on public.artists for select to anon, authenticated using (true);
create policy "artists admin" on public.artists for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create table public.licenses (
  id uuid primary key default gen_random_uuid(),
  holder text not null,
  territory text not null default 'Angola',
  allows_streaming boolean not null default false,
  allows_download boolean not null default false,
  starts_at date,
  ends_at date,
  evidence_path text,
  verification_status verification_status not null default 'pending',
  notes text,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.licenses to authenticated;
grant all on public.licenses to service_role;
alter table public.licenses enable row level security;
create policy "licenses admin" on public.licenses for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create table public.tracks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  artist_name text not null,
  artist_id uuid references public.artists(id) on delete set null,
  genre_id uuid references public.genres(id) on delete set null,
  description text,
  cover_url text,
  audio_path text,
  credits text,
  rights_holders text,
  rights_confirmed boolean not null default false,
  consent_streaming boolean not null default false,
  consent_download boolean not null default false,
  consent_promo boolean not null default false,
  status track_status not null default 'pending',
  featured boolean not null default false,
  download_allowed boolean not null default false,
  license_id uuid references public.licenses(id) on delete set null,
  is_demo boolean not null default false,
  submitted_by uuid,
  admin_notes text,
  release_date date default current_date,
  created_at timestamptz not null default now()
);
grant select on public.tracks to anon;
grant select, insert, update, delete on public.tracks to authenticated;
grant all on public.tracks to service_role;
alter table public.tracks enable row level security;
create policy "tracks public approved" on public.tracks for select to anon, authenticated using (status = 'approved');
create policy "tracks own read" on public.tracks for select to authenticated using (submitted_by = auth.uid());
create policy "tracks submit" on public.tracks for insert to authenticated with check (submitted_by = auth.uid() and rights_confirmed = true);
create policy "tracks admin" on public.tracks for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

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
    if lic.id is null or lic.verification_status <> 'verified' or not lic.allows_streaming
       or (lic.ends_at is not null and lic.ends_at < current_date) then
      raise exception 'Publicação bloqueada: autorização/licença de streaming não confirmada';
    end if;
  end if;
  if new.download_allowed then
    select * into lic from public.licenses where id = new.license_id;
    if new.is_demo or lic.id is null or lic.verification_status <> 'verified' or not lic.allows_download or not new.consent_download then
      raise exception 'Download bloqueado: licença de download não confirmada';
    end if;
  end if;
  return new;
end; $$;
create trigger tracks_rules before insert or update on public.tracks for each row execute function public.enforce_track_rules();

create table public.settings (
  id int primary key default 1 check (id = 1),
  distributor_commission numeric not null default 0,
  platform_share numeric not null default 10,
  logo_url text,
  distribution_status text not null default 'Acordos e integrações em negociação / por confirmar',
  updated_at timestamptz not null default now()
);
grant select on public.settings to anon, authenticated;
grant update on public.settings to authenticated;
grant all on public.settings to service_role;
alter table public.settings enable row level security;
create policy "settings public" on public.settings for select to anon, authenticated using (true);
create policy "settings admin" on public.settings for update to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create table public.financial_reports (
  id uuid primary key default gen_random_uuid(),
  artist_id uuid references public.artists(id) on delete cascade,
  track_id uuid references public.tracks(id) on delete set null,
  period text not null,
  gross numeric not null default 0,
  distributor_commission_pct numeric not null default 0,
  payment_status payment_status not null default 'pendente',
  is_demo boolean not null default true,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.financial_reports to authenticated;
grant all on public.financial_reports to service_role;
alter table public.financial_reports enable row level security;
create policy "reports own" on public.financial_reports for select to authenticated using (exists (select 1 from public.artists a where a.id = artist_id and a.owner_id = auth.uid()));
create policy "reports admin" on public.financial_reports for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create or replace function public.can_stream(_path text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.tracks t join public.licenses l on l.id = t.license_id
    where t.audio_path = _path and t.status = 'approved' and l.verification_status = 'verified' and l.allows_streaming)
$$;

insert into public.settings (id) values (1);
insert into public.genres (name, slug, sort) values
 ('Kizomba','kizomba',1),('Kuduro','kuduro',2),('Semba','semba',3),('Afro House','afro-house',4),
 ('Rap','rap',5),('Gospel','gospel',6),('Zouk','zouk',7),('Outros','outros',8);

insert into public.artists (name, slug, bio, province, featured, is_demo) values
 ('Artista Demo Kiala','demo-kiala','Perfil fictício de demonstração. Não representa um artista real.','Luanda',true,true),
 ('Banda Demo Mukongo','demo-mukongo','Perfil fictício de demonstração. Não representa um artista real.','Uíge',true,true),
 ('MC Demo Benguela','demo-benguela','Perfil fictício de demonstração. Não representa um artista real.','Benguela',true,true),
 ('Coro Demo Esperança','demo-esperanca','Perfil fictício de demonstração. Não representa um artista real.','Huambo',false,true),
 ('DJ Demo Ondas','demo-ondas','Perfil fictício de demonstração. Não representa um artista real.','Luanda',true,true);

insert into public.tracks (title, artist_name, artist_id, genre_id, description, status, featured, is_demo, release_date)
select v.title, a.name, a.id, g.id, 'Faixa de demonstração — sem ficheiro de áudio.', 'approved', v.featured, true, current_date - v.days
from (values
 ('Noite de Luanda (Demo)','demo-kiala','kizomba',true,2),
 ('Passo Quente (Demo)','demo-ondas','kuduro',true,5),
 ('Raízes do Norte (Demo)','demo-mukongo','semba',true,9),
 ('Maré Alta (Demo)','demo-ondas','afro-house',false,1),
 ('Palavra da Rua (Demo)','demo-benguela','rap',true,4),
 ('Luz no Caminho (Demo)','demo-esperanca','gospel',false,12),
 ('Coração Calmo (Demo)','demo-kiala','zouk',false,7),
 ('Batida da Banda (Demo)','demo-mukongo','outros',false,15)
) as v(title, aslug, gslug, featured, days)
join public.artists a on a.slug = v.aslug join public.genres g on g.slug = v.gslug;

insert into public.financial_reports (artist_id, period, gross, distributor_commission_pct, payment_status, is_demo)
select id, '2026-09', 100000, 15, 'pendente', true from public.artists where slug in ('demo-kiala','demo-ondas');
