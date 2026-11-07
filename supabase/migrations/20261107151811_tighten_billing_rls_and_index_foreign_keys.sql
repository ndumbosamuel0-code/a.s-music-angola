-- Tighten Premium billing access, reduce overlapping RLS policies and cover foreign keys.
-- Applied to production as migration 20261107151811_tighten_billing_rls_and_index_foreign_keys.

drop policy if exists "Users read own billing orders" on public.billing_payment_orders;
drop policy if exists "Principal admin reads premium payment orders" on public.billing_payment_orders;
create policy "Users and principal admin read billing orders"
on public.billing_payment_orders for select to authenticated
using (
  user_id = (select auth.uid())
  or exists (
    select 1 from public.platform_control pc
    where pc.id = true and pc.principal_admin_id = (select auth.uid())
  )
);

drop policy if exists "Users read own premium subscription" on public.artist_premium_subscriptions;
drop policy if exists "Principal admin reads premium subscriptions" on public.artist_premium_subscriptions;
create policy "Users and principal admin read premium subscriptions"
on public.artist_premium_subscriptions for select to authenticated
using (
  user_id = (select auth.uid())
  or exists (
    select 1 from public.platform_control pc
    where pc.id = true and pc.principal_admin_id = (select auth.uid())
  )
);

drop policy if exists "Users view enabled payment methods" on public.platform_payment_methods;
drop policy if exists "Principal admin manages payment methods" on public.platform_payment_methods;
create policy "Read enabled methods or principal admin"
on public.platform_payment_methods for select to authenticated
using (
  is_enabled = true
  or exists (
    select 1 from public.platform_control pc
    where pc.id = true and pc.principal_admin_id = (select auth.uid())
  )
);
create policy "Principal admin inserts payment methods"
on public.platform_payment_methods for insert to authenticated
with check (
  exists (
    select 1 from public.platform_control pc
    where pc.id = true and pc.principal_admin_id = (select auth.uid())
  )
);
create policy "Principal admin updates payment methods"
on public.platform_payment_methods for update to authenticated
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
create policy "Principal admin deletes payment methods"
on public.platform_payment_methods for delete to authenticated
using (
  exists (
    select 1 from public.platform_control pc
    where pc.id = true and pc.principal_admin_id = (select auth.uid())
  )
);

drop policy if exists "No client access to billing webhook events" on public.billing_webhook_events;
create policy "No client access to billing webhook events"
on public.billing_webhook_events for all to anon, authenticated
using (false) with check (false);

revoke execute on function public.release_premium_access(uuid) from authenticated, anon, public;
grant execute on function public.release_premium_access(uuid) to service_role;

create index if not exists billing_payment_orders_catalog_item_id_idx
  on public.billing_payment_orders(catalog_item_id);
create index if not exists billing_support_messages_sender_id_idx
  on public.billing_support_messages(sender_id);
create index if not exists billing_support_threads_payment_order_id_idx
  on public.billing_support_threads(payment_order_id);
create index if not exists platform_payment_methods_updated_by_idx
  on public.platform_payment_methods(updated_by);
