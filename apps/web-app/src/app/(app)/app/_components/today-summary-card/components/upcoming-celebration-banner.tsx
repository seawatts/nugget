'use client';

import { Award } from 'lucide-react';
import type { UpcomingCelebration } from '../today-summary-card.types';

interface UpcomingCelebrationBannerProps {
  celebration: UpcomingCelebration;
}

export function UpcomingCelebrationBanner({
  celebration,
}: UpcomingCelebrationBannerProps) {
  const { babyLabel, daysUntil, title } = celebration;

  const getMessage = () => {
    if (daysUntil === 0) {
      return `Today is ${babyLabel}'s ${title}!`;
    }
    if (daysUntil === 1) {
      return `1 day to ${babyLabel}'s ${title}!`;
    }
    return `${daysUntil} days to ${babyLabel}'s ${title}!`;
  };

  return (
    <div className="mt-3 flex items-start gap-3 rounded-xl border border-white/20 bg-white/10 px-5 py-4 text-sm text-foreground/90">
      <div className="shrink-0 rounded-full bg-white/20 p-2 text-activity-feeding">
        <Award className="size-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground">{getMessage()}</p>
        <p className="text-xs text-foreground/80 leading-snug">
          Come back then to see the celebration.
        </p>
      </div>
    </div>
  );
}
