'use client';

import { useEffect, useState } from 'react';
import { CelebrationsSkeleton } from '../skeletons';
import { CelebrationCard } from './celebration-card';
import type { CelebrationCardData } from './celebration-card.actions';
import {
  getCelebrationAIContent,
  getCelebrationContent,
} from './celebration-card.actions';
import { CelebrationCardComingSoon } from './celebration-card-coming-soon';

interface CelebrationsCarouselProps {
  babyId: string;
}

export function CelebrationsCarousel({ babyId }: CelebrationsCarouselProps) {
  const [celebration, setCelebration] = useState<CelebrationCardData | null>(
    null,
  );
  const [babyName, setBabyName] = useState<string>('Baby');
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [hasCelebration, setHasCelebration] = useState<boolean | null>(null);
  const [nextCelebration, setNextCelebration] = useState<{
    day: number;
    title: string;
    shouldShow: boolean;
  } | null>(null);
  const [currentAgeInDays, setCurrentAgeInDays] = useState<number>(0);

  useEffect(() => {
    async function loadCelebration() {
      try {
        // First, get the celebration with static content
        const data = await getCelebrationContent(babyId);

        // Store age and baby name
        setCurrentAgeInDays(data.ageInDays);
        setBabyName(data.babyName);

        // Check if there's a celebration today
        if (!data.celebration) {
          setHasCelebration(false);
          // Check for upcoming celebration
          if (data.nextCelebration) {
            setNextCelebration(data.nextCelebration);
          }
          return;
        }

        // We have a celebration! Show it
        setHasCelebration(true);
        setCelebration(data.celebration);

        // Then fetch AI content in the background if needed
        if (data.aiContext) {
          setIsLoadingAI(true);
          const aiContent = await getCelebrationAIContent(data.aiContext);

          // Update the celebration with AI content
          setCelebration((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              aiQuestions: aiContent.aiQuestions,
              aiSummary: aiContent.aiSummary,
            };
          });
          setIsLoadingAI(false);
        }
      } catch (err) {
        console.error('Error loading celebration:', err);
        setHasCelebration(false);
      }
    }

    loadCelebration();
  }, [babyId]);

  // Don't render anything if we haven't checked yet
  if (hasCelebration === null) {
    return null;
  }

  // If no celebration today, check for coming soon card
  if (hasCelebration === false) {
    if (nextCelebration?.shouldShow) {
      return (
        <div className="mb-6">
          <CelebrationCardComingSoon
            babyName={babyName}
            currentAgeInDays={currentAgeInDays}
            nextCelebrationDay={nextCelebration.day}
            nextCelebrationTitle={nextCelebration.title}
          />
        </div>
      );
    }
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
        isLoadingAI={isLoadingAI}
      />
    </div>
  );
}
