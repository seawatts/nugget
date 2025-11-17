'use client';

import { H2, P } from '@nugget/ui/custom/typography';
import { Award } from 'lucide-react';
import { useAction } from 'next-safe-action/hooks';
import { useEffect, useRef, useState } from 'react';
import { AIGeneratingCard } from '~/components';
import type { GeneratingMessage } from '~/components/ai-generating-card.types';
import { MilestoneCard } from './milestone-card';
import { MilestoneCardCheckBack } from './milestone-card-check-back';
import { MilestoneCompletionDialog } from './milestone-completion-dialog';
import {
  completeMilestoneAction,
  getMilestonesCarouselContent,
  type MilestoneCardData,
  resolveMilestoneAIContent,
} from './milestones-carousel.actions';

type PartialBaby = {
  id: string;
  firstName: string;
  middleName: string | null;
  lastName: string | null;
  birthDate: Date | null;
  dueDate: Date | null;
  journeyStage: string | null;
  gender: string | null;
};

/**
 * Milestone-specific loading messages for AI content generation
 */
const milestoneLoadingMessages: GeneratingMessage[] = [
  (name: string, age: number) =>
    `Analyzing ${name}'s development at ${age} ${age === 1 ? 'day' : 'days'}`,
  (name: string) => `Reviewing ${name}'s physical milestones`,
  (name: string) => `Studying ${name}'s cognitive growth`,
  (name: string) => `Tracking ${name}'s social development`,
  (name: string) => `Evaluating ${name}'s language skills`,
  () => 'Consulting developmental guidelines',
  (name: string) => `Creating personalized milestones for ${name}`,
  (_name: string, age: number) => `Tailoring tracking for day ${age}`,
];

interface MilestonesCarouselProps {
  babyId: string;
}

