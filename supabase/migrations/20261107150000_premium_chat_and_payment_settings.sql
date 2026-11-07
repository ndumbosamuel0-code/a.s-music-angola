-- Premium fixed at 5,000 AOA + admin payment instructions + private support/payment chat.
-- Deliberately does not fabricate gateway verification: only a verified server-side provider
-- callback may mark an order paid. Manual receipt uploads remain pending until verified.

update public.billing_catalog
set amount = 5000, currency = 'AOA', updated_at = now()
where item_code = 'premium_monthly';

create table if not exists public.platform_payment_methods (
  id uuid primary key default gen_random_uuid(),
  method_code text not null unique check (method_code in ('multicaixa_express','bank_transfer','payment_reference','unitel_money')),
  display_name text not null,
  instructions jsonb not null default '{}'::jsonb check (jsonb_typeof(instructions) = 'object'),
  is_enabled boolean not null default false,
  updated_by uuid references auth.users(id),
  updated_at timestamptz not null default now()
);

insert into public.platform_payment_methods(method_code,display_name,instructions,is_enabled)
values
 ('multicaixa_express','Multicaixa Express','{}',false),
 ('bank_transfer','Transferência bancária','{}',false),
 ('payment_reference','Pagamento por referência','{}',false),
 ('unitel_money','UNITEL Money','{}',false)
on conflict(method_code) do nothing;

