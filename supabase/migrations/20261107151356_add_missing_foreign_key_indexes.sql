create index if not exists artist_earnings_ledger_created_by_idx
  on public.artist_earnings_ledger (created_by);
create index if not exists artist_payout_requests_reviewed_by_idx
  on public.artist_payout_requests (reviewed_by);
create index if not exists platform_control_principal_admin_id_idx
  on public.platform_control (principal_admin_id);
