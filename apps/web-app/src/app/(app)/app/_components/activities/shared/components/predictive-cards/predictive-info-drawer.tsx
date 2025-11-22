'use client';

import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@nugget/ui/drawer';
import { differenceInMinutes, formatDistanceToNow } from 'date-fns';
import type { LucideIcon } from 'lucide-react';
import { Baby, Droplet, Droplets, Milk, Moon } from 'lucide-react';
import type { ReactNode } from 'react';
import { formatTimeWithPreference } from '~/lib/format-time';
import { LearningSection } from '../../../../learning/learning-section';
import { getActivityTheme } from '../../activity-theme-config';
import { getDisplayNotes } from '../../activity-utils';
import { formatVolumeDisplay } from '../../volume-utils';
import { QuickLogInfoSection } from '../quick-log-info-section';

interface LearningContent {
  message: string;
  tips: string[];
}

interface QuickLogSettings {
  enabled: boolean;
  activeSettings: string[];
}

interface CalculationDetails {
  ageBasedInterval: number; // hours
  recentAverageInterval: number | null; // hours
  lastInterval: number | null; // hours
  weights: {
    ageBased: number;
    recentAverage: number;
    lastInterval: number;
  };
  dataPoints: number;
}

interface PredictiveInfoDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  activityType: 'feeding' | 'diaper' | 'sleep' | 'pumping';
  learningContent: LearningContent | null;
  babyAgeDays: number | null;
  recentPattern: Array<{ time: Date; [key: string]: unknown }>;
  averageInterval: number | null;
  timeFormat: '12h' | '24h';
  icon?: LucideIcon;
  formatPatternItem?: (item: {
    time: Date;
    [key: string]: unknown;
  }) => ReactNode;
  quickLogSettings?: QuickLogSettings;
  calculationDetails?: CalculationDetails;
  unit?: 'ML' | 'OZ';
}

// Map activity types to their color classes for Tailwind
const ACTIVITY_COLOR_CLASSES: Record<
  'feeding' | 'diaper' | 'sleep' | 'pumping',
  {
    bgColor: string;
    borderColor: string;
    color: string;
  }
> = {
  diaper: {
    bgColor: 'bg-activity-diaper/5',
    borderColor: 'border-activity-diaper/20',
    color: 'bg-activity-diaper/10 text-activity-diaper',
  },
  feeding: {
    bgColor: 'bg-activity-feeding/5',
    borderColor: 'border-activity-feeding/20',
    color: 'bg-activity-feeding/10 text-activity-feeding',
  },
  pumping: {
    bgColor: 'bg-activity-pumping/5',
    borderColor: 'border-activity-pumping/20',
    color: 'bg-activity-pumping/10 text-activity-pumping',
  },
  sleep: {
    bgColor: 'bg-activity-sleep/5',
    borderColor: 'border-activity-sleep/20',
    color: 'bg-activity-sleep/10 text-activity-sleep',
  },
};

// Timeline-style activity colors
const activityColors: Record<string, string> = {
  bottle: 'border-l-activity-feeding',
  diaper: 'border-l-activity-diaper',
  nursing: 'border-l-activity-feeding',
  pumping: 'border-l-activity-pumping',
  sleep: 'border-l-activity-sleep',
  solids: 'border-l-activity-solids',
};

const activityIconColors: Record<string, string> = {
  bottle: 'text-activity-feeding',
  diaper: 'text-activity-diaper',
  nursing: 'text-activity-feeding',
  pumping: 'text-activity-pumping',
  sleep: 'text-activity-sleep',
  solids: 'text-activity-solids',
};

const activityIcons: Record<string, LucideIcon> = {
  bottle: Milk,
  diaper: Baby,
  nursing: Droplet,
  pumping: Droplets,
  sleep: Moon,
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

export function PredictiveInfoDrawer({
  open,
  onOpenChange,
  title,
  activityType,
  learningContent,
  babyAgeDays,
  recentPattern,
  averageInterval,
  timeFormat,
  icon,
  formatPatternItem: _formatPatternItem,
  quickLogSettings,
  calculationDetails,
  unit = 'ML',
}: PredictiveInfoDrawerProps) {
  const theme = getActivityTheme(activityType);
  const Icon = icon || theme.icon;
  const colorClasses = ACTIVITY_COLOR_CLASSES[activityType];

  return (
    <Drawer onOpenChange={onOpenChange} open={open}>
      <DrawerContent className="max-h-[90vh] overflow-x-hidden">
        <DrawerHeader>
          <DrawerTitle>{title}</DrawerTitle>
        </DrawerHeader>
        <div className="px-4 pb-6 space-y-4 overflow-y-auto">
          {/* Learning Section */}
          {learningContent && (
            <LearningSection
              babyAgeDays={babyAgeDays}
              bgColor={colorClasses.bgColor}
              borderColor={colorClasses.borderColor}
              color={colorClasses.color}
              educationalContent={learningContent.message}
              icon={Icon}
              tips={learningContent.tips}
            />
          )}

          {/* Quick Log Info Section with Calculation Details */}
          {quickLogSettings && (
            <QuickLogInfoSection
              activityType={activityType}
              bgColor={colorClasses.bgColor}
              borderColor={colorClasses.borderColor}
              calculationDetails={calculationDetails}
              color={colorClasses.color}
              enabledSettings={quickLogSettings.activeSettings}
              isQuickLogEnabled={quickLogSettings.enabled}
            />
          )}

          {/* Recent Pattern */}
          {recentPattern.length > 0 && (
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">
                Recent {title}s
              </p>
              <div className="space-y-0">
                {recentPattern.slice(0, 5).map((item, index) => {
                  const itemDate = item.time;
                  const absoluteTime = formatTimeWithPreference(
                    itemDate,
                    timeFormat,
                  );
                  const relativeTime = formatDistanceToNow(itemDate, {
                    addSuffix: true,
                  });

                  // Get icon and colors for this activity type
                  const Icon = icon || activityIcons[activityType] || Baby;
                  const colorClass =
                    activityColors[activityType] || 'border-l-primary';
                  const iconColorClass =
                    activityIconColors[activityType] || 'text-primary';

                  // Build details string
                  const details: string[] = [];
                  if (
                    'duration' in item &&
                    typeof item.duration === 'number' &&
                    item.duration
                  ) {
                    details.push(`${item.duration} min`);
                  }
                  if (
                    'amountMl' in item &&
                    typeof item.amountMl === 'number' &&
                    item.amountMl
                  ) {
                    details.push(
                      formatVolumeDisplay(item.amountMl, unit, true),
                    );
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
                    'notes' in item && typeof item.notes === 'string'
                      ? item.notes
                      : '';

                  // Calculate time gap from previous item
                  const previousItem =
                    index > 0 ? recentPattern[index - 1] : null;
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
          )}

          {/* Average Interval */}
          {averageInterval !== null && (
            <div className="flex items-center justify-between text-sm bg-muted/20 rounded px-3 py-2">
              <span className="text-muted-foreground">Average interval</span>
              <span className="text-foreground font-medium">
                {averageInterval.toFixed(1)} hours
              </span>
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
