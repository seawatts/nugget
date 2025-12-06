'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@nugget/ui/avatar';
import { Button } from '@nugget/ui/button';
import { Skeleton } from '@nugget/ui/components/skeleton';
import { Icons } from '@nugget/ui/custom/icons';
import { cn } from '@nugget/ui/lib/utils';
import { Droplet, Droplets, Milk } from 'lucide-react';
import type {
  ActivityType,
  LastActivityInfo,
} from '../today-summary-card.types';

interface ActivityQuickButtonProps {
  type: ActivityType;
  isLoading: boolean;
  isCreating: boolean;
  disabled: boolean;
  lastActivityInfo: LastActivityInfo;
  onClick: () => void;
  themeTextColor: string;
}

const ACTIVITY_CONFIG: Record<
  ActivityType,
  { icon: React.ElementType; label: string }
> = {
  bottle: { icon: Milk, label: 'Bottle' },
  dirty: { icon: Droplets, label: 'Poop' },
  nursing: { icon: Droplet, label: 'Nursing' },
  wet: { icon: Droplet, label: 'Pee' },
};

export function ActivityQuickButton({
  type,
  isLoading,
  isCreating,
  disabled,
  lastActivityInfo,
  onClick,
  themeTextColor,
}: ActivityQuickButtonProps) {
  const config = ACTIVITY_CONFIG[type];
  const Icon = config.icon;
  const { time, exactTime, user } = lastActivityInfo;

  return (
    <Button
      className={cn(
        'flex flex-col items-center justify-center h-auto py-3 gap-1',
        'bg-white/20 hover:bg-white/30 active:bg-white/40',
        themeTextColor,
      )}
      disabled={disabled}
      onClick={onClick}
      variant="ghost"
    >
      {isCreating ? (
        <Icons.Spinner className="size-5" />
      ) : (
        <Icon className="size-5" />
      )}
      <span className="text-xs font-medium">{config.label}</span>
      {isLoading && !time ? (
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
  );
}
