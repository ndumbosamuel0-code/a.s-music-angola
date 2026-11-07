-- Allow only the principal administrator to inspect Premium orders and active entitlements.
-- Artists retain access only to their own rows through the existing policies.
drop policy if exists "Principal admin reads premium payment orders" on public.billing_payment_orders;
create policy "Principal admin reads premium payment orders"
  on public.billing_payment_orders for select to authenticated
  using (
    exists (
      select 1 from public.platform_control pc
      where pc.id = true and pc.principal_admin_id = (select auth.uid())
    )
  );

drop policy if exists "Principal admin reads premium subscriptions" on public.artist_premium_subscriptions;
create policy "Principal admin reads premium subscriptions"
  on public.artist_premium_subscriptions for select to authenticated
  using (
    exists (
      select 1 from public.platform_control pc
      where pc.id = true and pc.principal_admin_id = (select auth.uid())
    )
  );

comment on policy "Principal admin reads premium payment orders" on public.billing_payment_orders is
  'Allows only the configured principal administrator to review Premium payment orders.';
comment on policy "Principal admin reads premium subscriptions" on public.artist_premium_subscriptions is
  'Allows only the configured principal administrator to verify active Premium entitlements and prioritize review.';
