'use client';

import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@nugget/ui/drawer';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { formatTimeWithPreference } from '~/lib/format-time';
import { LearningSection } from '../../../../learning/learning-section';
import { getActivityTheme } from '../../activity-theme-config';
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
  formatPatternItem,
  quickLogSettings,
  calculationDetails,
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
              <div className="space-y-2">
                {recentPattern.slice(0, 5).map((item, index) => (
                  <div
                    className="flex items-center justify-between text-sm bg-muted/20 rounded px-3 py-2"
                    key={`${item.time.toISOString()}-${index}`}
                  >
                    {formatPatternItem ? (
                      formatPatternItem(item)
                    ) : (
                      <>
                        <span className="text-muted-foreground">
                          {formatTimeWithPreference(item.time, timeFormat)}
                        </span>
                        {'intervalFromPrevious' in item &&
                          typeof item.intervalFromPrevious === 'number' &&
                          item.intervalFromPrevious !== null && (
                            <span className="text-foreground/70 font-medium">
                              {item.intervalFromPrevious.toFixed(1)}h interval
                            </span>
                          )}
                      </>
                    )}
                  </div>
                ))}
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
