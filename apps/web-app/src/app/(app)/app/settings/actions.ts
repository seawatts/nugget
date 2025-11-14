'use server';

import { clerkClient } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

/**
 * Delete user from Clerk
 * This should only be called after the user has been deleted from the database
 */
export async function deleteUserFromClerk(userId: string) {
  try {
    const client = await clerkClient();
    await client.users.deleteUser(userId);
    return { success: true };
  } catch (error) {
    console.error('Failed to delete user from Clerk:', error);
    throw new Error(
      error instanceof Error
        ? error.message
        : 'Failed to delete user from Clerk',
    );
  }
}

/**
 * Delete organization from Clerk
 * This should be called when deleting an organization
 */
export async function deleteOrgFromClerk(clerkOrgId: string) {
  try {
    const client = await clerkClient();
    await client.organizations.deleteOrganization(clerkOrgId);
    revalidatePath('/app');
    return { success: true };
  } catch (error) {
    console.error('Failed to delete organization from Clerk:', error);
    throw new Error(
      error instanceof Error
        ? error.message
        : 'Failed to delete organization from Clerk',
    );
  }
}

/**
 * Redirect to onboarding after deleting organization
 */
export async function redirectToOnboarding() {
  redirect('/app/onboarding');
}

/**
 * Redirect to home after deleting account
 */
export async function redirectToHome() {
  redirect('/');
}

/**
 * Redirect to main app after accepting invitation
 */
export async function redirectToApp() {
  redirect('/app');
}
