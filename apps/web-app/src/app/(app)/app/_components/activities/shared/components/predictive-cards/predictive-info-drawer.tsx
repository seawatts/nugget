'use client';

import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@nugget/ui/drawer';
import type { LucideIcon } from 'lucide-react';
import { convertLearningContentUnits } from '../../../../learning/learning-content-utils';
import { LearningSection } from '../../../../learning/learning-section';
import { WhatsNextSection } from '../../../../learning/whats-next-section';
import type { LearningContent } from '../../../feeding/learning-content';
import {
  type ActivityType,
  getActivityTheme,
  type QuickLogActivityType,
} from '../../activity-theme-config';
import { PreferencesSection } from '../preferences-section';
import { QuickLogInfoSection } from '../quick-log-info-section';

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
  activityType: ActivityType;
  learningContent: LearningContent | null;
  babyAgeDays: number | null;
  averageInterval?: number | null;
  timeFormat?: '12h' | '24h';
  icon?: LucideIcon;
  quickLogSettings?: QuickLogSettings;
  calculationDetails?: CalculationDetails;
  unit?: 'ML' | 'OZ';
  babyId?: string;
  customPreferences?: import('@nugget/db').BabyCustomPreferences | null;
}

// Map activity types to their color classes for Tailwind
const ACTIVITY_COLOR_CLASSES: Partial<
  Record<
    ActivityType,
    {
      bgColor: string;
      borderColor: string;
      color: string;
    }
  >
> = {
  bath: {
    bgColor: 'bg-activity-bath/5',
    borderColor: 'border-activity-bath/20',
    color: 'bg-activity-bath/10 text-activity-bath',
  },
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
  nail_trimming: {
    bgColor: 'bg-activity-nail-trimming/5',
    borderColor: 'border-activity-nail-trimming/20',
    color: 'bg-activity-nail-trimming/10 text-activity-nail-trimming',
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
  vitamin_d: {
    bgColor: 'bg-activity-vitamin-d/5',
    borderColor: 'border-activity-vitamin-d/20',
    color: 'bg-activity-vitamin-d/10 text-activity-vitamin-d',
  },
};

export function PredictiveInfoDrawer({
  open,
  onOpenChange,
  title,
  activityType,
  learningContent,
  babyAgeDays,
  averageInterval,
  icon,
  quickLogSettings,
  calculationDetails,
  unit = 'OZ',
  babyId,
  customPreferences,
}: PredictiveInfoDrawerProps) {
  const theme = getActivityTheme(activityType);
  const Icon = icon || theme?.icon;
  const colorClasses = ACTIVITY_COLOR_CLASSES[activityType];

  // Convert learning content units based on user preference
  const convertedLearningContent = learningContent
    ? convertLearningContentUnits(learningContent, unit)
    : null;

  // Defensive check: if theme or colorClasses are undefined, log an error and return null
  if (!theme || !colorClasses) {
    console.error(
      `[PredictiveInfoDrawer] Invalid activityType: "${activityType}". Theme or color classes not found.`,
    );
    return null;
  }

  return (
    <Drawer onOpenChange={onOpenChange} open={open}>
      <DrawerContent className="max-h-[90vh] overflow-x-hidden">
        <DrawerHeader>
          <DrawerTitle>{title}</DrawerTitle>
        </DrawerHeader>
        <div className="px-4 pb-6 space-y-4 overflow-y-auto">
          {/* Learning Section */}
          {convertedLearningContent && (
            <LearningSection
              babyAgeDays={babyAgeDays}
              bgColor={colorClasses.bgColor}
              borderColor={colorClasses.borderColor}
              color={colorClasses.color}
              educationalContent={convertedLearningContent.message}
              icon={Icon}
              quickButtons={convertedLearningContent.quickButtons}
              tips={convertedLearningContent.tips}
            />
          )}

          {/* What's Next Section */}
          {convertedLearningContent?.whatsNext &&
            convertedLearningContent.whatsNext.length > 0 && (
              <WhatsNextSection
                babyAgeDays={babyAgeDays}
                bgColor={colorClasses.bgColor}
                borderColor={colorClasses.borderColor}
                color={colorClasses.color}
                icon={Icon}
                items={convertedLearningContent.whatsNext}
              />
            )}

          {/* Quick Log Info Section with Calculation Details */}
          {quickLogSettings && isQuickLogActivity(activityType) && (
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

          {/* Preferences Section for feeding and pumping */}
          {babyId &&
            (activityType === 'feeding' || activityType === 'pumping') && (
              <PreferencesSection
                activityType={activityType}
                babyId={babyId}
                bgColor={colorClasses.bgColor}
                borderColor={colorClasses.borderColor}
                color={colorClasses.color}
                currentPreferences={customPreferences}
                unit={unit}
              />
            )}

          {/* Average Interval */}
          {averageInterval !== null && averageInterval !== undefined && (
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

// Type guard to check if activity type supports quick logging
function isQuickLogActivity(
  activityType: ActivityType,
): activityType is QuickLogActivityType {
  return ['feeding', 'diaper', 'sleep', 'pumping', 'vitamin_d'].includes(
    activityType,
  );
}
