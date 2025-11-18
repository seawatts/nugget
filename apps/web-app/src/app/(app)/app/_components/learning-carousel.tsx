'use client';

import { api } from '@nugget/api/react';
import { H2, P } from '@nugget/ui/custom/typography';
import { Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { LearningCardCheckBack } from './learning-card-check-back';
import { LearningCardInfo } from './learning-card-info';
import { LearningCardLoading } from './learning-card-loading';
import {
  getLearningCarouselContent,
  type LearningTip,
} from './learning-carousel.actions';

interface LearningCarouselProps {
  babyId: string;
}

export function LearningCarousel({ babyId }: LearningCarouselProps) {
  const [tips, setTips] = useState<LearningTip[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch baby info using tRPC for immediate display in loading card
  const { data: baby } = api.babies.getById.useQuery({ id: babyId });

  const babyName = baby?.firstName ?? 'Baby';
  const ageInDays = baby?.birthDate
    ? Math.floor(
        (Date.now() - baby.birthDate.getTime()) / (1000 * 60 * 60 * 24),
      )
    : 0;

  useEffect(() => {
    async function loadContent() {
      try {
        setIsLoading(true);
        console.log('[LearningCarousel] Loading content for baby:', babyId);

        const { tips: loadedTips } = await getLearningCarouselContent(babyId);

        console.log('[LearningCarousel] Loaded tips:', loadedTips.length);

        setTips(loadedTips);
      } catch (error) {
        console.error('[LearningCarousel] Failed to load content:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadContent();
  }, [babyId]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="size-5 text-primary" />
          <H2 className="text-xl">Learning</H2>
          <P className="text-xs text-muted-foreground ml-auto">Loading...</P>
        </div>
        <LearningCardLoading ageInDays={ageInDays} babyName={babyName} />
      </div>
    );
  }

  // Show message if no tips (don't hide completely)
  if (tips.length === 0) {
    console.log('[LearningCarousel] No tips to display');
    return (
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="size-5 text-primary" />
          <H2 className="text-xl">Learning</H2>
        </div>
        <div className="bg-muted/30 rounded-lg p-6 text-center">
          <P className="text-muted-foreground">
            {baby
              ? 'Generating personalized learning content...'
              : 'No content available'}
          </P>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="size-5 text-primary" />
        <H2 className="text-xl">Learning</H2>
      </div>

      {/* Horizontal scroll container */}
      <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide -mx-4 px-4">
        {tips.map((tip) => (
          <div
            className="snap-center shrink-0 first:ml-0 w-80 sm:w-96"
            key={`${tip.category}-${tip.summary.slice(0, 30)}`}
          >
            <LearningCardInfo
              ageInDays={ageInDays}
              babyId={baby?.id}
              tip={tip}
            />
          </div>
        ))}

        {/* Check back card - shown at the end */}
        {baby &&
          (() => {
            // Calculate next update based on AI generation schedule:
            // - Days 0-112: Daily updates
            // - Week 17+ (day 119+): Weekly updates
            let nextUpdate: number;
            if (ageInDays < 112) {
              nextUpdate = ageInDays + 1; // Tomorrow
            } else if (ageInDays < 119) {
              nextUpdate = 119; // Week 17 starts
            } else {
              // Next week boundary (weeks are 7-day intervals)
              nextUpdate = (Math.floor(ageInDays / 7) + 1) * 7;
            }

            return (
              <div className="snap-center shrink-0 w-80 sm:w-96">
                <LearningCardCheckBack baby={baby} nextUpdateAge={nextUpdate} />
              </div>
            );
          })()}
      </div>

      {/* Add custom scrollbar styles */}
      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
