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
  const [status, setStatus] = useState<
    'loading' | 'pending' | 'ready' | 'empty'
  >('loading');

  // Fetch baby info using tRPC suspense query (prefetched on server, lightweight version)
  const [baby] = api.babies.getByIdLight.useSuspenseQuery({ id: babyId });

  const babyName = baby?.firstName ?? 'Baby';
  const ageInDays = baby?.birthDate
    ? Math.floor(
        (Date.now() - baby.birthDate.getTime()) / (1000 * 60 * 60 * 24),
      )
    : 0;

  useEffect(() => {
    async function loadContent() {
      try {
        setStatus('loading');
        console.log('[LearningCarousel] Loading content for baby:', babyId);

        const result = await getLearningCarouselContent(babyId);

        console.log('[LearningCarousel] Result:', {
          status: result.status,
          tipsCount: result.tips.length,
        });

        setTips(result.tips);
        setStatus(result.status);

        // If pending, poll again after a short delay
        if (result.status === 'pending') {
          console.log('[LearningCarousel] Content is pending, will retry...');
          setTimeout(() => {
            loadContent();
          }, 3000); // Retry after 3 seconds
        }
      } catch (error) {
        console.error('[LearningCarousel] Failed to load content:', error);
        setStatus('empty');
      }
    }

    loadContent();
  }, [babyId]);

  // Show loading state for both initial loading and pending generation
  if (status === 'loading' || status === 'pending') {
    return (
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="size-5 text-primary" />
          <H2 className="text-xl">Learning</H2>
          <P className="text-xs text-muted-foreground ml-auto">
            {status === 'pending' ? 'Generating...' : 'Loading...'}
          </P>
        </div>
        <LearningCardLoading ageInDays={ageInDays} babyName={babyName} />
      </div>
    );
  }

  // Show message if no tips (don't hide completely)
  if (status === 'empty' || tips.length === 0) {
    console.log('[LearningCarousel] No tips to display');
    return (
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="size-5 text-primary" />
          <H2 className="text-xl">Learning</H2>
        </div>
        <div className="bg-muted/30 rounded-lg p-6 text-center">
          <P className="text-muted-foreground">
            {baby ? 'Check back later for new content' : 'No content available'}
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
      <div className="flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide -mx-4 px-4">
        {tips.map((tip) => (
          <div
            className="snap-center shrink-0 first:ml-0 w-[340px] sm:w-96"
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
              <div className="snap-center shrink-0 w-[340px] sm:w-96">
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
