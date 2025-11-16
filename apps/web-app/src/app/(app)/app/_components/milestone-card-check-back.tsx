'use client';

import { Button } from '@nugget/ui/button';
import { H3, P } from '@nugget/ui/custom/typography';
import { Award, Calendar } from 'lucide-react';

interface MilestoneCardCheckBackProps {
  baby: {
    firstName: string;
  };
  nextMilestoneDay?: number;
  currentAgeInDays: number;
}

export function MilestoneCardCheckBack({
  baby,
  nextMilestoneDay,
  currentAgeInDays,
}: MilestoneCardCheckBackProps) {
  // Construct baby's full name
  const babyName = [baby.firstName].filter(Boolean).join(' ');

  // Calculate days until next milestone
  const daysUntilNext = nextMilestoneDay
    ? nextMilestoneDay - currentAgeInDays
    : 7; // Default to 7 days if no specific milestone is found

  return (
    <div className="min-w-[280px] h-[560px] snap-start rounded-lg border border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 overflow-hidden flex flex-col">
      <div className="flex items-center justify-center gap-3 p-6 bg-primary/10">
        <Award className="size-8 text-primary" />
      </div>

      <div className="p-6 space-y-4 flex-1 flex flex-col items-center justify-center text-center">
        <H3 className="text-lg">More milestones coming soon!</H3>

        <div className="space-y-3">
          <P className="text-sm text-muted-foreground">
            Check back when{' '}
            <span className="font-bold text-primary">{babyName}</span>{' '}
            <span className="font-semibold text-foreground">
              {nextMilestoneDay
                ? `is ${nextMilestoneDay} days old`
                : 'reaches the next milestone'}
            </span>
          </P>

          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground pt-1">
            <Calendar className="size-4" />
            <span>
              {daysUntilNext === 1
                ? 'New milestone tomorrow'
                : `New milestone in ${daysUntilNext} days`}
            </span>
          </div>
        </div>

        <div className="pt-4 w-full">
          <Button className="w-full" disabled size="sm" variant="outline">
            <Award className="mr-2 size-4" />
            Unlock soon
          </Button>
        </div>
      </div>
    </div>
  );
}
