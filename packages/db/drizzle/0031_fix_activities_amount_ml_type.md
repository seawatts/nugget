# Migration 0031: Fix activities.amountMl Type

## Problem

Migration `0025_romantic_iron_lad` renamed the column from `amount` to `amountMl` but forgot to change the type from `integer` to `real`.

```sql
-- What 0025 did:
ALTER TABLE "activities" RENAME COLUMN "amount" TO "amountMl";

-- What 0025 SHOULD have also done:
ALTER TABLE "activities" ALTER COLUMN "amountMl" SET DATA TYPE real;
```

This caused issues when inserting decimal values (like 1 oz = 29.5735 ml or breast milk at 22.5 ml).

## Solution

This migration applies the missing type change:

```sql
ALTER TABLE "activities" ALTER COLUMN "amountMl" SET DATA TYPE real;
```

## History

- This migration was manually created to fix the issue
- The timestamp was originally set incorrectly (Nov 2024) when it should be after 0030 (Jan 2025)
- Timestamp was corrected to `1763762880000` to ensure proper ordering
- Migration has been manually applied to both dev and prod databases on 2025-11-22

## Verification

To verify this migration on a fresh database:
```bash
cd packages/db
infisical run -- bun run migrate
```

Then check the column type:
```bash
infisical run -- bun run scripts/verify-amount-ml-fix.ts
```

Expected output: `Type: real` or `Type: double precision`

