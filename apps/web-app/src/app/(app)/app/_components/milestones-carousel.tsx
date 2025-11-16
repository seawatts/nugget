'use client';

import { H2, P } from '@nugget/ui/custom/typography';
import { Award } from 'lucide-react';
import { useAction } from 'next-safe-action/hooks';
import { useEffect, useState } from 'react';
import { MilestoneCard } from './milestone-card';
import { MilestoneCompletionDialog } from './milestone-completion-dialog';
import {
  completeMilestoneAction,
  getMilestonesCarouselContent,
  type MilestoneCardData,
} from './milestones-carousel.actions';

interface MilestonesCarouselProps {
  babyId: string;
}

export function MilestonesCarousel({ babyId }: MilestonesCarouselProps) {
  const [milestones, setMilestones] = useState<MilestoneCardData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMilestone, setSelectedMilestone] =
    useState<MilestoneCardData | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { executeAsync: completeMilestone } = useAction(
    completeMilestoneAction,
  );

  useEffect(() => {
    async function loadMilestones() {
      try {
        setIsLoading(true);
        setError(null);
        const data = await getMilestonesCarouselContent(babyId);
        setMilestones(data.milestones);
        setIsLoading(false);
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
          <P className="text-xs text-muted-foreground ml-auto">Loading...</P>
        </div>
        <div className="relative">
          <div
            className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide"
            style={{
              msOverflowStyle: 'none',
              scrollbarWidth: 'none',
            }}
          >
            {[1, 2, 3].map((i) => (
              <div
                className="min-w-[280px] h-[440px] rounded-lg bg-muted/50 animate-pulse snap-start"
                key={i}
              />
            ))}
          </div>
          {/* Gradient fade on edges */}
          <div className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-background to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-background to-transparent" />
        </div>
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
                  description={milestone.description}
                  isCompleted={milestone.isCompleted}
                  onMarkComplete={() => handleMarkComplete(milestone)}
                  title={milestone.title}
                  type={milestone.type}
                />
              </div>
            ))}
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
