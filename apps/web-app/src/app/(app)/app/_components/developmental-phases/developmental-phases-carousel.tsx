'use client';

import {
  buildDashboardEvent,
  DASHBOARD_ACTION,
  DASHBOARD_COMPONENT,
} from '@nugget/analytics/utils';
import { api } from '@nugget/api/react';
import { H2, P } from '@nugget/ui/custom/typography';
import { Sparkles } from 'lucide-react';
import posthog from 'posthog-js';
import { useEffect, useMemo, useRef } from 'react';
import { useDashboardDataStore } from '~/stores/dashboard-data';
import { DevelopmentalPhasesSkeleton } from '../skeletons';
import type { PhaseCardProps } from './phase-card';
import { PhaseCard } from './phase-card';
import { DEVELOPMENTAL_PHASES } from './phase-data';

interface DevelopmentalPhasesCarouselProps {
  babyId: string;
}

type PhaseProgressLookup = Record<string, PhaseCardProps['progress']>;

export function DevelopmentalPhasesCarousel({
  babyId,
}: DevelopmentalPhasesCarouselProps) {
  const baby = useDashboardDataStore.use.baby();
  const hasTrackedView = useRef(false);
  const { data, isLoading } = api.developmentalPhases.getPhasesForBaby.useQuery(
    { babyId },
    {
      staleTime: 1000 * 60 * 10,
    },
  );

  const progressByPhase = useMemo<PhaseProgressLookup>(() => {
    const map: PhaseProgressLookup = {};
    for (const entry of data?.progress ?? []) {
      const existing = map[entry.phaseId] ?? {};
      existing[entry.subPhaseType] = {
        checklistItems: entry.checklistItems ?? [],
        completedAt: entry.completedAt ? new Date(entry.completedAt) : null,
      };
      map[entry.phaseId] = existing;
    }
    return map;
  }, [data?.progress]);

  const ageInDays =
    data?.ageInDays ??
    (() => {
      if (!baby?.birthDate) return 0;
      const diff = Date.now() - new Date(baby.birthDate).getTime();
      return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
    })();

  // Track carousel view
  useEffect(() => {
    if (!hasTrackedView.current && data && !isLoading) {
      posthog.capture(
        buildDashboardEvent(
          DASHBOARD_COMPONENT.DEVELOPMENTAL_PHASES_CAROUSEL,
          DASHBOARD_ACTION.VIEW,
        ),
        {
          baby_id: babyId,
          phase_count: DEVELOPMENTAL_PHASES.length,
        },
      );
      hasTrackedView.current = true;
    }
  }, [data, isLoading, babyId]);

  if (isLoading && !data) {
    return <DevelopmentalPhasesSkeleton />;
  }

  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <Sparkles className="size-5 text-primary" />
        <H2 className="text-xl">Developmental phases</H2>
        <P className="ml-auto text-xs text-muted-foreground">Day {ageInDays}</P>
      </div>

      <div className="scrollbar-hide -mx-4 flex gap-6 overflow-x-auto px-4 pb-4">
        {DEVELOPMENTAL_PHASES.map((phase) => (
          <PhaseCard
            ageInDays={ageInDays}
            babyId={babyId}
            key={phase.id}
            phase={phase}
            progress={progressByPhase[phase.id] ?? {}}
          />
        ))}
      </div>

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
