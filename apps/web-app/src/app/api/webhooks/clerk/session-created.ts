import type { SessionJSON, WebhookEvent } from '@clerk/nextjs/server';
import { clerkClient } from '@clerk/nextjs/server';
import { posthog } from '@nugget/analytics/posthog/server';
import { db } from '@nugget/db/client';
import { Users } from '@nugget/db/schema';

export async function handleSessionCreated(event: WebhookEvent) {
  // Narrow event.data to SessionJSON for 'session.created' events
  const sessionData = event.data as SessionJSON;

  // Fetch user from Clerk to get latest data
  const client = await clerkClient();
  const clerkUser = await client.users.getUser(sessionData.user_id);

  const email = clerkUser.primaryEmailAddress?.emailAddress;
  if (!email) {
    console.error('Email not found for user', sessionData.user_id);
    return new Response('', { status: 200 });
  }

  // Upsert user - create if doesn't exist, update lastLoggedInAt if exists
  const [user] = await db
    .insert(Users)
    .values({
      avatarUrl: clerkUser.imageUrl ?? null,
      clerkId: sessionData.user_id,
      email,
      firstName: clerkUser.firstName ?? null,
      id: sessionData.user_id,
      lastLoggedInAt: new Date(),
      lastName: clerkUser.lastName ?? null,
    })
    .onConflictDoUpdate({
      set: {
        avatarUrl: clerkUser.imageUrl ?? null,
        email,
        firstName: clerkUser.firstName ?? null,
        lastLoggedInAt: new Date(),
        lastName: clerkUser.lastName ?? null,
        updatedAt: new Date(),
      },
      target: Users.clerkId,
    })
    .returning();

  if (!user) {
    return new Response('Failed to upsert user on session.created', {
      status: 400,
    });
  }

  posthog.capture({
    distinctId: user.id,
    event: 'login',
    properties: {
      email: user.email,
    },
  });

  return undefined;
}
