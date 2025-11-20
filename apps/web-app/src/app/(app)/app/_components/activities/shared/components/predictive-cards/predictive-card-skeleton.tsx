'use client';

import { Card } from '@nugget/ui/card';
import { Skeleton } from '@nugget/ui/components/skeleton';
import { cn } from '@nugget/ui/lib/utils';
import type { ActivityType } from '../../activity-theme-config';
import { getActivityTheme } from '../../activity-theme-config';

interface PredictiveCardSkeletonProps {
  activityType: ActivityType;
}

export function PredictiveCardSkeleton({
  activityType,
}: PredictiveCardSkeletonProps) {
  const theme = getActivityTheme(activityType);
  const Icon = theme.icon;

  return (
    <Card
      className={cn(
        'relative overflow-hidden p-6 col-span-2',
        `bg-${theme.color} ${theme.textColor}`,
        'border-0',
      )}
    >
      <div className="flex items-start gap-4">
        <div className="opacity-30">
          <Icon className="h-12 w-12" strokeWidth={1.5} />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-2xl font-bold">{theme.label}</h2>
          </div>
          <div className="space-y-1">
            <Skeleton className="h-6 w-48 bg-white/20" />
            <Skeleton className="h-4 w-32 bg-white/20" />
          </div>
        </div>
      </div>
    </Card>
  );
}
