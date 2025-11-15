# Database Field Handling Guide

## Overview

This document explains how `familyId`, `userId`, and `babyId` fields are handled across the codebase when inserting or updating database records.

## Database Defaults vs Explicit Passing

Many tables in the schema have fields with database defaults using SQL functions:
- `userId` → `.default(requestingUserId())`
- `familyId` → `.default(requestingFamilyId())`

**Important**: These SQL functions (`requestingUserId()` and `requestingFamilyId()`) only work when using Supabase's authenticated client with JWT claims. When using Drizzle directly (which is our primary use case in tRPC routers and server actions), these defaults **will not work**.

## Best Practice

**Always explicitly pass `familyId`, `userId`, and `babyId` fields** in all database insert operations to ensure consistency and avoid potential runtime errors.

## Tables and Required Fields

### Tables with `familyId`, `userId`, and `babyId`

#### Activities
- **Required fields**: `babyId`, `familyId`, `userId`
- **Location**: `packages/api/src/router/activities.ts`
- **Status**: ✅ Fixed - All inserts now explicitly pass all required fields

#### SupplyTransactions
- **Required fields**: `babyId`, `familyId`, `userId`
- **Location**: `packages/api/src/router/supply-transactions.ts`
- **Status**: ✅ Fixed - All inserts now explicitly pass all required fields

#### SupplyInventory
- **Required fields**: `babyId`, `familyId`, `userId`
- **Locations**:
  - `packages/api/src/router/supply-inventory.ts`
  - `packages/api/src/router/babies.ts`
  - `packages/api/src/router/onboarding.ts`
  - `apps/web-app/src/app/(app)/app/onboarding/actions.ts`
- **Status**: ✅ Fixed - All inserts now explicitly pass all required fields

#### ContentCache
- **Required fields**: `babyId`, `familyId`, `userId`
- **Location**: `packages/content-rules/src/db-cache-adapter.ts`
- **Status**: ✅ Already correct - Explicitly passes all fields (documented in code comments)

#### Milestones
- **Required fields**: `babyId`, `familyId`, `userId`
- **Status**: ⚠️ No router/operations implemented yet

#### MedicalRecords
- **Required fields**: `babyId`, `familyId`, `userId`
- **Status**: ⚠️ No router/operations implemented yet

#### GrowthRecords
- **Required fields**: `babyId`, `familyId`, `userId`
- **Status**: ⚠️ No router/operations implemented yet

### Tables with `familyId` and `userId` (no `babyId`)

#### Babies
- **Required fields**: `familyId`, `userId`
- **Location**: `packages/api/src/router/babies.ts`
- **Status**: ✅ Already correct - Explicitly passes both fields

#### FamilyMembers
- **Required fields**: `familyId`, `userId`
- **Locations**:
  - `packages/api/src/router/invitations.ts`
  - `packages/api/src/services/create-org.ts`
  - `packages/api/src/services/upsert-org.ts`
  - Various webhook handlers
- **Status**: ✅ Already correct - All inserts explicitly pass both fields

#### Invitations
- **Required fields**: `familyId`, `invitedByUserId`
- **Location**: `packages/api/src/router/invitations.ts`
- **Status**: ✅ Already correct - Uses `familyId` from `ctx.auth.orgId` and explicit `invitedByUserId`

#### ShortUrls
- **Required fields**: `familyId`, `userId`
- **Status**: ⚠️ No router/operations found - May be unused or in planning

#### pushSubscriptions
- **Required fields**: `userId` (no `familyId` field in schema)
- **Location**: `apps/web-app/src/app/api/push/subscribe/route.ts`
- **Status**: ✅ Already correct - Explicitly passes `userId`

### Tables with only `createdByUserId`

#### Families
- **Required fields**: `createdByUserId`
- **Locations**:
  - `packages/api/src/services/create-org.ts`
  - `packages/api/src/services/upsert-org.ts`
  - Various webhook handlers
- **Status**: ✅ Already correct - Always passes `createdByUserId`

## Implementation Pattern

### For tRPC Routers

```typescript
// ✅ Correct - Explicitly pass all required fields
await ctx.db.insert(TableName).values({
  ...input,
  familyId: ctx.auth.orgId,
  userId: ctx.auth.userId,
  // babyId if applicable
});

// ❌ Incorrect - Relying on database defaults
await ctx.db.insert(TableName).values({
  ...input,
  // Missing familyId and userId
});
```

### For Server Actions in Transactions

```typescript
// ✅ Correct - Explicitly pass all required fields
await tx.insert(TableName).values({
  babyId: baby.id,
  familyId: family.id,
  userId: userId,
  // other fields
});
```

### Input Schema Pattern

When creating tRPC routers, omit `familyId` and `userId` from the input schema since they come from authentication:

```typescript
.input(
  insertTableSchema.omit({
    createdAt: true,
    familyId: true,  // ← Omit this
    id: true,
    updatedAt: true,
    userId: true,     // ← Omit this
  })
)
```

## Future Tables

When implementing routers for `Milestones`, `MedicalRecords`, or `GrowthRecords`:

1. **Follow the pattern** established in `activities.ts` or `supply-transactions.ts`
2. **Omit** `familyId` and `userId` from input schemas
3. **Explicitly pass** `familyId: ctx.auth.orgId` and `userId: ctx.auth.userId` in the insert values
4. **Verify** that the baby belongs to the family before creating records

## Testing

Test utilities in `packages/test-utils/src/index.ts` and `packages/integ-test/test-utils/factories.ts` are already correctly passing all required fields.

## Summary

- ✅ All current database operations have been audited and fixed
- ✅ `familyId` and `userId` are now explicitly passed in all inserts
- ✅ Database defaults should not be relied upon for Drizzle operations
- ⚠️ Future implementations must follow the established patterns

