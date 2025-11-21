'use client';

import { Button } from '@nugget/ui/button';
import { Icons } from '@nugget/ui/custom/icons';
import { P } from '@nugget/ui/custom/typography';
import { useEffect, useState } from 'react';

const DISMISSED_KEY = 'nugget-ios-install-prompt-dismissed';
const DISMISSED_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days

function isIOS(): boolean {
  if (typeof window === 'undefined') return false;

  const userAgent = window.navigator.userAgent.toLowerCase();
  const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);

  // Exclude Chrome on iOS (CriOS) as it may support the native prompt
  const isChrome = /crios/.test(userAgent);

  return isIOSDevice && !isChrome;
}

function isInStandaloneMode(): boolean {
  if (typeof window === 'undefined') return false;

  // Check if app is already installed (standalone mode)
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone ===
      true
  );
}

export function IosInstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;

    // Check if iOS
    if (!isIOS()) return;

    // Check if already installed
    if (isInStandaloneMode()) return;

    // Check if previously dismissed
    const dismissed = localStorage.getItem(DISMISSED_KEY);
    if (dismissed) {
      const dismissedTime = Number.parseInt(dismissed, 10);
      if (Date.now() - dismissedTime < DISMISSED_EXPIRY) {
        return;
      }
      localStorage.removeItem(DISMISSED_KEY);
    }

    // Show the prompt after a short delay for better UX
    const timer = setTimeout(() => {
      setShowPrompt(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(DISMISSED_KEY, Date.now().toString());
    setShowPrompt(false);
  };

  if (!showPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-10 left-0 right-0 z-50 px-4 pb-4">
      <div className="rounded-lg border bg-card p-4 shadow-lg">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <Icons.Download size="sm" variant="primary" />
          </div>

          <div className="flex-1">
            <P className="font-semibold">Install Nugget</P>
            <P className="text-sm" variant="muted">
              Tap the{' '}
              <span className="inline-flex items-center">
                <Icons.Share className="mx-1" size="xs" />
              </span>{' '}
              Share button below, then select &quot;Add to Home Screen&quot;
            </P>
          </div>

          <Button
            className="shrink-0"
            onClick={handleDismiss}
            size="icon"
            variant="ghost"
          >
            <Icons.X size="sm" />
            <span className="sr-only">Dismiss</span>
          </Button>
        </div>

        <div className="mt-3 flex justify-end">
          <Button onClick={handleDismiss} variant="outline">
            Got it
          </Button>
        </div>
      </div>
    </div>
  );
}
