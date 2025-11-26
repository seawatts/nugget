'use client';

import { Icons } from '@nugget/ui/custom/icons';
import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';
import {
  isPersistableAppPath,
  LAST_ROUTE_STORAGE_KEY,
} from '~/lib/pwa-last-route';

export default function Loading() {
  useLastRouteRedirect();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 text-sm text-muted-foreground">
      <Icons.Spinner size="lg" variant="primary" />
      <span>Opening your dashboard…</span>
    </div>
  );
}

function useLastRouteRedirect() {
  const router = useRouter();
  const hasRedirectedRef = useRef(false);

  useEffect(() => {
    if (hasRedirectedRef.current || typeof window === 'undefined') {
      return;
    }

    const storedPath = readStoredPath();
    if (!storedPath) {
      return;
    }

    hasRedirectedRef.current = true;
    router.replace(storedPath);
  }, [router]);
}

function readStoredPath(): string | null {
  try {
    const path = localStorage.getItem(LAST_ROUTE_STORAGE_KEY);
    if (!path) {
      return null;
    }

    if (path === window.location.pathname) {
      return null;
    }

    return isPersistableAppPath(path) ? path : null;
  } catch {
    return null;
  }
}
