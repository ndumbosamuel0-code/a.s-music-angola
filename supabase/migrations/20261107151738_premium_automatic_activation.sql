-- Premium entitlement is granted by the database only after a trusted backend/provider
-- changes an order to paid. Client-side requests cannot mark orders as paid.
alter table public.billing_payment_orders
  drop constraint if exists billing_payment_orders_payment_method_check;
alter table public.billing_payment_orders
  add constraint billing_payment_orders_payment_method_check
  check (payment_method in ('multicaixa_express','reference','unitel_money','bank_transfer'));

-- Tighten conversation creation: an artist may only attach their own payment order.
drop policy if exists "Thread participants create conversations" on public.billing_support_threads;
create policy "Users create own billing conversations"
  on public.billing_support_threads for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and (
      payment_order_id is null
      or exists (
        select 1 from public.billing_payment_orders o
        where o.id = payment_order_id and o.user_id = (select auth.uid())
      )
    )
  );

create or replace function public.activate_premium_for_paid_order()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_start timestamptz;
begin
  if new.status = 'paid' and old.status is distinct from 'paid'
     and new.item_code = 'premium_monthly'
     and new.amount = 5000 and new.currency = 'AOA' then
    select greatest(now(), coalesce(max(s.ends_at), now()))
      into v_start
      from public.artist_premium_subscriptions s
     where s.user_id = new.user_id
       and s.status = 'active'
       and s.ends_at > now();

    insert into public.artist_premium_subscriptions
      (user_id, payment_order_id, status, starts_at, ends_at)
    values
      (new.user_id, new.id, 'active', v_start, v_start + interval '30 days')
    on conflict (payment_order_id) do nothing;

    update public.billing_support_threads
       set payment_status = 'paid', updated_at = now()
     where payment_order_id = new.id;
  end if;
  return new;
end;
$$;
revoke all on function public.activate_premium_for_paid_order() from public, anon, authenticated;

drop trigger if exists billing_activate_premium_after_payment on public.billing_payment_orders;
create trigger billing_activate_premium_after_payment
after update of status on public.billing_payment_orders
for each row execute function public.activate_premium_for_paid_order();

-- Manual bank transfers require principal-admin confirmation; customer uploads never
-- mark a payment paid. The trigger above performs entitlement activation.
create or replace function public.confirm_manual_premium_payment(p_payment_order_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or not exists (
    select 1 from public.platform_control pc
    where pc.id = true and pc.principal_admin_id = auth.uid()
  ) then
    raise exception 'Apenas o administrador principal pode confirmar pagamentos manuais.';
  end if;

  update public.billing_payment_orders
     set status = 'paid', paid_at = now(), updated_at = now()
   where id = p_payment_order_id
     and status = 'pending'
     and payment_method = 'bank_transfer'
     and item_code = 'premium_monthly'
     and amount = 5000
     and currency = 'AOA';

  if not found then
    raise exception 'Pedido não encontrado, já processado ou não elegível para confirmação manual.';
  end if;
end;
$$;
revoke all on function public.confirm_manual_premium_payment(uuid) from public, anon;
grant execute on function public.confirm_manual_premium_payment(uuid) to authenticated;

comment on function public.activate_premium_for_paid_order() is
 'Activação automática de 30 dias quando backend de confiança marca um pedido Premium de 5.000 AOA como pago.';
comment on function public.confirm_manual_premium_payment(uuid) is
 'Confirmação manual exclusiva do administrador principal para transferência bancária; dispara activação automática.';
