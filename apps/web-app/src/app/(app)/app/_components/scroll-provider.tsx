'use client';

import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useState } from 'react';
import { PullToRefresh } from '~/components/pull-to-refresh';

interface ScrollContextValue {
  scrollY: number;
  refreshing: boolean;
  triggerRefresh: () => Promise<void>;
}

const ScrollContext = createContext<ScrollContextValue>({
  refreshing: false,
  scrollY: 0,
  triggerRefresh: async () => {},
});

export function useScroll() {
  return useContext(ScrollContext);
}

export function ScrollProvider({ children }: { children: ReactNode }) {
  const [scrollY, setScrollY] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    let rafId: number | null = null;
    let lastScrollY = 0;

    const handleScroll = () => {
      lastScrollY = window.scrollY;

      if (rafId === null) {
        rafId = requestAnimationFrame(() => {
          setScrollY(lastScrollY);
          rafId = null;
        });
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    // Set initial scroll position
    setScrollY(window.scrollY);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
    };
  }, []);

  const triggerRefresh = async () => {
    setRefreshing(true);

    try {
      // Check for service worker updates
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          await registration.update();
        }
      }

      // Reload the page to get fresh data
      window.location.reload();
    } catch (error) {
      console.error('Refresh failed:', error);
      setRefreshing(false);
    }
  };

  return (
    <ScrollContext.Provider value={{ refreshing, scrollY, triggerRefresh }}>
      <PullToRefresh disabled={refreshing} onRefresh={triggerRefresh} />
      {children}
    </ScrollContext.Provider>
  );
}
