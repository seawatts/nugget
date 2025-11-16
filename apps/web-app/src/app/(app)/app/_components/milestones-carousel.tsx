'use client';

import { H2, P } from '@nugget/ui/custom/typography';
import { Award } from 'lucide-react';
import { useAction } from 'next-safe-action/hooks';
import { useEffect, useState } from 'react';
import { AIGeneratingCard } from '~/components';
import type { GeneratingMessage } from '~/components/ai-generating-card.types';
import { MilestoneCard } from './milestone-card';
import { MilestoneCompletionDialog } from './milestone-completion-dialog';
import {
  completeMilestoneAction,
  enhanceMilestoneAction,
  getMilestonesCarouselContent,
  type MilestoneCardData,
} from './milestones-carousel.actions';

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
  const [babyName, setBabyName] = useState<string>('Baby');
  const [ageInDays, setAgeInDays] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMilestone, setSelectedMilestone] =
    useState<MilestoneCardData | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [enhancingIds, setEnhancingIds] = useState<Set<string>>(new Set());

  const { executeAsync: completeMilestone } = useAction(
    completeMilestoneAction,
  );
  const { executeAsync: enhanceMilestone } = useAction(enhanceMilestoneAction);

  useEffect(() => {
    async function loadMilestones() {
      try {
        setIsLoading(true);
        setError(null);

        // Load base milestone data (fast, no AI)
        const data = await getMilestonesCarouselContent(babyId);
        setMilestones(data.milestones);
        setBabyName(data.babyName);
        setAgeInDays(data.ageInDays);
        setIsLoading(false);

        // Start progressive AI enhancement in the background
        if (data.milestones.length > 0) {
          // Mark all milestones as enhancing
          setEnhancingIds(new Set(data.milestones.map((m) => m.id)));

          // Enhance each milestone progressively
          for (const milestone of data.milestones) {
            // Run enhancement in background
            enhanceMilestone({
              ageInDays: data.ageInDays,
              ageLabel: milestone.ageLabel,
              babyId,
              description: milestone.description,
              title: milestone.title,
              type: milestone.type,
            })
              .then((result) => {
                if (result?.data?.success && result.data.bulletPoints) {
                  // Update the milestone with enhanced content
                  setMilestones((prev) =>
                    prev.map((m) =>
                      m.id === milestone.id
                        ? {
                            ...m,
                            bulletPoints:
                              result.data.bulletPoints ?? m.bulletPoints,
                            followUpQuestion:
                              result.data.followUpQuestion ??
                              m.followUpQuestion,
                            summary: result.data.summary ?? m.summary,
                          }
                        : m,
                    ),
                  );
                }

                // Remove from enhancing set
                setEnhancingIds((prev) => {
                  const next = new Set(prev);
                  next.delete(milestone.id);
                  return next;
                });
              })
              .catch((error) => {
                console.error(
                  `Failed to enhance milestone "${milestone.title}":`,
                  error,
                );

                // Remove from enhancing set even on error
                setEnhancingIds((prev) => {
                  const next = new Set(prev);
                  next.delete(milestone.id);
                  return next;
                });
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
  }, [babyId, enhanceMilestone]);

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

  if (isLoading) {
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
          <P className="text-xs text-muted-foreground ml-auto">
            {milestones.filter((m) => !m.isCompleted).length} to track
          </P>
        </div>

        {/* Horizontal scrolling container */}
        <div className="relative">
          <div
            className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide"
            style={{
              msOverflowStyle: 'none',
              scrollbarWidth: 'none',
            }}
          >
            {milestones.map((milestone) => (
              <div className="snap-start" key={milestone.id}>
                <MilestoneCard
                  ageLabel={milestone.ageLabel}
                  babyId={babyId}
                  bulletPoints={milestone.bulletPoints}
                  description={milestone.description}
                  followUpQuestion={milestone.followUpQuestion}
                  isCompleted={milestone.isCompleted}
                  isEnhancing={enhancingIds.has(milestone.id)}
                  onMarkComplete={() => handleMarkComplete(milestone)}
                  summary={milestone.summary}
                  title={milestone.title}
                  type={milestone.type}
                />
              </div>
            ))}

            {/* Show AI generating card while enhancing */}
            {enhancingIds.size > 0 && (
              <div className="snap-start">
                <AIGeneratingCard
                  ageInDays={ageInDays}
                  babyName={babyName}
                  messages={milestoneLoadingMessages}
                  variant="info"
                />
              </div>
            )}
          </div>

          {/* Gradient fade on edges */}
          <div className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-background to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-background to-transparent" />
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