export function MilestonesCarousel({ babyId }: MilestonesCarouselProps) {
  const [milestones, setMilestones] = useState<MilestoneCardData[]>([]);
  const [baby, setBaby] = useState<PartialBaby | null>(null);
  const [babyName, setBabyName] = useState<string>('Baby');
  const [ageInDays, setAgeInDays] = useState<number>(0);
  const [nextMilestoneDay, setNextMilestoneDay] = useState<number | undefined>(
    undefined,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isResolvingAI, setIsResolvingAI] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedMilestone, setSelectedMilestone] =
    useState<MilestoneCardData | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const milestoneRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const { executeAsync: completeMilestone } = useAction(
    completeMilestoneAction,
  );

  useEffect(() => {
    async function loadMilestones() {
      try {
        setIsLoading(true);
        setError(null);

        // Load milestone data with [AI_PENDING] placeholders
        const data = await getMilestonesCarouselContent(babyId);
        setMilestones(data.milestones);
        setBaby(data.baby);
        setBabyName(data.babyName);
        setAgeInDays(data.ageInDays);
        setNextMilestoneDay(data.nextMilestoneDay);
        setIsLoading(false);

        // Resolve AI content for each milestone progressively (non-blocking)
        const milestonesWithPendingAI = data.milestones.filter((milestone) =>
          Object.values(milestone).some((val) => val === '[AI_PENDING]'),
        );

        if (milestonesWithPendingAI.length > 0) {
          setIsResolvingAI(true);
        }

        let resolvedCount = 0;
        for (const milestone of data.milestones) {
          // Check if milestone has any pending AI content
          const hasPendingAI = Object.values(milestone).some(
            (val) => val === '[AI_PENDING]',
          );

          if (hasPendingAI) {
            // Resolve AI content in the background
            resolveMilestoneAIContent(
              milestone.id,
              babyId,
              milestone.title,
              milestone.description,
              milestone.type,
              milestone.ageLabel,
              data.ageInDays,
            )
              .then((aiContent) => {
                resolvedCount++;
                if (resolvedCount === milestonesWithPendingAI.length) {
                  setIsResolvingAI(false);
                }
                if (aiContent) {
                  // Update the milestone with resolved AI content
                  setMilestones((prev) =>
                    prev.map((m) =>
                      m.id === milestone.id
                        ? {
                            ...m,
                            bulletPoints: aiContent.bulletPoints,
                            followUpQuestion: aiContent.followUpQuestion,
                            isYesNoQuestion: aiContent.isYesNoQuestion,
                            openChatOnNo: aiContent.openChatOnNo,
                            openChatOnYes: aiContent.openChatOnYes,
                            summary: aiContent.summary,
                          }
                        : m,
                    ),
                  );
                }
              })
              .catch((error) => {
                console.error(
                  `Failed to resolve AI content for milestone "${milestone.title}":`,
                  error,
                );
                resolvedCount++;
                if (resolvedCount === milestonesWithPendingAI.length) {
                  setIsResolvingAI(false);
                }
              });
          }
        }
      } catch (error) {
        console.error('Error loading milestones:', error);
        setError(
          error instanceof Error ? error.message : 'Failed to load milestones',
        );
        setIsLoading(false);
      }
    }

    void loadMilestones();
  }, [babyId]);

  // Set up Intersection Observer to scroll to first incomplete milestone when carousel enters viewport
  useEffect(() => {
    if (!isLoading && milestones.length > 0 && scrollContainerRef.current) {
      const firstIncomplete = milestones.find((m) => !m.isCompleted);
      if (firstIncomplete) {
        const milestoneElement = milestoneRefs.current.get(firstIncomplete.id);
        const container = scrollContainerRef.current;

        if (milestoneElement && container) {
          const observer = new IntersectionObserver(
            (entries) => {
              entries.forEach((entry) => {
                // When the carousel container is fully visible in viewport, scroll to first incomplete
                if (entry.isIntersecting && entry.intersectionRatio === 1) {
                  milestoneElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'nearest',
                    inline: 'start',
                  });
                  // Disconnect after scrolling once
                  observer.disconnect();
                }
              });
            },
            {
              root: null, // Observe visibility in the viewport (for vertical page scrolling)
              threshold: 1.0, // Container must be fully visible
            },
          );

          observer.observe(container);

          // Cleanup
          return () => {
            observer.disconnect();
          };
        }
      }
    }
  }, [isLoading, milestones]);

  const handleMarkComplete = (milestone: MilestoneCardData) => {
    setSelectedMilestone(milestone);
    setDialogOpen(true);
  };

  const handleComplete = async (data: { note?: string; photoUrl?: string }) => {
    if (!selectedMilestone) return;

    try {
      const result = await completeMilestone({
        babyId,
        milestoneTitle: selectedMilestone.title,
        milestoneType: selectedMilestone.type,
        note: data.note,
        photoUrl: data.photoUrl,
        suggestedDay: selectedMilestone.suggestedDay,
      });

      if (result?.serverError) {
        console.error('Error completing milestone:', result.serverError);
        throw new Error(result.serverError);
      }

      // Update local state to mark milestone as completed
      setMilestones((prev) =>
        prev.map((m) =>
          m.title === selectedMilestone.title ? { ...m, isCompleted: true } : m,
        ),
      );

      setDialogOpen(false);
      setSelectedMilestone(null);
    } catch (error) {
      console.error('Error completing milestone:', error);
      throw error;
    }
  };

  // Show full-width loading card while initial data loads OR AI content is resolving
  if (isLoading || isResolvingAI) {
    return (
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Award className="size-5 text-primary" />
          <H2 className="text-xl">Milestones</H2>
          <P className="text-xs text-muted-foreground ml-auto">Generating...</P>
        </div>
        <AIGeneratingCard
          ageInDays={ageInDays}
          babyName={babyName}
          messages={milestoneLoadingMessages}
          variant="info"
        />
      </div>
    );
  }

  // Show error state if there was an error
  if (error) {
    return (
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Award className="size-5 text-destructive" />
          <H2 className="text-xl">Milestones</H2>
        </div>
        <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
          <P className="text-sm text-destructive">
            Unable to load milestones. Please check the console for details.
          </P>
        </div>
      </div>
    );
  }

  // Hide the section if no milestones (not an error, just nothing to show)
  if (milestones.length === 0) {
    return null;
  }

  return (
    <>
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Award className="size-5 text-primary" />
          <H2 className="text-xl">Milestones</H2>
        </div>

        {/* Horizontal scrolling container */}
        <div className="relative">
          <div
            className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide"
            ref={scrollContainerRef}
            style={{
              msOverflowStyle: 'none',
              scrollbarWidth: 'none',
            }}
          >
            {milestones.map((milestone) => (
              <div
                className="snap-start"
                key={milestone.id}
                ref={(el) => {
                  if (el) {
                    milestoneRefs.current.set(milestone.id, el);
                  } else {
                    milestoneRefs.current.delete(milestone.id);
                  }
                }}
              >
                <MilestoneCard
                  ageLabel={milestone.ageLabel}
                  babyId={babyId}
                  bulletPoints={milestone.bulletPoints}
                  followUpQuestion={milestone.followUpQuestion}
                  isCompleted={milestone.isCompleted}
                  isEnhancing={false}
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

            {/* Check Back card at the end */}
            {baby && milestones.length > 0 && (
              <div className="snap-start">
                <MilestoneCardCheckBack
                  baby={baby}
                  currentAgeInDays={ageInDays}
                  nextMilestoneDay={nextMilestoneDay}
                />
              </div>
            )}
          </div>

          {/* Gradient fade on edges */}
          <div className="pointer-events-none absolute inset-y-0 left-0 w-2 bg-gradient-to-r from-background to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-2 bg-gradient-to-l from-background to-transparent" />
        </div>
      </div>

      {/* Milestone Completion Dialog */}
      {selectedMilestone && (
        <MilestoneCompletionDialog
          babyId={babyId}
          milestoneTitle={selectedMilestone.title}
          milestoneType={selectedMilestone.type}
          onComplete={handleComplete}
          onOpenChange={setDialogOpen}
          open={dialogOpen}
        />
      )}
    </>
  );
}
