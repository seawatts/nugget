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

export async function POST() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all subscriptions for the user
    const subscriptions = await db.query.pushSubscriptions.findMany({
      where: eq(pushSubscriptions.userId, userId),
    });

    if (subscriptions.length === 0) {
      return NextResponse.json(
        {
          error: 'No push subscription found',
          message:
            'Please ensure notifications are enabled and you have a valid push subscription.',
        },
        { status: 404 },
      );
    }

    // Create a test notification payload
    const notificationPayload = JSON.stringify({
      badge: '/favicon-32x32.png',
      body: 'This is a test notification from Nugget. If you see this, notifications are working! 🎉',
      data: {
        url: '/app',
      },
      icon: '/android-chrome-192x192.png',
      tag: 'test-notification',
      title: '🔔 Test Notification',
    });

    // Send test notifications to all subscriptions
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
        console.error('Failed to send test notification:', error);

        // Remove invalid subscriptions
        if (error instanceof Error && error.message.includes('410')) {
          await db
            .delete(pushSubscriptions)
            .where(eq(pushSubscriptions.endpoint, subscription.endpoint));
        }

        return {
          endpoint: subscription.endpoint,
          error: error instanceof Error ? error.message : String(error),
          success: false,
        };
      }
    });

    const results = await Promise.all(sendPromises);
    const successCount = results.filter((r) => r.success).length;

    if (successCount === 0) {
      return NextResponse.json(
        {
          error: 'Failed to send test notification',
          message:
            'All push subscriptions failed. This may be due to iOS-specific limitations or invalid subscription.',
          results,
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      message: 'Test notification sent successfully',
      results,
      sent: successCount,
      success: true,
      total: subscriptions.length,
    });
  } catch (error) {
    console.error('Error sending test notification:', error);
    return NextResponse.json(
      {
        error: 'Failed to send test notification',
        message:
          error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 },
    );
  }
}
