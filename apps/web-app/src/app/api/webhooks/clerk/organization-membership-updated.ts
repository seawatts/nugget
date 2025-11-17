import type {
  OrganizationMembershipJSON,
  WebhookEvent,
} from '@clerk/nextjs/server';
import { posthog } from '@nugget/analytics/posthog/server';
import { db } from '@nugget/db/client';
import { Families, FamilyMembers, Users } from '@nugget/db/schema';
import { and, eq } from 'drizzle-orm';

export async function handleOrganizationMembershipUpdated(event: WebhookEvent) {
  // Narrow event.data to OrganizationMembershipJSON for 'organizationMembership.updated' events
  const membershipData = event.data as OrganizationMembershipJSON;

  // Find the user and org
  const [user, org] = await Promise.all([
    db.query.Users.findFirst({
      where: eq(Users.clerkId, membershipData.public_user_data.user_id),
    }),
    db.query.Families.findFirst({
      where: eq(Families.clerkOrgId, membershipData.organization.id),
    }),
  ]);

  if (!user || !org) {
    return new Response('', { status: 200 });
  }

  const [member] = await db
    .update(FamilyMembers)
    .set({
      role: membershipData.role === 'admin' ? 'primary' : 'partner',
    })
    .where(
      and(
        eq(FamilyMembers.userId, user.id),
        eq(FamilyMembers.familyId, org.id),
      ),
    )
    .returning();

  if (!member) {
    return new Response('Organization membership not found on update', {
      status: 400,
    });
  }

  posthog.capture({
    distinctId: member.id,
    event: 'update_organization_membership',
    properties: {
      orgId: org.id,
      role: member.role,
      userId: user.id,
    },
  });

  return undefined;
}
