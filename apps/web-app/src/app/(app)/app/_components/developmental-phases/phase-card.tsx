'use client';

import { api } from '@nugget/api/react';
import { Badge } from '@nugget/ui/badge';
import { H3, P } from '@nugget/ui/custom/typography';
import { cn } from '@nugget/ui/lib/utils';
import { CloudLightning, Sparkles } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { FeatureCard } from '~/components/feature-card';
import type { ColorConfig } from '~/components/feature-card.types';
import { useOptimisticDevelopmentalPhasesStore } from '~/stores/optimistic-developmental-phases';
import { FussyPhaseContent } from './fussy-phase-content';
import type { DevelopmentalPhaseContent, SubPhaseType } from './phase-data';
import { SkillsPhaseContent } from './skills-phase-content';

interface SubPhaseProgress {
  checklistItems: string[];
  completedAt: Date | null;
}

export interface PhaseCardProps {
  ageInDays: number;
  babyId: string;
  phase: DevelopmentalPhaseContent;
  progress: {
    fussy?: SubPhaseProgress;
    skills?: SubPhaseProgress;
  };
}

const PHASE_THEME_COLORS: Record<
  DevelopmentalPhaseContent['theme'],
  ColorConfig
> = {
  cloud: {
    badge: 'bg-black/10 text-foreground',
    border: 'border-developmental-phase-skills/30',
    card: 'bg-developmental-phase-skills',
    icon: 'text-foreground',
    text: 'text-foreground',
  },
  mint: {
    badge: 'bg-black/10 text-foreground',
    border: 'border-developmental-phase-skills/30',
    card: 'bg-developmental-phase-skills',
    icon: 'text-foreground',
    text: 'text-foreground',
  },
  sunrise: {
    badge: 'bg-black/15 text-white',
    border: 'border-developmental-phase-fussy/30',
    card: 'bg-developmental-phase-fussy',
    icon: 'text-white',
    text: 'text-white',
  },
};

function getWeekLabel({ startDay, endDay }: DevelopmentalPhaseContent) {
  const startWeek = Math.max(1, Math.floor(startDay / 7));
  const endWeek = Math.max(startWeek, Math.floor(endDay / 7));
  return `Weeks ${startWeek}–${endWeek}`;
}

function getPhaseStatusText(
  ageInDays: number,
  phase: DevelopmentalPhaseContent,
) {
  if (ageInDays < phase.startDay) {
    const daysUntil = phase.startDay - ageInDays;
    return `Starts in ${daysUntil} ${daysUntil === 1 ? 'day' : 'days'}`;
  }
  if (ageInDays > phase.endDay) {
    const daysAgo = ageInDays - phase.endDay;
    return `Ended ${daysAgo} ${daysAgo === 1 ? 'day' : 'days'} ago`;
  }
  return 'Happening now';
}

function arraysEqual(a: string[], b: string[]) {
  if (a.length !== b.length) return false;
  return a.every((value, index) => value === b[index]);
}

