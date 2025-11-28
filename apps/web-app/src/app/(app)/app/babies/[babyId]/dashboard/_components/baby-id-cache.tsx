'use client';

import { useParams } from 'next/navigation';
import { useEffect } from 'react';

const LAST_BABY_ID_KEY = 'nugget:last-baby-id';
const LAST_BABY_ID_MESSAGE = 'SET_LAST_BABY_ID';

/**
 * Client component that caches the babyId in localStorage and IndexedDB
 * when the dashboard loads. This enables instant PWA loading.
 */
export function BabyIdCache() {
  const params = useParams();
  const babyId = params.babyId as string;

  useEffect(() => {
    if (!babyId) {
      return;
    }

    // Store in localStorage for client-side access
    try {
      localStorage.setItem(LAST_BABY_ID_KEY, babyId);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.warn(
          '[BabyIdCache] Failed to persist babyId to localStorage',
          error,
        );
      }
    }

    // Store in service worker IndexedDB for offline access
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready
        .then((registration) => {
          registration.active?.postMessage({
            babyId,
            type: LAST_BABY_ID_MESSAGE,
          });
        })
        .catch((error) => {
          if (process.env.NODE_ENV === 'development') {
            console.warn('[BabyIdCache] SW message failed', error);
          }
        });
    }
  }, [babyId]);

  return null;
}
