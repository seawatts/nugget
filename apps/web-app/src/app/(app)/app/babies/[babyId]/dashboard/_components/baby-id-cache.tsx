'use client';

import { useParams } from 'next/navigation';
import { useEffect } from 'react';

const LAST_BABY_ID_KEY = 'nugget:last-baby-id';

/**
 * Client component that caches the babyId in localStorage and cookies
 * when the dashboard loads. This enables the server to redirect correctly
 * when navigating to /app.
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
    } catch {
      // Silently fail - non-critical
    }

    // Store in cookie for server-side redirect
    try {
      document.cookie = `${LAST_BABY_ID_KEY}=${encodeURIComponent(babyId)}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
    } catch {
      // Silently fail - non-critical
    }
  }, [babyId]);

  return null;
}
