'use client';

import { Button } from '@nugget/ui/button';
import { Icons } from '@nugget/ui/custom/icons';
import { P } from '@nugget/ui/custom/typography';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISSED_KEY = 'nugget-install-prompt-dismissed';
const DISMISSED_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Check if previously dismissed
    const dismissed = localStorage.getItem(DISMISSED_KEY);
    if (dismissed) {
      const dismissedTime = Number.parseInt(dismissed, 10);
      if (Date.now() - dismissedTime < DISMISSED_EXPIRY) {
        return;
      }
      localStorage.removeItem(DISMISSED_KEY);
    }

    // Check if already installed
    if (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone
    ) {
      return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener(
        'beforeinstallprompt',
        handleBeforeInstallPrompt,
      );
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    try {
      // Capture current URL before install for deep linking on first launch
      const currentUrl = window.location.href;
      localStorage.setItem('nugget-pwa-install-url', currentUrl);
      localStorage.setItem('nugget-pwa-first-launch', 'true');

      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        toast.success('Thanks for installing Nugget!');
      }

      setDeferredPrompt(null);
      setShowPrompt(false);
    } catch (error) {
      console.error('Error installing app:', error);
      toast.error('Failed to install app');
    }
  };

  const handleDismiss = () => {
    localStorage.setItem(DISMISSED_KEY, Date.now().toString());
    setShowPrompt(false);
    setDeferredPrompt(null);
  };

  if (!showPrompt || !deferredPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-12 left-4 right-4 z-50 mx-auto max-w-md animate-in slide-in-from-bottom-5">
      <div className="rounded-lg border bg-card p-4 shadow-lg">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <Icons.Download size="sm" variant="primary" />
          </div>

          <div className="flex-1">
            <P className="font-semibold">Install Nugget</P>
            <P className="text-sm" variant="muted">
              Add to your home screen for quick access and a better experience
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

        <div className="mt-3 flex gap-2">
          <Button className="flex-1" onClick={handleInstall}>
            <Icons.Download className="mr-2" size="sm" />
            Install
          </Button>
          <Button onClick={handleDismiss} variant="outline">
            Later
          </Button>
        </div>
      </div>
    </div>
  );
}
