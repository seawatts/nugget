'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function PWAFirstLaunchHandler() {
  const router = useRouter();

  useEffect(() => {
    // Check if this is a PWA first launch
    const isFirstLaunch = localStorage.getItem('nugget-pwa-first-launch');
    const installUrl = localStorage.getItem('nugget-pwa-install-url');

    if (isFirstLaunch === 'true' && installUrl) {
      // Clear the flags
      localStorage.removeItem('nugget-pwa-first-launch');
      localStorage.removeItem('nugget-pwa-install-url');

      try {
        // Extract the path from the full URL
        const url = new URL(installUrl);
        const targetPath = url.pathname + url.search + url.hash;

        // Only redirect if not already on /app root
        if (targetPath !== '/app' && targetPath !== '/app/') {
          router.replace(targetPath);
        }
      } catch (error) {
        console.error('Error parsing install URL:', error);
      }
    }
  }, [router]);

  return null;
}
