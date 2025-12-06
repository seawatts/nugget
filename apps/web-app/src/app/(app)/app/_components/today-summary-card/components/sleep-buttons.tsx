'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@nugget/ui/avatar';
import { Button } from '@nugget/ui/button';
import { Skeleton } from '@nugget/ui/components/skeleton';
import { Icons } from '@nugget/ui/custom/icons';
import { cn } from '@nugget/ui/lib/utils';
import type { LucideIcon } from 'lucide-react';
import { Moon, StopCircle } from 'lucide-react';
import type { LastActivityInfo } from '../today-summary-card.types';
import { formatElapsedTime } from '../today-summary-card.utils';

interface SleepButtonsProps {
  isTimerActive: boolean;
  isCreating: boolean;
  disabled: boolean;
  sleepDurationMinutes: number;
  sleepIsLoading: boolean;
  lastSleepInfo: LastActivityInfo;
  sleepThemeTextColor: string;
  SleepIcon: LucideIcon;
  onTimerClick: () => void;
  onManualClick: () => void;
}

export function SleepButtons({
  isTimerActive,
  isCreating,
  disabled,
  sleepDurationMinutes,
  sleepIsLoading,
  lastSleepInfo,
  sleepThemeTextColor,
  SleepIcon,
  onTimerClick,
  onManualClick,
}: SleepButtonsProps) {
  const { time, exactTime, user } = lastSleepInfo;

  return (
    <div className="col-span-2 md:col-span-3 grid grid-cols-2 gap-2">
      {/* Timer Button */}
      <Button
        className={cn(
          'flex flex-col items-center justify-center h-auto py-3 gap-1',
          isTimerActive
            ? 'bg-destructive/90 hover:bg-destructive active:bg-destructive text-destructive-foreground'
            : 'bg-white/20 hover:bg-white/30 active:bg-white/40',
          isTimerActive ? '' : sleepThemeTextColor,
        )}
        disabled={disabled}
        onClick={onTimerClick}
        variant="ghost"
      >
        {isCreating ? (
          <Icons.Spinner className="size-5" />
        ) : isTimerActive ? (
          <StopCircle className="size-5" />
        ) : (
          <Moon className="size-5" />
        )}
        <span className="text-xs font-medium">
          {isTimerActive ? 'Stop Timer' : 'Start Timer'}
        </span>
        {isTimerActive && sleepDurationMinutes > 0 ? (
          <span className="text-xs opacity-80">
            {formatElapsedTime(sleepDurationMinutes)}
          </span>
        ) : sleepIsLoading && !time ? (
          <Skeleton className="h-3 w-16 mx-auto" />
        ) : time && exactTime ? (
          <div className="flex items-center gap-1 text-xs opacity-70 leading-tight">
            <span>{time}</span>
            {user && (
              <Avatar className="size-4 shrink-0">
                <AvatarImage alt={user.name} src={user.avatar || ''} />
                <AvatarFallback className="text-[8px]">
                  {user.initials}
                </AvatarFallback>
              </Avatar>
            )}
          </div>
        ) : null}
      </Button>

      {/* Manual Sleep Button */}
      <Button
        className={cn(
          'flex flex-col items-center justify-center h-auto py-3 gap-1',
          'bg-white/20 hover:bg-white/30 active:bg-white/40',
          sleepThemeTextColor,
        )}
        disabled={disabled}
        onClick={onManualClick}
        variant="ghost"
      >
        <SleepIcon className="size-5" />
        <span className="text-xs font-medium">Log Sleep</span>
        <span className="text-xs opacity-70 leading-tight">Manual entry</span>
      </Button>
    </div>
  );
}
