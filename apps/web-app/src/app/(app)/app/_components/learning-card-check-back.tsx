'use client';

import type { Baby } from '@nugget/db/schema';
import { Button } from '@nugget/ui/button';
import { H3, P } from '@nugget/ui/custom/typography';
import { differenceInDays } from 'date-fns';
import { Calendar, Sparkles } from 'lucide-react';

interface LearningCardCheckBackProps {
  baby: Baby;
  nextUpdateAge?: number;
}

export function LearningCardCheckBack({
  baby,
  nextUpdateAge,
}: LearningCardCheckBackProps) {
  // Construct baby's full name
  const babyName = [baby.firstName].filter(Boolean).join(' ');

  // Calculate current age in days
  const currentAgeInDays = baby.birthDate
    ? differenceInDays(new Date(), baby.birthDate)
    : 0;

  // Calculate next milestone (weekly updates)
  const daysUntilNext = nextUpdateAge
    ? nextUpdateAge - currentAgeInDays
    : 7 - (currentAgeInDays % 7);

  return (
    <div className="min-w-[280px] h-[440px] snap-start rounded-lg border border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 overflow-hidden flex flex-col">
      <div className="flex items-center justify-center gap-3 p-6 bg-primary/10">
        <Sparkles className="size-8 text-primary" />
      </div>

      <div className="p-6 space-y-4 flex-1 flex flex-col items-center justify-center text-center">
        <H3 className="text-lg">More tips coming soon!</H3>

        <div className="space-y-3">
          <P className="text-sm text-muted-foreground">
            Come back for more tips when{' '}
            <span className="font-bold text-primary">{babyName}'s</span>{' '}
            <span className="font-semibold text-foreground">
              {currentAgeInDays + daysUntilNext} days old
            </span>
          </P>

          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground pt-1">
            <Calendar className="size-4" />
            <span>
              {daysUntilNext === 1
                ? 'New tips tomorrow'
                : `New tips in ${daysUntilNext} days`}
            </span>
          </div>
        </div>

        <div className="pt-4 w-full">
          <Button className="w-full" disabled size="sm" variant="outline">
            <Sparkles className="mr-2 size-4" />
            Unlock soon
          </Button>
        </div>
      </div>
    </div>
  );
}
