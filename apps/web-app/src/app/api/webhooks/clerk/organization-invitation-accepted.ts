import type {
  OrganizationMembershipJSON,
  WebhookEvent,
} from '@clerk/nextjs/server';
import { posthog } from '@nugget/analytics/posthog/server';
import { db } from '@nugget/db/client';
import { Families } from '@nugget/db/schema';
import { PLAN_TYPES, stripe } from '@nugget/stripe';
import { eq } from 'drizzle-orm';

export async function handleOrganizationInvitationAccepted(
  event: WebhookEvent,
) {
  // Narrow event.data to OrganizationMembershipJSON for 'organizationMembership.updated' events
  const membershipData = event.data as OrganizationMembershipJSON;

  posthog.capture({
    distinctId: membershipData.public_user_data.user_id,
    event: 'accept_organization_membership_invite',
    properties: {
      orgId: membershipData.organization.id,
      userId: membershipData.public_user_data.user_id,
    },
  });

  // Find the organization in our database
  const org = await db.query.Families.findFirst({
    where: eq(Families.clerkOrgId, membershipData.organization.id),
  });

  if (!org) {
    return new Response('Organization not found', { status: 200 });
  }

  // Check if the organization has an active subscription
  if (!org.stripeSubscriptionId || org.stripeSubscriptionStatus !== 'active') {
    return new Response('No active subscription', { status: 200 });
  }

  try {
    // Get the subscription from Stripe
    const subscription = await stripe.subscriptions.retrieve(
      org.stripeSubscriptionId,
      {
        expand: ['items.data.price'],
      },
    );

    // Check if this is a team plan (per-user billing)
    const isTeamPlan = subscription.metadata?.planType === PLAN_TYPES.TEAM;

    if (!isTeamPlan) {
      return new Response('Not a team plan', { status: 200 });
    }

    // Count current organization members
    const currentMemberCount = membershipData.organization.members_count || 0;

    // Update the subscription quantity to match the new member count
    // For team plans, the quantity represents the number of users
    const _updatedSubscription = await stripe.subscriptions.update(
      org.stripeSubscriptionId,
      {
        items: subscription.items.data.map((item) => ({
          id: item.id,
          quantity: currentMemberCount,
        })),
      },
    );

    // Track the subscription update
    posthog.capture({
      distinctId: membershipData.public_user_data.user_id,
      event: 'subscription_quantity_updated',
      properties: {
        clerkOrgId: membershipData.organization.id,
        newQuantity: currentMemberCount,
        orgId: org.id,
        planType: PLAN_TYPES.TEAM,
        subscriptionId: org.stripeSubscriptionId,
      },
    });

    return undefined;
  } catch (error) {
    console.error('Error updating subscription quantity:', error);

    // Track the error
    posthog.capture({
      distinctId: membershipData.public_user_data.user_id,
      event: 'subscription_quantity_update_failed',
      properties: {
        clerkOrgId: membershipData.organization.id,
        error: error instanceof Error ? error.message : 'Unknown error',
        orgId: org.id,
        subscriptionId: org.stripeSubscriptionId,
      },
    });

    // Return error response instead of undefined
    return new Response(
      `Error updating subscription: ${error instanceof Error ? error.message : 'Unknown error'}`,
      { status: 500 },
    );
  }
}
