# CI typing follow-up

The Supabase `Database` types are now regenerated from the production schema after the billing and payout tables were added. The Premium, revenue, payout, and webhook code now uses typed Supabase queries and validated `unknown` payloads instead of explicit `any` casts.

The CI rule `@typescript-eslint/no-explicit-any` is enforced as an error again. Remaining CI warnings are limited to React Fast Refresh export guidance and do not represent type-safety suppressions.
