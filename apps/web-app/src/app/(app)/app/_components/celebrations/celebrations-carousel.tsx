'use client';

import {
  buildDashboardEvent,
  DASHBOARD_ACTION,
  DASHBOARD_COMPONENT,
} from '@nugget/analytics/utils';
import { api } from '@nugget/api/react';
import posthog from 'posthog-js';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { CelebrationsSkeleton } from '../skeletons';
import { CelebrationCard } from './celebration-card';

interface CelebrationsCarouselProps {
  babyId: string;
}

const getTodayKey = () => {
  const now = new Date();
  const month = `${now.getMonth() + 1}`.padStart(2, '0');
  const day = `${now.getDate()}`.padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
};

export function CelebrationsCarousel({ babyId }: CelebrationsCarouselProps) {
  const [dismissedToday, setDismissedToday] = useState(false);

  // Use tRPC query with prefetched data (from page.tsx)
  const { data, isLoading } = api.celebrations.getCarouselContent.useQuery(
    { babyId },
    {
      staleTime: 86400000, // 1 day cache
    },
  );

  const celebration = data?.celebration ?? null;
  const babyName = data?.babyName ?? 'Baby';
  const hasCelebration = !!celebration;

  const todayKey = useMemo(() => getTodayKey(), []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const dismissKey = `celebrationDismissedDate_${babyId}`;
    const storedDate = window.localStorage.getItem(dismissKey);
    setDismissedToday(storedDate === todayKey);
  }, [babyId, todayKey]);

  const handleDismiss = useCallback(() => {
    // Track celebration dismissal
    posthog.capture(
      buildDashboardEvent(
        DASHBOARD_COMPONENT.CELEBRATIONS_CAROUSEL,
        DASHBOARD_ACTION.DISMISSED,
      ),
      {
        baby_id: babyId,
        celebration_type: celebration?.type,
      },
    );

    setDismissedToday(true);
    if (typeof window === 'undefined') {
      return;
    }
    const dismissKey = `celebrationDismissedDate_${babyId}`;
    window.localStorage.setItem(dismissKey, todayKey);
  }, [babyId, todayKey, celebration?.type]);

  // Don't render anything while loading or if no data yet
  if (isLoading || !data) {
    return null;
  }

  // If no celebration today, check for coming soon card
  if (hasCelebration === false) {
    return null;
  }

  // Don't render if we don't have the celebration data yet
  if (!celebration) {
    return <CelebrationsSkeleton />;
  }

  // Don't render if dismissed for today
  if (dismissedToday) {
    return null;
  }

  return (
    <CelebrationCard
      babyId={babyId}
      babyName={babyName}
      celebration={celebration}
      isLoadingAI={false}
      onDismiss={handleDismiss}
    />
  );
}
