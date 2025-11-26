'use client';

import { H3, P } from '@nugget/ui/custom/typography';
import { Particles } from '@nugget/ui/magicui/particles';
import { ShineBorder } from '@nugget/ui/magicui/shine-border';
import { Cake, Sparkles } from 'lucide-react';

interface CelebrationCardComingSoonProps {
  babyName: string;
  nextCelebrationDay: number;
  nextCelebrationTitle: string;
  currentAgeInDays: number;
}

export function CelebrationCardComingSoon({
  babyName,
  nextCelebrationDay,
  nextCelebrationTitle,
  currentAgeInDays,
}: CelebrationCardComingSoonProps) {
  // Calculate days until next celebration
  const daysUntilNext = nextCelebrationDay - currentAgeInDays;

  return (
    <div className="relative overflow-hidden rounded-lg border-2 border-primary/20 bg-linear-to-br from-primary/5 via-background to-secondary/5">
      {/* Animated shine border effect */}
      <ShineBorder
        borderWidth={2}
        className="z-0"
        duration={14}
        shineColor={['#ff006e', '#8338ec', '#3a86ff']}
      />

      {/* Particles background */}
      <Particles
        className="absolute inset-0 pointer-events-none z-0"
        color="#ff006e"
        ease={50}
        quantity={10}
        size={0.8}
        staticity={50}
      />

      {/* Confetti-like decorative elements */}
      <div className="absolute inset-0 pointer-events-none z-10">
        <div className="absolute top-2 left-2 size-1.5 rounded-full bg-primary/20 animate-pulse" />
        <div className="absolute top-2 right-2 size-1 rounded-full bg-secondary/30 animate-pulse delay-100" />
        <div className="absolute bottom-2 right-3 size-1 rounded-full bg-primary/30 animate-pulse delay-200" />
        <Sparkles className="absolute top-1.5 right-4 size-3 text-primary/40 animate-pulse delay-75" />
      </div>

      <div className="relative flex flex-row items-center justify-center gap-3 px-4 py-3 text-center z-20">
        {/* Icon */}
        <div className="flex items-center justify-center rounded-full bg-primary/10 p-1.5 shrink-0">
          <Cake className="size-4 text-primary" />
        </div>

        {/* Content */}
        <div className="flex flex-col items-center gap-1 flex-1 min-w-0">
          {/* Title */}
          <H3 className="text-sm font-semibold bg-linear-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
            Celebration coming soon!
          </H3>

          {/* Message */}
          <P className="text-xs text-muted-foreground leading-tight">
            Come back{' '}
            <span className="font-semibold text-foreground">
              {daysUntilNext === 1 ? 'tomorrow' : `in ${daysUntilNext} days`}
            </span>{' '}
            to celebrate{' '}
            <span className="font-bold text-primary">{babyName}'s</span>{' '}
            <span className="font-semibold text-foreground">
              {nextCelebrationTitle
                .toLowerCase()
                .replace(/[🎉🎂]/gu, '')
                .replace(/^happy\s+/i, '')
                .trim()}
            </span>
            !
          </P>
        </div>
      </div>
    </div>
  );
}
