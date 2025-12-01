'use client';

import { Button } from '@nugget/ui/button';
import { Card } from '@nugget/ui/card';
import { Icons } from '@nugget/ui/custom/icons';
import { H3, P } from '@nugget/ui/custom/typography';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface AlarmSettingsProps {
  initialSettings: {
    alarmFeedingEnabled: boolean;
    alarmSleepEnabled: boolean;
    alarmDiaperEnabled: boolean;
    alarmPumpingEnabled: boolean;
    alarmFeedingThreshold: number | null;
    alarmSleepThreshold: number | null;
    alarmDiaperThreshold: number | null;
    alarmPumpingThreshold: number | null;
  };
  babyAgeDays: number | null;
}

export function AlarmSettings({
  initialSettings: _initialSettings,
  babyAgeDays: _babyAgeDays,
}: AlarmSettingsProps) {
  const [notificationPermission, setNotificationPermission] =
    useState<NotificationPermission>('default');
  const [supportsPeriodicSync, setSupportsPeriodicSync] = useState(false);

  useEffect(() => {
    // Check notification permission
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }

    // Check for Periodic Background Sync support
    if (
      'serviceWorker' in navigator &&
      'periodicSync' in ServiceWorkerRegistration.prototype
    ) {
      setSupportsPeriodicSync(true);
    }
  }, []);

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      toast.error('Notifications are not supported in this browser');
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);

      if (permission === 'granted') {
        toast.success('Notifications enabled!');
      } else {
        toast.error('Notification permission denied');
      }
    } catch (_error) {
      toast.error('Failed to request notification permission');
    }
  };

  const testNotification = async () => {
    if (notificationPermission !== 'granted') {
      toast.error('Please enable notifications first');
      return;
    }

    try {
      // Check if we're on iOS and have service worker support
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const hasServiceWorker = 'serviceWorker' in navigator;
      const hasPushManager = 'PushManager' in window;

      if (isIOS && !hasPushManager && hasServiceWorker) {
        // iOS 16.3 and earlier don't support Push API
        // Try to show a notification directly as a fallback
        const registration = await navigator.serviceWorker.ready;
        await registration.showNotification('🔔 Test Notification', {
          badge: '/favicon-32x32.png',
          body: 'This is a test notification. Push API may not be supported on your iOS version.',
          icon: '/android-chrome-192x192.png',
          tag: 'test-notification',
        });
        toast.success('Test notification sent (direct)');
        return;
      }

      // Try to send via push API first
      const response = await fetch('/api/push/test', {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        // If push fails, try direct notification as fallback
        if (hasServiceWorker && data.error?.includes('No push subscription')) {
          const registration = await navigator.serviceWorker.ready;
          await registration.showNotification('🔔 Test Notification', {
            badge: '/favicon-32x32.png',
            body: 'This is a test notification. Push subscription not found - using direct notification.',
            icon: '/android-chrome-192x192.png',
            tag: 'test-notification',
          });
          toast.success('Test notification sent (fallback)');
          return;
        }

        toast.error(
          data.message || data.error || 'Failed to send test notification',
        );
        return;
      }

      toast.success(
        data.message || `Test notification sent to ${data.sent} device(s)`,
      );
    } catch (error) {
      console.error('Error sending test notification:', error);
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to send test notification',
      );
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <H3>Notifications</H3>
        <P className="text-muted-foreground">
          Manage notification permissions for the app
        </P>
      </div>

      {/* Notification Permission Card */}
      <Card className="p-4">
        <div className="flex flex-col gap-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <Label className="text-base font-medium">
                Notification Permission
              </Label>
              <P className="text-muted-foreground text-sm">
                {notificationPermission === 'granted' &&
                  'Notifications are enabled ✓'}
                {notificationPermission === 'denied' &&
                  'Notifications are blocked. Please enable them in your browser settings.'}
                {notificationPermission === 'default' &&
                  'Click to enable notifications'}
              </P>
              {!supportsPeriodicSync && (
                <P className="text-warning text-sm mt-2">
                  ⚠️ Your browser doesn't support background sync. Notifications
                  will only work while the app is open or install the PWA.
                </P>
              )}
            </div>
            {notificationPermission !== 'granted' && (
              <Button onClick={requestNotificationPermission} size="sm">
                Enable
              </Button>
            )}
          </div>

          {notificationPermission === 'granted' && (
            <div className="flex gap-2">
              <Button onClick={testNotification} size="sm" variant="outline">
                <Icons.Bell size="sm" />
                Test Notification
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
