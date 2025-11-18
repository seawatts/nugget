'use client';

import { api } from '@nugget/api/react';
import { H2, P } from '@nugget/ui/custom/typography';
import { Award } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useOptimisticMilestonesStore } from '~/stores/optimistic-milestones';
import { MilestoneCard } from './milestone-card';
import { MilestoneCardCheckBack } from './milestone-card-check-back';
import { MilestoneCardLoading } from './milestone-card-loading';
import {
  getMilestonesCarouselContent,
  type MilestoneCardData,
} from './milestones-carousel.actions';
import { useMilestoneMutations } from './use-milestone-mutations';

interface MilestonesCarouselProps {
  babyId: string;
}

export function MilestonesCarousel({ babyId }: MilestonesCarouselProps) {
  const [milestones, setMilestones] = useState<MilestoneCardData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch baby info using tRPC for immediate display in loading card
  const { data: baby } = api.babies.getById.useQuery({ id: babyId });

  // Use milestone mutations hook
  const { markComplete } = useMilestoneMutations();

  // Get optimistic completion state
  const isOptimisticallyCompleted =
    useOptimisticMilestonesStore.use.isOptimisticallyCompleted();

  const babyName = baby?.firstName ?? 'Baby';
  const ageInDays = baby?.birthDate
    ? Math.floor(
        (Date.now() - baby.birthDate.getTime()) / (1000 * 60 * 60 * 24),
      )
    : 0;

  // Load milestones content
  useEffect(() => {
    async function loadMilestones() {
      try {
        setIsLoading(true);
        console.log('[MilestonesCarousel] Loading content for baby:', babyId);

        const data = await getMilestonesCarouselContent(babyId);

        console.log(
          '[MilestonesCarousel] Loaded milestones:',
          data.milestones.length,
        );

        setMilestones(data.milestones);
      } catch (error) {
        console.error('[MilestonesCarousel] Failed to load content:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadMilestones();
  }, [babyId]);

  // Handler to mark milestone as complete
  const handleMarkComplete = useCallback(
    async (milestone: MilestoneCardData) => {
      if (!baby?.id) return;

      try {
        await markComplete({
          babyId: baby.id,
          description: milestone.description,
          milestoneId: milestone.id,
          suggestedDay: milestone.suggestedDay,
          title: milestone.title,
          type: milestone.type,
        });

        console.log(
          '[MilestonesCarousel] Milestone marked complete:',
          milestone.title,
        );
      } catch (error) {
        console.error('[MilestonesCarousel] Failed to mark complete:', error);
      }
    },
    [baby?.id, markComplete],
  );

  // Show loading state
  if (isLoading) {
    return (
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Award className="size-5 text-primary" />
          <H2 className="text-xl">Milestones</H2>
          <P className="text-xs text-muted-foreground ml-auto">Loading...</P>
        </div>
        <MilestoneCardLoading ageInDays={ageInDays} babyName={babyName} />
      </div>
    );
  }

  // Show message if no milestones (don't hide completely)
  if (milestones.length === 0) {
    console.log('[MilestonesCarousel] No milestones to display');
    return (
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Award className="size-5 text-primary" />
          <H2 className="text-xl">Milestones</H2>
          <P className="text-xs text-muted-foreground ml-auto">
            Day {ageInDays}
          </P>
        </div>
        <div className="bg-muted/30 rounded-lg p-6 text-center">
          <P className="text-muted-foreground">
            {baby
              ? 'Generating personalized milestone suggestions...'
              : 'No milestones available'}
          </P>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Award className="size-5 text-primary" />
        <H2 className="text-xl">Milestones</H2>
        <P className="text-xs text-muted-foreground ml-auto">Day {ageInDays}</P>
      </div>

      {/* Horizontal scroll container */}
      <div className="flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide -mx-4 px-4">
        {milestones.map((milestone) => (
          <div
            className="snap-center shrink-0 first:ml-0 w-[340px] sm:w-96"
            key={milestone.id}
          >
            <MilestoneCard
              ageLabel={milestone.ageLabel}
              babyId={baby?.id}
              bulletPoints={milestone.bulletPoints || [milestone.description]}
              followUpQuestion={milestone.followUpQuestion || ''}
              isCompleted={
                milestone.isCompleted || isOptimisticallyCompleted(milestone.id)
              }
              isYesNoQuestion={milestone.isYesNoQuestion}
              onMarkComplete={() => handleMarkComplete(milestone)}
              openChatOnNo={milestone.openChatOnNo}
              openChatOnYes={milestone.openChatOnYes}
              summary={milestone.summary}
              title={milestone.title}
              type={milestone.type}
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
                <MilestoneCardCheckBack
                  baby={{ firstName: baby.firstName ?? 'Baby' }}
                  currentAgeInDays={ageInDays}
                  nextMilestoneDay={nextUpdate}
                />
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