create table if not exists public.billing_support_threads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete restrict,
  payment_order_id uuid references public.billing_payment_orders(id) on delete set null,
  subject text not null default 'Pagamento Premium',
  payment_status text not null default 'pending' check (payment_status in ('pending','verifying','paid','failed','expired','needs_review')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists billing_support_threads_user_updated_idx
 on public.billing_support_threads(user_id,updated_at desc);

create table if not exists public.billing_support_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.billing_support_threads(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete restrict,
  body text check (body is null or length(body) <= 5000),
  attachment_path text,
  message_type text not null default 'message' check (message_type in ('message','payment_proof','system')),
  created_at timestamptz not null default now(),
  constraint billing_support_message_has_content check (
    nullif(trim(coalesce(body,'')),'') is not null or attachment_path is not null
  )
);
create index if not exists billing_support_messages_thread_created_idx
 on public.billing_support_messages(thread_id,created_at);

alter table public.platform_payment_methods enable row level security;
alter table public.billing_support_threads enable row level security;
alter table public.billing_support_messages enable row level security;

drop policy if exists "Users view enabled payment methods" on public.platform_payment_methods;
create policy "Users view enabled payment methods" on public.platform_payment_methods
 for select to authenticated using (is_enabled = true);

drop policy if exists "Thread participants read billing conversations" on public.billing_support_threads;
create policy "Thread participants read billing conversations" on public.billing_support_threads
 for select to authenticated using (
   user_id = (select auth.uid()) or exists (
     select 1 from public.platform_control pc
     where pc.id = true and pc.principal_admin_id = (select auth.uid())
   )
);

drop policy if exists "Thread participants create conversations" on public.billing_support_threads;
create policy "Thread participants create conversations" on public.billing_support_threads
 for insert to authenticated with check (user_id = (select auth.uid()));

drop policy if exists "Thread participants read messages" on public.billing_support_messages;
create policy "Thread participants read messages" on public.billing_support_messages
 for select to authenticated using (
   exists (select 1 from public.billing_support_threads t
     where t.id = thread_id and (
       t.user_id = (select auth.uid()) or exists (
         select 1 from public.platform_control pc
         where pc.id = true and pc.principal_admin_id = (select auth.uid())
       )
     ))
);

drop policy if exists "Participants send messages" on public.billing_support_messages;
create policy "Participants send messages" on public.billing_support_messages
 for insert to authenticated with check (
   sender_id = (select auth.uid()) and exists (
     select 1 from public.billing_support_threads t
     where t.id = thread_id and (
       t.user_id = (select auth.uid()) or exists (
         select 1 from public.platform_control pc
         where pc.id = true and pc.principal_admin_id = (select auth.uid())
       )
     )
   )
);

-- Only the principal administrator may edit the receiving instructions.
drop policy if exists "Principal admin manages payment methods" on public.platform_payment_methods;
create policy "Principal admin manages payment methods" on public.platform_payment_methods
 for all to authenticated
 using (exists (select 1 from public.platform_control pc where pc.id = true and pc.principal_admin_id = (select auth.uid())))
 with check (exists (select 1 from public.platform_control pc where pc.id = true and pc.principal_admin_id = (select auth.uid())));

-- Remove broad table privileges and regrant only the operations protected by RLS.
revoke all on public.platform_payment_methods, public.billing_support_threads, public.billing_support_messages from anon, authenticated;
grant select on public.platform_payment_methods to authenticated;
grant insert, select on public.billing_support_threads to authenticated;
grant insert, select on public.billing_support_messages to authenticated;
grant all on public.platform_payment_methods, public.billing_support_threads, public.billing_support_messages to service_role;

-- Private bucket for payment receipts. Object path must begin with the uploader's auth UID.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('billing-proofs','billing-proofs',false,5242880,array['image/jpeg','image/png','application/pdf'])
on conflict(id) do update set public=false, file_size_limit=5242880,
 allowed_mime_types=array['image/jpeg','image/png','application/pdf'];

drop policy if exists "Users upload own billing proofs" on storage.objects;
create policy "Users upload own billing proofs" on storage.objects
 for insert to authenticated with check (
  bucket_id='billing-proofs' and (storage.foldername(name))[1]=(select auth.uid())::text
);
drop policy if exists "Participants read billing proofs" on storage.objects;
create policy "Participants read billing proofs" on storage.objects
 for select to authenticated using (
  bucket_id='billing-proofs' and (
   (storage.foldername(name))[1]=(select auth.uid())::text or exists (
    select 1 from public.platform_control pc
    where pc.id=true and pc.principal_admin_id=(select auth.uid())
   )
  )
);

-- Explicit admin action after verified payment. A unique payment_order_id makes release idempotent.
create or replace function public.release_premium_access(p_payment_order_id uuid)
returns table(subscription_id uuid, starts_at timestamptz, ends_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_order public.billing_payment_orders%rowtype;
  v_subscription public.artist_premium_subscriptions%rowtype;
  v_now timestamptz := now();
begin
  if not exists (
    select 1 from public.platform_control pc
    where pc.id=true and pc.principal_admin_id=auth.uid()
  ) then
    raise exception 'Apenas o administrador principal pode libertar o Premium.';
  end if;

  select * into v_order from public.billing_payment_orders
   where id=p_payment_order_id for update;
  if not found or v_order.item_code <> 'premium_monthly' or v_order.status <> 'paid'
     or v_order.amount <> 5000 or v_order.currency <> 'AOA' then
    raise exception 'Pagamento Premium não confirmado ou inválido.';
  end if;

  select * into v_subscription from public.artist_premium_subscriptions
   where payment_order_id=p_payment_order_id;
  if found then
    return query select v_subscription.id,v_subscription.starts_at,v_subscription.ends_at;
    return;
  end if;

  insert into public.artist_premium_subscriptions(user_id,payment_order_id,status,starts_at,ends_at)
  values (v_order.user_id,v_order.id,'active',v_now,v_now + interval '30 days')
  returning * into v_subscription;

  return query select v_subscription.id,v_subscription.starts_at,v_subscription.ends_at;
end;
$$;
revoke all on function public.release_premium_access(uuid) from public, anon;
grant execute on function public.release_premium_access(uuid) to authenticated;

comment on table public.platform_payment_methods is
 'Dados/instruções de recebimento geridos pelo administrador principal; não guardar PINs nem passwords.';
comment on table public.billing_support_threads is
 'Chat individual entre cada artista e o administrador principal para pagamentos e comprovativos.';
comment on table public.billing_support_messages is
 'Mensagens e comprovativos no chat; anexos no bucket privado billing-proofs.';
