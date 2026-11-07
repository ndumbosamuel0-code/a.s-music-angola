-- A.S MUSIC ANGOLA: cobrança antecipada de Premium e serviços individuais.
-- Preparação segura: nenhum gateway é chamado e nenhum preço é presumido.
-- Activação comercial depende de preços aprovados e credenciais AppyPay em secrets.

create table if not exists public.billing_catalog (
  id uuid primary key default gen_random_uuid(),
  item_type text not null check (item_type in ('premium_monthly', 'artist_service')),
  item_code text not null unique check (item_code ~ '^[a-z0-9_]{2,60}$'),
  title text not null check (length(trim(title)) between 2 and 120),
  description text,
  amount numeric(12,2) check (amount is null or amount > 0),
  currency text not null default 'AOA' check (currency = 'AOA'),
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint billing_catalog_monthly_type check (
    item_type <> 'premium_monthly' or item_code = 'premium_monthly'
  )
);

insert into public.billing_catalog (item_type, item_code, title, description, amount, currency, is_active)
values
  ('premium_monthly', 'premium_monthly', 'Premium mensal', 'Acesso Premium por 30 dias após confirmação do pagamento.', null, 'AOA', false),
  ('artist_service', 'artist_profile_setup', 'Configuração de perfil artístico', 'Serviço individual; preço a definir pela administração.', null, 'AOA', false),
  ('artist_service', 'release_priority_review', 'Análise prioritária de lançamento', 'Serviço individual; preço a definir pela administração.', null, 'AOA', false)
on conflict (item_code) do nothing;

create table if not exists public.billing_payment_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete restrict,
  catalog_item_id uuid not null references public.billing_catalog(id) on delete restrict,
  item_type text not null check (item_type in ('premium_monthly', 'artist_service')),
  item_code text not null,
  amount numeric(12,2) not null check (amount > 0),
  currency text not null default 'AOA' check (currency = 'AOA'),
  status text not null default 'pending' check (status in ('pending', 'paid', 'failed', 'expired', 'refunded')),
  payment_method text check (payment_method in ('multicaixa_express', 'reference', 'unitel_money')),
  provider text not null default 'appy_pay',
  provider_order_id text,
  provider_reference text,
  checkout_url text,
  expires_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object')
);

create index if not exists billing_payment_orders_user_created_idx
  on public.billing_payment_orders (user_id, created_at desc);
create index if not exists billing_payment_orders_status_idx
  on public.billing_payment_orders (status, created_at desc);
create unique index if not exists billing_payment_orders_provider_order_uidx
  on public.billing_payment_orders (provider, provider_order_id)
  where provider_order_id is not null;
create unique index if not exists billing_payment_orders_provider_reference_uidx
  on public.billing_payment_orders (provider, provider_reference)
  where provider_reference is not null;

create table if not exists public.artist_premium_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete restrict,
  payment_order_id uuid not null unique references public.billing_payment_orders(id) on delete restrict,
  status text not null default 'active' check (status in ('active', 'expired', 'cancelled')),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  created_at timestamptz not null default now(),
  constraint premium_subscription_period_valid check (ends_at > starts_at)
);
create index if not exists artist_premium_subscriptions_user_period_idx
  on public.artist_premium_subscriptions (user_id, status, ends_at desc);

create table if not exists public.billing_webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  provider_event_id text not null,
  event_type text not null,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  processing_status text not null default 'received' check (processing_status in ('received', 'processed', 'ignored', 'failed')),
  payload_digest text,
  constraint billing_webhook_provider_event_unique unique (provider, provider_event_id)
);

alter table public.billing_catalog enable row level security;
alter table public.billing_payment_orders enable row level security;
alter table public.artist_premium_subscriptions enable row level security;
alter table public.billing_webhook_events enable row level security;

drop policy if exists "Authenticated users read active billing catalog" on public.billing_catalog;
create policy "Authenticated users read active billing catalog"
  on public.billing_catalog for select to authenticated
  using (is_active = true and amount is not null);

drop policy if exists "Users read own billing orders" on public.billing_payment_orders;
create policy "Users read own billing orders"
  on public.billing_payment_orders for select to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "Users read own premium subscription" on public.artist_premium_subscriptions;
create policy "Users read own premium subscription"
  on public.artist_premium_subscriptions for select to authenticated
  using (user_id = (select auth.uid()));

-- Sem políticas de INSERT/UPDATE/DELETE para clientes. Só backend privilegiado pode criar
-- pedidos, confirmar webhooks, activar Premium ou registar pagamentos.
revoke all on public.billing_catalog, public.billing_payment_orders,
  public.artist_premium_subscriptions, public.billing_webhook_events from anon, authenticated;
grant select on public.billing_catalog, public.billing_payment_orders,
  public.artist_premium_subscriptions to authenticated;
grant all on public.billing_catalog, public.billing_payment_orders,
  public.artist_premium_subscriptions, public.billing_webhook_events to service_role;

comment on table public.billing_catalog is
  'Catálogo de Premium mensal e serviços individuais; preços começam nulos e itens inactivos até decisão comercial.';
comment on table public.billing_payment_orders is
  'Pedidos de pagamento antecipado. A confirmação só pode vir do webhook/backend verificado do fornecedor.';
comment on table public.artist_premium_subscriptions is
  'Períodos Premium activados apenas após pagamento confirmado; sem trial e sem renovação automática.';
comment on table public.billing_webhook_events is
  'Inbox idempotente para eventos de webhook do gateway; payload completo não é guardado.';
