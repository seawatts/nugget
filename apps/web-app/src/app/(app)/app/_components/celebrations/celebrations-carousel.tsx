'use client';

import { api } from '@nugget/api/react';
import { CelebrationsSkeleton } from '../skeletons';
import { CelebrationCard } from './celebration-card';

interface CelebrationsCarouselProps {
  babyId: string;
}

export function CelebrationsCarousel({ babyId }: CelebrationsCarouselProps) {
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

  return (
    <div className="mb-6">
      <CelebrationCard
        babyId={babyId}
        babyName={babyName}
        celebration={celebration}
        isLoadingAI={false}
      />
    </div>
  );
}
