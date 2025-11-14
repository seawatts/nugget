'use client';

import { Icons } from '@nugget/ui/custom/icons';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

export function ServiceWorkerUpdatePrompt() {
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(
    null,
  );
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    const handleControllerChange = () => {
      window.location.reload();
    };

    navigator.serviceWorker.ready.then((registration) => {
      // Check if there's a waiting service worker
      if (registration.waiting) {
        setWaitingWorker(registration.waiting);
        setShowPrompt(true);
      }

      // Listen for new service worker updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;

        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (
              newWorker.state === 'installed' &&
              navigator.serviceWorker.controller
            ) {
              setWaitingWorker(newWorker);
              setShowPrompt(true);
            }
          });
        }
      });
    });

    navigator.serviceWorker.addEventListener(
      'controllerchange',
      handleControllerChange,
    );

    // Check for updates periodically (every hour)
    const checkForUpdates = async () => {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          await registration.update();
        }
      } catch (error) {
        console.error('Error checking for service worker updates:', error);
      }
    };

    const updateInterval = setInterval(checkForUpdates, 60 * 60 * 1000); // 1 hour

    return () => {
      navigator.serviceWorker.removeEventListener(
        'controllerchange',
        handleControllerChange,
      );
      clearInterval(updateInterval);
    };
  }, []);

  const handleUpdate = useCallback(() => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
      setShowPrompt(false);

      toast.success('Update applied! Reloading...', {
        duration: 2000,
      });
    }
  }, [waitingWorker]);

  const handleDismiss = useCallback(() => {
    setShowPrompt(false);
  }, []);

  useEffect(() => {
    if (showPrompt && waitingWorker) {
      const toastId = toast(
        <div className="flex items-center gap-3">
          <Icons.RefreshCw size="sm" />
          <div className="flex-1">
            <p className="font-semibold">Update Available</p>
            <p className="text-sm text-muted-foreground">
              A new version of Nugget is available
            </p>
          </div>
        </div>,
        {
          action: {
            label: 'Update',
            onClick: handleUpdate,
          },
          cancel: {
            label: 'Later',
            onClick: handleDismiss,
          },
          duration: Number.POSITIVE_INFINITY,
        },
      );

      return () => {
        toast.dismiss(toastId);
      };
    }
  }, [showPrompt, waitingWorker, handleUpdate, handleDismiss]);

  return null;
}
