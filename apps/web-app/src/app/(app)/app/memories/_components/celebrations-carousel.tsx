'use client';

import { useEffect, useState } from 'react';
import { CelebrationCard } from './celebration-card';
import type { CelebrationCardData } from './celebration-card.actions';
import { getCelebrationContent } from './celebration-card.actions';

interface CelebrationsCarouselProps {
  babyId: string;
}

export function CelebrationsCarousel({ babyId }: CelebrationsCarouselProps) {
  const [celebration, setCelebration] = useState<CelebrationCardData | null>(
    null,
  );
  const [babyName, setBabyName] = useState<string>('Baby');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadCelebration() {
      try {
        setIsLoading(true);
        setError(null);

        const data = await getCelebrationContent(babyId);
        setCelebration(data.celebration);
        setBabyName(data.babyName);
        setIsLoading(false);
      } catch (err) {
        console.error('Error loading celebration:', err);
        setError('Failed to load celebration');
        setIsLoading(false);
      }
    }

    loadCelebration();
  }, [babyId]);

  // Don't render anything while loading or if there's no celebration today
  if (isLoading || error || !celebration) {
    return null;
  }

  return (
    <div className="mb-6">
      <CelebrationCard
        babyId={babyId}
        babyName={babyName}
        celebration={celebration}
      />
    </div>
  );
}