export function PhaseCard({
  ageInDays,
  babyId,
  phase,
  progress,
}: PhaseCardProps) {
  const utils = api.useUtils();
  const [pendingKey, setPendingKey] = useState<string | null>(null);

  const serverFussyChecklist = progress.fussy?.checklistItems ?? [];
  const serverSkillsChecklist = progress.skills?.checklistItems ?? [];
  const serverFussyComplete = Boolean(progress.fussy?.completedAt);
  const serverSkillsComplete = Boolean(progress.skills?.completedAt);

  const getSubPhaseState =
    useOptimisticDevelopmentalPhasesStore.use.getSubPhaseState();
  const setChecklist = useOptimisticDevelopmentalPhasesStore.use.setChecklist();
  const setIsComplete =
    useOptimisticDevelopmentalPhasesStore.use.setIsComplete();
  const removeSubPhaseState =
    useOptimisticDevelopmentalPhasesStore.use.removeSubPhaseState();

  const optimisticFussy = getSubPhaseState(phase.id, 'fussy');
  const optimisticSkills = getSubPhaseState(phase.id, 'skills');

  useEffect(() => {
    if (
      optimisticFussy &&
      arraysEqual(
        Array.from(optimisticFussy.checklist),
        serverFussyChecklist,
      ) &&
      optimisticFussy.isComplete === serverFussyComplete
    ) {
      removeSubPhaseState(phase.id, 'fussy');
    }
  }, [
    optimisticFussy,
    phase.id,
    removeSubPhaseState,
    serverFussyChecklist,
    serverFussyComplete,
  ]);

  useEffect(() => {
    if (
      optimisticSkills &&
      arraysEqual(
        Array.from(optimisticSkills.checklist),
        serverSkillsChecklist,
      ) &&
      optimisticSkills.isComplete === serverSkillsComplete
    ) {
      removeSubPhaseState(phase.id, 'skills');
    }
  }, [
    optimisticSkills,
    phase.id,
    removeSubPhaseState,
    serverSkillsChecklist,
    serverSkillsComplete,
  ]);

  const fussyChecklist = optimisticFussy
    ? Array.from(optimisticFussy.checklist)
    : serverFussyChecklist;
  const skillsChecklist = optimisticSkills
    ? Array.from(optimisticSkills.checklist)
    : serverSkillsChecklist;

  const isFussyComplete = optimisticFussy?.isComplete ?? serverFussyComplete;
  const isSkillsComplete = optimisticSkills?.isComplete ?? serverSkillsComplete;

  const defaultSubPhase: SubPhaseType = isFussyComplete ? 'skills' : 'fussy';
  const [selectedSubPhase, setSelectedSubPhase] =
    useState<SubPhaseType>(defaultSubPhase);
  const wasFussyCompleteRef = useRef(isFussyComplete);

  useEffect(() => {
    if (!isFussyComplete && selectedSubPhase === 'skills') {
      setSelectedSubPhase('fussy');
    }
  }, [isFussyComplete, selectedSubPhase]);

  useEffect(() => {
    if (!wasFussyCompleteRef.current && isFussyComplete) {
      setSelectedSubPhase('skills');
    }
    wasFussyCompleteRef.current = isFussyComplete;
  }, [isFussyComplete]);

  const { mutateAsync: saveProgress } =
    api.developmentalPhases.updatePhaseProgress.useMutation();

  const handleSave = useCallback(
    async (
      subPhaseType: SubPhaseType,
      checklistItems: string[],
      isComplete: boolean,
    ) => {
      const key = `${phase.id}-${subPhaseType}`;
      setPendingKey(key);
      try {
        await saveProgress({
          babyId,
          checklistItems,
          isSubPhaseComplete: isComplete,
          phaseId: phase.id,
          subPhaseType,
        });
        await utils.developmentalPhases.getPhasesForBaby.invalidate({
          babyId,
        });
      } catch (error) {
        toast.error('Unable to save progress right now.', {
          description:
            error instanceof Error ? error.message : 'Please try again.',
        });
      } finally {
        setPendingKey(null);
      }
    },
    [babyId, phase.id, saveProgress, utils],
  );

  const handleChecklistChange = useCallback(
    (
      subPhaseType: SubPhaseType,
      itemId: string,
      checked: boolean,
      totalItems: number,
    ) => {
      const currentChecklist =
        subPhaseType === 'fussy' ? fussyChecklist : skillsChecklist;
      const nextChecklist = checked
        ? Array.from(new Set([...currentChecklist, itemId]))
        : currentChecklist.filter((id) => id !== itemId);
      const nextComplete = totalItems > 0 && nextChecklist.length >= totalItems;
      setChecklist(phase.id, subPhaseType, nextChecklist);
      setIsComplete(phase.id, subPhaseType, nextComplete);
      void handleSave(subPhaseType, nextChecklist, nextComplete);
    },
    [
      fussyChecklist,
      skillsChecklist,
      handleSave,
      phase.id,
      setChecklist,
      setIsComplete,
    ],
  );

  const colorConfig = PHASE_THEME_COLORS[phase.theme];
  const isPendingFussy = pendingKey === `${phase.id}-fussy`;
  const isPendingSkills = pendingKey === `${phase.id}-skills`;
  const isSunriseTheme = phase.theme === 'sunrise';
  const toggleTrackClasses = isSunriseTheme
    ? 'bg-black/25 dark:bg-black/40'
    : 'bg-white/25 dark:bg-black/30';
  const activeToggleClasses = isSunriseTheme
    ? 'bg-black/60 text-white ring-2 ring-white/60 shadow-lg'
    : 'bg-white text-foreground ring-2 ring-black/10 shadow-lg';
  const inactiveToggleClasses = isSunriseTheme
    ? 'text-white/75'
    : 'text-foreground/70';

  const HeadlineIcon = selectedSubPhase === 'fussy' ? CloudLightning : Sparkles;

  return (
    <FeatureCard
      className="w-[340px] sm:w-96"
      colorConfig={colorConfig}
      variant="custom"
    >
      <FeatureCard.Header className="space-y-4 pt-6 pb-4">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Badge
              className={cn('w-fit text-xs font-semibold', colorConfig.badge)}
            >
              Phase {phase.phaseNumber}
            </Badge>
            <P className={cn('text-xs', colorConfig.text)}>
              {getPhaseStatusText(ageInDays, phase)}
            </P>
          </div>
          <div className="space-y-2">
            <H3 className={cn('text-2xl leading-tight', colorConfig.text)}>
              {phase.name}
            </H3>
            <div
              className={cn(
                'flex items-center gap-2 text-xs',
                colorConfig.text,
              )}
            >
              <span>{getWeekLabel(phase)}</span>
              <span>•</span>
              <span>
                Days {phase.startDay}–{phase.endDay}
              </span>
            </div>
          </div>
        </div>
        <div
          className={cn(
            'inline-flex w-full rounded-full p-1 gap-1',
            toggleTrackClasses,
          )}
        >
          {(['fussy', 'skills'] as SubPhaseType[]).map((subPhase) => {
            const isSelected = subPhase === selectedSubPhase;
            return (
              <button
                className={cn(
                  'flex-1 rounded-full px-4 py-2 text-sm font-semibold transition-all',
                  isSelected
                    ? activeToggleClasses
                    : cn(inactiveToggleClasses, 'hover:opacity-100'),
                )}
                key={subPhase}
                onClick={() => setSelectedSubPhase(subPhase)}
                type="button"
              >
                {subPhase === 'fussy' ? 'Fussy' : 'Skills'}
              </button>
            );
          })}
        </div>
      </FeatureCard.Header>

      <FeatureCard.Content className="space-y-4">
        <div className="flex items-center gap-3 rounded-2xl bg-black/15 dark:bg-black/30 px-3 py-2">
          <HeadlineIcon className={cn('size-6', colorConfig.icon)} />
          <P className={cn('text-sm', colorConfig.text)}>{phase.headline}</P>
        </div>

        {selectedSubPhase === 'fussy' && (
          <FussyPhaseContent
            behaviors={phase.fussy.behaviors}
            checkedIds={fussyChecklist}
            intro={phase.fussy.intro}
            isComplete={isFussyComplete || isPendingFussy}
            onToggleBehavior={(behaviorId, checked) =>
              handleChecklistChange(
                'fussy',
                behaviorId,
                checked,
                phase.fussy.behaviors.length,
              )
            }
          />
        )}

        {selectedSubPhase === 'skills' && (
          <SkillsPhaseContent
            checkedIds={skillsChecklist}
            focuses={phase.skills.focuses}
            intro={phase.skills.intro}
            isComplete={isSkillsComplete || isPendingSkills}
            isFussyComplete={isFussyComplete}
            onToggleFocus={(focusId, checked) =>
              handleChecklistChange(
                'skills',
                focusId,
                checked,
                phase.skills.focuses.length,
              )
            }
          />
        )}
      </FeatureCard.Content>

      <FeatureCard.Footer className="flex flex-col gap-2 pt-2">
        <P className={cn('text-xs text-center', colorConfig.text)}>
          {selectedSubPhase === 'fussy'
            ? isFussyComplete
              ? '✓ Ready for skills phase'
              : `${fussyChecklist.length}/${phase.fussy.behaviors.length} checked`
            : isSkillsComplete
              ? '✓ Phase complete'
              : `${skillsChecklist.length}/${phase.skills.focuses.length} celebrated`}
        </P>
      </FeatureCard.Footer>
    </FeatureCard>
  );
}
