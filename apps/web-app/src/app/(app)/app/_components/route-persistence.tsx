'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import {
  isPersistableAppPath,
  LAST_ROUTE_MESSAGE,
  LAST_ROUTE_STORAGE_KEY,
} from '~/lib/pwa-last-route';

const LAST_BABY_ID_KEY = 'nugget:last-baby-id';
const LAST_BABY_ID_MESSAGE = 'SET_LAST_BABY_ID';
const BABY_DASHBOARD_REGEX = /^\/app\/babies\/([^/]+)\/dashboard/;

/**
 * Extracts babyId from a dashboard pathname
 */
function extractBabyId(pathname: string): string | null {
  const match = pathname.match(BABY_DASHBOARD_REGEX);
  return match ? match[1] : null;
}

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

    // Extract and store babyId if this is a dashboard route
    const babyId = extractBabyId(pathname);
    if (babyId) {
      try {
        localStorage.setItem(LAST_BABY_ID_KEY, babyId);
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('[RoutePersistence] Failed to persist babyId', error);
        }
      }
    }

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready
        .then((registration) => {
          registration.active?.postMessage({
            path: pathname,
            type: LAST_ROUTE_MESSAGE,
          });

          // Also send babyId if available
          if (babyId) {
            registration.active?.postMessage({
              babyId,
              type: LAST_BABY_ID_MESSAGE,
            });
          }
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
