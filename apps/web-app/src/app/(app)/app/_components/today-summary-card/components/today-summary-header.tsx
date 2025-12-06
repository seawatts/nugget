'use client';

import { Icons } from '@nugget/ui/custom/icons';
import { NuggetAvatar } from '@nugget/ui/custom/nugget-avatar';
import { BarChart3, Trophy } from 'lucide-react';
import Link from 'next/link';
import { LiveBabyAge } from './live-baby-age';

interface TodaySummaryHeaderProps {
  babyName?: string;
  babyPhotoUrl?: string | null;
  babyAvatarBackgroundColor?: string | null;
  babyBirthDate?: Date | null;
  isFetching: boolean;
  onStatsClick: () => void;
  onAchievementsClick: () => void;
}

export function TodaySummaryHeader({
  babyName,
  babyPhotoUrl,
  babyAvatarBackgroundColor,
  babyBirthDate,
  isFetching,
  onStatsClick,
  onAchievementsClick,
}: TodaySummaryHeaderProps) {
  return (
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center gap-2.5">
        <Link
          className="relative flex items-center justify-center size-9 rounded-full bg-linear-to-br from-primary to-primary/80 p-[2px] shadow-md shadow-primary/20 transition-transform hover:scale-105 active:scale-95 cursor-pointer"
          href="/app/settings/baby"
        >
          <div className="size-full rounded-full bg-card flex items-center justify-center p-0.5">
            <NuggetAvatar
              backgroundColor={babyAvatarBackgroundColor || undefined}
              image={
                !babyAvatarBackgroundColor && babyPhotoUrl
                  ? babyPhotoUrl
                  : undefined
              }
              name={babyName}
              size="sm"
            />
          </div>
        </Link>
        <div className="flex flex-col">
          <h2 className="text-lg font-semibold text-foreground leading-tight">
            {babyName ? `${babyName}'s Day` : "Today's Summary"}
          </h2>
          {babyBirthDate && (
            <span className="text-xs text-foreground/80 font-mono leading-tight">
              <LiveBabyAge birthDate={babyBirthDate} />
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3">
        {isFetching && (
          <Icons.Spinner className="animate-spin opacity-70" size="xs" />
        )}
        <button
          className="p-1.5 rounded-full hover:bg-white/10 transition-colors"
          onClick={onStatsClick}
          title="View statistics"
          type="button"
        >
          <BarChart3 className="size-5 opacity-70" />
        </button>
        <button
          className="p-1.5 rounded-full hover:bg-white/10 transition-colors"
          onClick={onAchievementsClick}
          title="View achievements"
          type="button"
        >
          <Trophy className="size-5 opacity-70" />
        </button>
      </div>
    </div>
  );
}
