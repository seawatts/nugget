'use client';

import { differenceInMinutes } from 'date-fns';
import type { LucideIcon } from 'lucide-react';
import {
  Baby,
  Bath,
  Droplet,
  Droplets,
  Milk,
  Moon,
  Scissors,
  SunDim,
} from 'lucide-react';
import { formatTimeWithPreference } from '~/lib/format-time';
import { getDisplayNotes } from '../../activity-utils';
import { formatCompactRelativeTime } from '../../utils/format-compact-relative-time';
import { formatVolumeDisplay } from '../../volume-utils';

interface RecentActivity {
  time: Date;
  duration?: number;
  amountMl?: number;
  type?: 'wet' | 'dirty' | 'both';
  notes?: string;
  [key: string]: unknown;
}

interface RecentActivitiesListProps {
  activities: RecentActivity[];
  activityType:
    | 'feeding'
    | 'diaper'
    | 'sleep'
    | 'pumping'
    | 'vitamin_d'
    | 'nail_trimming'
    | 'bath';
  timeFormat: '12h' | '24h';
  unit?: 'ML' | 'OZ';
  icon?: LucideIcon;
  title: string;
}

// Timeline-style activity colors
const activityColors: Record<string, string> = {
  bath: 'border-l-activity-bath',
  bottle: 'border-l-activity-feeding',
  diaper: 'border-l-activity-diaper',
  feeding: 'border-l-activity-feeding',
  nail_trimming: 'border-l-activity-nail-trimming',
  nursing: 'border-l-activity-feeding',
  pumping: 'border-l-activity-pumping',
  sleep: 'border-l-activity-sleep',
  solids: 'border-l-activity-solids',
  vitamin_d: 'border-l-activity-vitamin-d',
};

const activityIconColors: Record<string, string> = {
  bath: 'text-activity-bath',
  bottle: 'text-activity-feeding',
  diaper: 'text-activity-diaper',
  feeding: 'text-activity-feeding',
  nail_trimming: 'text-activity-nail-trimming',
  nursing: 'text-activity-feeding',
  pumping: 'text-activity-pumping',
  sleep: 'text-activity-sleep',
  solids: 'text-activity-solids',
  vitamin_d: 'text-activity-vitamin-d',
};

const activityIcons: Record<string, LucideIcon> = {
  bath: Bath,
  bottle: Milk,
  diaper: Baby,
  feeding: Milk,
  nail_trimming: Scissors,
  nursing: Droplet,
  pumping: Droplets,
  sleep: Moon,
  vitamin_d: SunDim,
};

function formatTimeGap(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min${minutes !== 1 ? 's' : ''}`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) {
    return `${hours} hour${hours !== 1 ? 's' : ''}`;
  }
  return `${hours}h ${remainingMinutes}m`;
}

export function RecentActivitiesList({
  activities,
  activityType,
  timeFormat,
  unit = 'ML',
  icon,
  title,
}: RecentActivitiesListProps) {
  if (activities.length === 0) {
    return null;
  }

  const Icon = icon || activityIcons[activityType] || Baby;
  const colorClass = activityColors[activityType] || 'border-l-primary';
  const iconColorClass = activityIconColors[activityType] || 'text-primary';

  return (
    <div>
      <p className="text-sm font-medium text-muted-foreground mb-2">
        Recent {title}s
      </p>
      <div className="space-y-0">
        {activities.slice(0, 5).map((item, index) => {
          const itemDate = item.time;
          const absoluteTime = formatTimeWithPreference(itemDate, timeFormat);
          const relativeTime = formatCompactRelativeTime(itemDate, {
            addSuffix: true,
          });

          // Build details string
          const details: string[] = [];
          if (
            'duration' in item &&
            typeof item.duration === 'number' &&
            item.duration
          ) {
            let durationText = `${item.duration} min`;
            // Add (L) or (R) indicator for nursing activities
            if (activityType === 'feeding') {
              // Check for side in details object or directly on item
              let side: 'left' | 'right' | 'both' | undefined;
              if (
                'details' in item &&
                item.details &&
                typeof item.details === 'object' &&
                'side' in item.details
              ) {
                side = (item.details as { side?: 'left' | 'right' | 'both' })
                  .side;
              } else if ('side' in item) {
                side = item.side as 'left' | 'right' | 'both' | undefined;
              }
              if (side && side !== 'both') {
                durationText += ` (${side === 'left' ? 'L' : 'R'})`;
              }
            }
            details.push(durationText);
          }
          if (
            'amountMl' in item &&
            typeof item.amountMl === 'number' &&
            item.amountMl
          ) {
            details.push(formatVolumeDisplay(item.amountMl, unit, true));
          }
          // For diaper, add type info
          if (activityType === 'diaper' && 'type' in item) {
            if (item.type === 'wet') {
              details.push('Pee');
            } else if (item.type === 'dirty') {
              details.push('Poop');
            } else if (item.type === 'both') {
              details.push('Both');
            }
          }
          const detailsText =
            details.length > 0 ? ` / ${details.join(', ')}` : '';

          // Get notes
          const itemNotes =
            'notes' in item && typeof item.notes === 'string' ? item.notes : '';

          // Calculate time gap from previous item
          const previousItem = index > 0 ? activities[index - 1] : null;
          const timeGapMinutes = previousItem
            ? differenceInMinutes(previousItem.time, itemDate)
            : 0;
          const showTimeGap = timeGapMinutes > 0;

          return (
            <div key={`${item.time.toISOString()}-${index}`}>
              {showTimeGap && (
                <div className="flex items-center gap-3 py-2">
                  <div className="h-px bg-border/50 flex-1" />
                  <span className="text-xs text-muted-foreground/60 font-medium">
                    {formatTimeGap(timeGapMinutes)}
                  </span>
                  <div className="h-px bg-border/50 flex-1" />
                </div>
              )}
              <div
                className={`flex items-start gap-3 p-3.5 rounded-xl bg-card/50 border-l-4 ${colorClass} opacity-60 w-full`}
              >
                <div className="shrink-0 p-2 rounded-lg bg-muted/40">
                  <Icon className={`size-4 ${iconColorClass}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0 flex items-center gap-2">
                      <h4 className="text-sm font-medium capitalize">
                        {title}
                        {detailsText && (
                          <span className="text-muted-foreground font-normal">
                            {detailsText}
                          </span>
                        )}
                      </h4>
                    </div>
                    <div className="flex flex-col items-end gap-0.5 shrink-0">
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {relativeTime}
                      </span>
                      <span className="text-xs text-muted-foreground/70 font-mono whitespace-nowrap">
                        {absoluteTime}
                      </span>
                    </div>
                  </div>
                  {getDisplayNotes(itemNotes) && (
                    <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed">
                      {getDisplayNotes(itemNotes)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
