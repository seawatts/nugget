import { auth } from '@clerk/nextjs/server';
import { db } from '@nugget/db/client';
import { pushSubscriptions } from '@nugget/db/schema';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import webpush from 'web-push';

// Configure web-push with VAPID keys
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    'mailto:support@nugget.baby',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY,
  );
}

interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: Record<string, unknown>;
  tag?: string;
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload: PushNotificationPayload = await request.json();

    if (!payload.title || !payload.body) {
      return NextResponse.json(
        { error: 'Title and body are required' },
        { status: 400 },
      );
    }

    // Get all subscriptions for the user
    const subscriptions = await db.query.pushSubscriptions.findMany({
      where: eq(pushSubscriptions.userId, userId),
    });

    if (subscriptions.length === 0) {
      return NextResponse.json(
        { error: 'No subscriptions found' },
        { status: 404 },
      );
    }

    const notificationPayload = JSON.stringify({
      badge: payload.badge || '/android-chrome-192x192.png',
      body: payload.body,
      data: payload.data,
      icon: payload.icon || '/android-chrome-192x192.png',
      tag: payload.tag,
      title: payload.title,
    });

    // Send notifications to all subscriptions
    const sendPromises = subscriptions.map(async (subscription) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: {
              auth: subscription.auth,
              p256dh: subscription.p256dh,
            },
          },
          notificationPayload,
        );
        return { endpoint: subscription.endpoint, success: true };
      } catch (error) {
        console.error('Failed to send notification:', error);

        // Remove invalid subscriptions
        if (error instanceof Error && error.message.includes('410')) {
          await db
            .delete(pushSubscriptions)
            .where(eq(pushSubscriptions.endpoint, subscription.endpoint));
        }

        return { endpoint: subscription.endpoint, error, success: false };
      }
    });

    const results = await Promise.all(sendPromises);
    const successCount = results.filter((r) => r.success).length;

    return NextResponse.json({
      results,
      sent: successCount,
      success: true,
      total: subscriptions.length,
    });
  } catch (error) {
    console.error('Error sending push notifications:', error);
    return NextResponse.json(
      { error: 'Failed to send notifications' },
      { status: 500 },
    );
  }
}
