import type {
  OrganizationMembershipJSON,
  WebhookEvent,
} from '@clerk/nextjs/server';
import { posthog } from '@nugget/analytics/posthog/server';
import { db } from '@nugget/db/client';
import { Families, FamilyMembers, Users } from '@nugget/db/schema';
import { eq } from 'drizzle-orm';

export async function handleOrganizationMembershipCreated(event: WebhookEvent) {
  // Narrow event.data to OrganizationMembershipJSON for 'organizationMembership.created' events
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
    .insert(FamilyMembers)
    .values({
      familyId: org.id,
      role: membershipData.role === 'admin' ? 'primary' : 'partner',
      userId: user.id,
    })
    .onConflictDoUpdate({
      set: {
        role: membershipData.role === 'admin' ? 'primary' : 'partner',
      },
      target: [FamilyMembers.userId, FamilyMembers.familyId],
    })
    .returning();

  if (!member) {
    return new Response('Failed to create organization membership', {
      status: 400,
    });
  }

  posthog.capture({
    distinctId: member.id,
    event: 'create_organization_membership',
    properties: {
      orgId: org.id,
      role: membershipData.role,
      userId: user.id,
    },
  });

  return undefined;
}
