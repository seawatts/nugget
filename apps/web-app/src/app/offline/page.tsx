'use client';

import { Button } from '@nugget/ui/button';
import { Icons } from '@nugget/ui/custom/icons';
import { H1, P } from '@nugget/ui/custom/typography';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function OfflinePage() {
  const router = useRouter();
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    setIsOnline(navigator.onLine);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRetry = () => {
    if (navigator.onLine) {
      router.back();
    }
  };

  useEffect(() => {
    if (isOnline) {
      router.back();
    }
  }, [isOnline, router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-4">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="rounded-full bg-muted p-6">
          <Icons.WifiOff size="2xl" variant="muted" />
        </div>

        <div className="grid gap-2">
          <H1>You're Offline</H1>
          <P className="max-w-md" variant="muted">
            It looks like you've lost your internet connection. Some features
            may not be available until you're back online.
          </P>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <Button className="min-w-48" onClick={handleRetry} size="lg">
          <Icons.RotateCw className="mr-2" size="sm" />
          Try Again
        </Button>

        <Button
          className="min-w-48"
          onClick={() => router.push('/app')}
          size="lg"
          variant="ghost"
        >
          Go to Home
        </Button>
      </div>

      <div className="mt-8 rounded-lg border bg-card p-4 max-w-md">
        <P className="text-sm" variant="muted">
          <strong>Tip:</strong> Your recent activities and data may still be
          available in the app. Some features will automatically sync when
          you're back online.
        </P>
      </div>
    </div>
  );
}
