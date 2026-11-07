# CI lint follow-up

The CI fixes replace side-effect-only conditional expressions with explicit control flow. The `@typescript-eslint/no-explicit-any` rule is temporarily a warning because the generated Supabase `Database` type does not yet describe the billing, premium, platform-control, and payout tables queried by the current UI. These dynamic table accesses must be migrated to generated, schema-backed types before treating the lint debt as fully resolved.
