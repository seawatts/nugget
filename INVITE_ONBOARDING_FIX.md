# Invite Onboarding Fix

## Problem

Users who scan a QR code or use an invitation link to join a family get stuck in an infinite onboarding loop. While the database shows they have completed onboarding (`onboardingCompletedAt` is set), they keep getting redirected back to `/app/onboarding`.

## Root Cause

When a user accepts an invitation via QR code:

1. ✅ Backend creates `FamilyMember` record with `onboardingCompletedAt` set
2. ✅ Backend adds user to Clerk organization
3. ❌ **Frontend never calls `setActive()` to update the user's Clerk session with the active organization**
4. ❌ User gets redirected to `/app`
5. ❌ `checkOnboarding()` runs: `const { userId, orgId } = await auth()` returns `orgId: null`
6. ❌ Returns `completed: false` because no active org in session
7. ❌ User gets redirected back to `/app/onboarding`
8. 🔄 Infinite loop!

### Example: Amanda's Case

- Database shows: `onboardingCompletedAt: 2025-11-16T23:30:21.247Z` ✅
- Family: "Riley's Family" (`org_35a6Q3o2EZWn7bfulHfAkfZwt1g`) ✅
- Issue: Her Clerk session never had the active `orgId` set ❌

## The Fix

### 1. Frontend: Add `setActive()` Call

**File**: `apps/web-app/src/app/(app)/app/invite/accept/[code]/_components/accept-invitation-button.tsx`

**Before**:
```typescript
const acceptMutation = api.invitations.accept.useMutation({
  onSuccess: (data) => {
    toast.success(`Welcome to ${data.familyName}!`);
    router.push('/app'); // ❌ Missing setActive!
  },
});
```

**After**:
```typescript
const { setActive } = useOrganizationList();

const acceptMutation = api.invitations.accept.useMutation({
  onSuccess: async (data) => {
    toast.success(`Welcome to ${data.familyName}!`);

    // ✅ CRITICAL: Set the active organization in Clerk
    if (setActive) {
      try {
        await setActive({ organization: data.clerkOrgId });
        console.log('Successfully set active organization:', data.clerkOrgId);
        // Give Clerk time to update the session
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        console.error('Failed to set active organization:', error);
        toast.error('Failed to switch to family. Please try refreshing the page.');
        return;
      }
    }

    router.push('/app');
  },
});
```

### 2. Backend: Improve Clerk Membership Handling

**File**: `packages/api/src/router/invitations.ts`

**Improvements**:
1. ✅ Return `clerkOrgId` in mutation response so frontend can use it
2. ✅ Check if user is already a Clerk member before creating
3. ✅ Add detailed logging for debugging
4. ✅ Handle errors gracefully without blocking the flow

**Changes**:
```typescript
// Add user to Clerk organization
try {
  const client = await clerkClient();

  // Check if user is already a member in Clerk
  const existingClerkMembership = await client.organizations
    .getOrganizationMembershipList({
      organizationId: invitation.family.clerkOrgId,
    })
    .then((list) =>
      list.data.find((membership) => membership.publicUserData.userId === userId)
    );

  if (!existingClerkMembership) {
    console.log(`Adding user ${userId} to Clerk organization ${invitation.family.clerkOrgId}`);
    await client.organizations.createOrganizationMembership({
      organizationId: invitation.family.clerkOrgId,
      role: invitation.role === 'primary' ? 'admin' : 'basic_member',
      userId,
    });
    console.log(`Successfully added user ${userId} to Clerk organization`);
  } else {
    console.log(`User ${userId} is already a member of Clerk organization`);
  }
} catch (error) {
  console.error('Failed to add user to Clerk organization:', error);
  // Don't throw - database record is created, Clerk can be synced later
}

return {
  clerkOrgId: invitation.family.clerkOrgId, // ✅ Added this
  familyId: invitation.familyId,
  familyMember,
  familyName: invitation.family.name,
};
```

## How It Works Now

1. ✅ User scans QR code → lands on `/app/invite/accept/[code]`
2. ✅ Clicks "Accept Invitation"
3. ✅ Backend creates `FamilyMember` record
4. ✅ Backend adds user to Clerk organization (with duplicate check)
5. ✅ **Frontend calls `setActive()` to update Clerk session**
6. ✅ Waits 1 second for Clerk to sync
7. ✅ Redirects to `/app`
8. ✅ `checkOnboarding()` finds `orgId` in session
9. ✅ Returns `completed: true`
10. ✅ User sees the app! 🎉

## Similar Patterns in Codebase

The onboarding wizard already does this correctly:

```typescript:apps/web-app/src/app/(app)/app/onboarding/_components/onboarding-wizard.tsx
// FIRST: Switch to the selected family in Clerk
if (setActive) {
  await setActive({ organization: selectedFamilyId });
  await new Promise((resolve) => setTimeout(resolve, 1000));
}

// THEN: Mark onboarding as complete
await completeOnboardingForExistingFamilyAction({ clerkOrgId: selectedFamilyId });
```

## For Amanda Specifically

Since her database is correct but her session is wrong:

1. Have her sign out completely (clears localStorage ✅)
2. Sign back in
3. If still stuck, have her go through the family selection in onboarding
4. Or run the diagnostic script with `--fix` to re-complete onboarding (though in her case it's already set)

## Testing

1. Create an invitation in the app
2. Scan the QR code or use the link in a different browser/incognito
3. Accept the invitation
4. Verify user is redirected to `/app` (not `/app/onboarding`)
5. Check console logs for "Successfully set active organization"
6. Verify user can access family data

## Diagnostic Tool

Use the diagnostic script to check any user's onboarding status:

```bash
# Check Amanda
bun diagnose:user user_35dWrl5XmorgIPg9vCn4EA778qL

# Check any user
bun diagnose:user user_XXXXX

# Apply fix if needed (marks onboarding as complete)
bun diagnose:user user_XXXXX --fix
```

## Related Issues

- `ONBOARDING_FIX_SUMMARY.md` - Previous fix for family selection logic
- The webhook `handleOrganizationMembershipCreated` doesn't set `onboardingCompletedAt`, but that's intentional for webhook-based flows

