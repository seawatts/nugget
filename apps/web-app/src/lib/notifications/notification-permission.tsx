'use client';

import { Button } from '@nugget/ui/button';
import { Icons } from '@nugget/ui/custom/icons';
import { P } from '@nugget/ui/custom/typography';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { subscribeToPushNotifications } from './push-manager';

interface NotificationPermissionProps {
  onPermissionGranted?: () => void;
  onPermissionDenied?: () => void;
}

export function NotificationPermission({
  onPermissionGranted,
  onPermissionDenied,
}: NotificationPermissionProps) {
  const [permission, setPermission] =
    useState<NotificationPermission>('default');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    if (!('Notification' in window)) {
      toast.error('Notifications are not supported in this browser');
      return;
    }

    setIsLoading(true);

    try {
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result === 'granted') {
        const subscription = await subscribeToPushNotifications();

        if (subscription) {
          // Save subscription to backend
          const response = await fetch('/api/push/subscribe', {
            body: JSON.stringify(subscription),
            headers: {
              'Content-Type': 'application/json',
            },
            method: 'POST',
          });

          if (response.ok) {
            toast.success('Notifications enabled successfully!');
            onPermissionGranted?.();
          } else {
            toast.error('Failed to save notification subscription');
          }
        }
      } else if (result === 'denied') {
        toast.error('Notification permission denied');
        onPermissionDenied?.();
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      toast.error('Failed to enable notifications');
    } finally {
      setIsLoading(false);
    }
  };

  if (permission === 'granted') {
    return (
      <div className="flex items-center gap-2 rounded-lg border bg-card p-4">
        <Icons.Check size="sm" variant="primary" />
        <P className="text-sm" variant="muted">
          Notifications are enabled
        </P>
      </div>
    );
  }

  if (permission === 'denied') {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-4">
        <Icons.X size="sm" variant="destructive" />
        <P className="text-sm" variant="muted">
          Notifications are blocked. Enable them in your browser settings.
        </P>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-card p-4">
      <div className="flex items-start gap-3">
        <Icons.Bell className="mt-0.5" size="sm" />
        <div className="flex-1">
          <P className="font-medium">Enable Notifications</P>
          <P className="text-sm" variant="muted">
            Get notified about important updates and reminders for your baby's
            activities.
          </P>
        </div>
      </div>
      <Button disabled={isLoading} onClick={requestPermission} size="sm">
        {isLoading ? (
          <>
            <Icons.Spinner className="mr-2" size="sm" />
            Enabling...
          </>
        ) : (
          'Enable Notifications'
        )}
      </Button>
    </div>
  );
}
