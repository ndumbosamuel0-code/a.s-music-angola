-- Enable the fixed Premium catalogue entry; payment methods remain disabled until configured.
update public.billing_catalog
   set amount = 5000, currency = 'AOA', is_active = true, updated_at = now()
 where item_code = 'premium_monthly';

-- Manual confirmation is restricted to orders created as manual-review payments.
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
     set status='paid', paid_at=now(), updated_at=now()
   where id=p_payment_order_id and status='pending' and provider='manual'
     and item_code='premium_monthly' and amount=5000 and currency='AOA';
  if not found then
    raise exception 'Pedido não encontrado, já processado ou não elegível para confirmação manual.';
  end if;
end;
$$;
revoke all on function public.confirm_manual_premium_payment(uuid) from public, anon;
grant execute on function public.confirm_manual_premium_payment(uuid) to authenticated;
