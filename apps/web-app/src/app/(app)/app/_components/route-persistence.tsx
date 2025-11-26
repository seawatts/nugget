'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import {
  isPersistableAppPath,
  LAST_ROUTE_MESSAGE,
  LAST_ROUTE_STORAGE_KEY,
} from '~/lib/pwa-last-route';

export function RoutePersistence() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || !isPersistableAppPath(pathname)) {
      return;
    }

    try {
      localStorage.setItem(LAST_ROUTE_STORAGE_KEY, pathname);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[RoutePersistence] Failed to persist route', error);
      }
    }

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready
        .then((registration) => {
          registration.active?.postMessage({
            path: pathname,
            type: LAST_ROUTE_MESSAGE,
          });
        })
        .catch((error) => {
          if (process.env.NODE_ENV === 'development') {
            console.warn('[RoutePersistence] SW message failed', error);
          }
        });
    }
  }, [pathname]);

  return null;
}
