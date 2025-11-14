'use client';

import { Card } from '@nugget/ui/card';
import { Icons } from '@nugget/ui/custom/icons';
import { cn } from '@nugget/ui/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface ActivityCardProps {
  activity: {
    color: string;
    fullWidth: boolean;
    icon: LucideIcon;
    id: string;
    label: string;
    textColor: string;
  };
  isLoading?: boolean;
  onClick: () => void;
}

export function ActivityCard({
  activity,
  isLoading = false,
  onClick,
}: ActivityCardProps) {
  const Icon = activity.icon;

  return (
    <Card
      className={cn(
        'relative overflow-hidden border-0 p-6 transition-transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer',
        activity.color,
        activity.fullWidth && 'col-span-2',
        isLoading && 'opacity-70 pointer-events-none',
      )}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={cn('opacity-30', activity.textColor)}>
            {isLoading ? (
              <Icons.Spinner className="h-12 w-12 animate-spin" />
            ) : (
              <Icon className="h-12 w-12" strokeWidth={1.5} />
            )}
          </div>
          <h2 className={cn('text-2xl font-bold', activity.textColor)}>
            {activity.label}
          </h2>
        </div>
      </div>
    </Card>
  );
}
