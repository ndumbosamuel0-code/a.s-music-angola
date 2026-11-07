-- A.S MUSIC ANGOLA: ledger de receitas da plataforma.
-- Aplicar apenas depois de rever o backup, as políticas RLS e os requisitos do fornecedor.
-- Não cria receitas, não processa pagamentos e não guarda dados bancários.

create table if not exists public.platform_revenue_ledger (
  id uuid primary key default gen_random_uuid(),
  source text not null check (source in ('ads', 'premium', 'artist_services', 'streaming', 'distribution', 'other')),
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'paid', 'reversed')),
  amount numeric(18,2) not null check (amount > 0),
  currency text not null check (currency ~ '^[A-Z]{3}$'),
  provider text not null check (length(trim(provider)) between 2 and 80),
  external_event_id text not null check (length(trim(external_event_id)) between 1 and 200),
  event_occurred_at timestamptz not null default now(),
  confirmed_at timestamptz,
  paid_at timestamptz,
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default now(),
  constraint platform_revenue_confirmation_check
    check (status not in ('confirmed', 'paid') or confirmed_at is not null),
  constraint platform_revenue_paid_check
    check (status <> 'paid' or paid_at is not null),
  constraint platform_revenue_provider_event_unique unique (provider, external_event_id)
);

create index if not exists platform_revenue_ledger_occurred_idx
  on public.platform_revenue_ledger (event_occurred_at desc);
create index if not exists platform_revenue_ledger_source_status_idx
  on public.platform_revenue_ledger (source, status, currency);

alter table public.platform_revenue_ledger enable row level security;

-- Apenas o administrador principal pode ler. Não há políticas de escrita para utilizadores.
drop policy if exists "Principal admin reads platform revenue" on public.platform_revenue_ledger;
create policy "Principal admin reads platform revenue"
  on public.platform_revenue_ledger
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.platform_control pc
      where pc.id = true
        and pc.principal_admin_id = (select auth.uid())
    )
  );

revoke all on public.platform_revenue_ledger from anon, authenticated;
grant select on public.platform_revenue_ledger to authenticated;
grant all on public.platform_revenue_ledger to service_role;

create or replace view public.platform_revenue_summary
with (security_invoker = true)
as
select
  source,
  status,
  currency,
  sum(amount)::numeric(18,2) as total_amount,
  count(*)::bigint as event_count
from public.platform_revenue_ledger
group by source, status, currency;

revoke all on public.platform_revenue_summary from anon, authenticated;
grant select on public.platform_revenue_summary to authenticated;

comment on table public.platform_revenue_ledger is
  'Ledger de eventos reais de receita da A.S MUSIC; eventos devem ser registados apenas por backend/provedor autenticado. Nunca usar tempo de sessão ou cliques como receita.';
