'use client';

import { Button } from '@nugget/ui/button';
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
    <div className="relative overflow-hidden rounded-lg border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
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
        quantity={20}
        size={1.2}
        staticity={50}
      />

      {/* Confetti-like decorative elements */}
      <div className="absolute inset-0 pointer-events-none z-10">
        <div className="absolute top-4 left-4 size-3 rounded-full bg-primary/20 animate-pulse" />
        <div className="absolute top-8 right-8 size-2 rounded-full bg-secondary/30 animate-pulse delay-100" />
        <div className="absolute bottom-6 left-12 size-2.5 rounded-full bg-accent/20 animate-pulse delay-200" />
        <div className="absolute top-12 right-16 size-1.5 rounded-full bg-primary/30 animate-pulse delay-300" />
        <div className="absolute bottom-12 right-6 size-2 rounded-full bg-secondary/20 animate-pulse delay-150" />
        <Sparkles className="absolute top-6 right-12 size-5 text-primary/40 animate-pulse delay-75" />
        <Sparkles className="absolute bottom-8 left-8 size-4 text-secondary/40 animate-pulse delay-200" />
      </div>

      <div className="relative flex flex-col items-center justify-center gap-6 p-8 text-center z-20 min-h-[280px]">
        {/* Icon */}
        <div className="flex items-center justify-center rounded-full bg-primary/10 p-4">
          <Cake className="size-8 text-primary" />
        </div>

        {/* Title */}
        <H3 className="text-xl bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
          Celebration coming soon!
        </H3>

        {/* Message */}
        <div className="gap-3 grid">
          <P className="text-sm text-muted-foreground">
            Check back{' '}
            <span className="font-semibold text-foreground">
              {daysUntilNext === 1 ? 'tomorrow' : `in ${daysUntilNext} days`}
            </span>{' '}
            when <span className="font-bold text-primary">{babyName}</span>{' '}
            <span className="font-semibold text-foreground">
              {nextCelebrationTitle
                .toLowerCase()
                .replace(/[🎉🎂]/gu, '')
                .trim()}
            </span>
          </P>
        </div>

        {/* Button */}
        <div className="w-full pt-2">
          <Button className="w-full gap-2" disabled size="sm" variant="outline">
            <Cake className="size-4" />
            Unlock soon
          </Button>
        </div>
      </div>
    </div>
  );
}
