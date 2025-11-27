'use client';

/**
 * Sleep Mode Selector
 * Handles selection between timer tracking and manual entry
 * and routes to the appropriate flow
 */

import type { Activities } from '@nugget/db/schema';
import { cn } from '@nugget/ui/lib/utils';
import { LayoutList, Loader2, Timer } from 'lucide-react';
import { useEffect, useState } from 'react';
import { SleepDrawerContent } from './sleep-drawer';
import { SleepTimelineEntry } from './timeline-entry/sleep-timeline-entry';

type SleepMode = 'timer' | 'timeline' | null;

interface SleepModeSelectorProps {
  onModeSelect?: (mode: SleepMode) => void;
  existingActivity?: typeof Activities.$inferSelect | null;
  selectedMode?: SleepMode;
  isLoading?: boolean;
  // Pass through all SleepDrawerContent props
  startTime: Date;
  setStartTime: (date: Date) => void;
  endTime?: Date;
  setEndTime?: (date: Date) => void;
  duration: number;
  setDuration: (duration: number) => void;
  sleepType: 'nap' | 'night';
  setSleepType: (type: 'nap' | 'night') => void;
  activeActivityId?: string | null;
  onTimerStart?: () => Promise<void>;
  isTimerStopped?: boolean;
  isManualEndTime?: boolean;
  sleepQuality?: 'peaceful' | 'restless' | 'fussy' | 'crying';
  setSleepQuality: (
    quality: 'peaceful' | 'restless' | 'fussy' | 'crying',
  ) => void;
  sleepLocation?:
    | 'crib'
    | 'bassinet'
    | 'bed'
    | 'car_seat'
    | 'stroller'
    | 'arms'
    | 'swing'
    | 'bouncer';
  setSleepLocation: (
    location:
      | 'crib'
      | 'bassinet'
      | 'bed'
      | 'car_seat'
      | 'stroller'
      | 'arms'
      | 'swing'
      | 'bouncer',
  ) => void;
  wakeReason?:
    | 'hungry'
    | 'diaper'
    | 'crying'
    | 'naturally'
    | 'noise'
    | 'unknown';
  setWakeReason: (
    reason: 'hungry' | 'diaper' | 'crying' | 'naturally' | 'noise' | 'unknown',
  ) => void;
  isCoSleeping?: boolean;
  setIsCoSleeping: (value: boolean) => void;
  coSleepingWith?: string[];
  setCoSleepingWith: (value: string[]) => void;
  currentUserId?: string;
  familyMembers?: Array<{
    id: string;
    name: string;
    avatarUrl?: string | null;
    userId: string;
  }>;
  babyId?: string;
}

const sleepModes = [
  {
    color: 'bg-activity-sleep',
    description: 'Start and stop tracking',
    icon: Timer,
    id: 'timer' as const,
    label: 'Timer',
    textColor: 'text-activity-sleep-foreground',
  },
  {
    color: 'bg-activity-sleep',
    description: 'Select time on timeline',
    icon: LayoutList,
    id: 'timeline' as const,
    label: 'Timeline Entry',
    textColor: 'text-activity-sleep-foreground',
  },
];

export function SleepModeSelector({
  onModeSelect,
  existingActivity,
  selectedMode: externalSelectedMode,
  isLoading = false,
  startTime,
  setStartTime,
  endTime,
  setEndTime,
  duration,
  setDuration,
  sleepType,
  setSleepType,
  activeActivityId,
  onTimerStart,
  isTimerStopped = false,
  isManualEndTime = false,
  sleepQuality,
  setSleepQuality,
  sleepLocation,
  setSleepLocation,
  wakeReason,
  setWakeReason,
  isCoSleeping,
  setIsCoSleeping,
  coSleepingWith = [],
  setCoSleepingWith,
  currentUserId,
  familyMembers = [],
  babyId,
}: SleepModeSelectorProps) {
  const [selectedMode, setSelectedMode] = useState<SleepMode>(
    externalSelectedMode ?? null,
  );

  // If editing an existing activity, skip selection
  useEffect(() => {
    if (existingActivity) {
      setSelectedMode('timeline');
    } else if (externalSelectedMode) {
      setSelectedMode(externalSelectedMode);
    } else {
      // Reset selection when existingActivity becomes null
      setSelectedMode(null);
    }
  }, [existingActivity, externalSelectedMode]);

  const handleModeSelect = (mode: SleepMode) => {
    setSelectedMode(mode);
    onModeSelect?.(mode);
  };

  const handleBack = () => {
    // Don't allow going back if editing an existing activity
    if (existingActivity) return;
    setSelectedMode(null);
    onModeSelect?.(null);
  };

  // If a mode is selected, show the sleep content
  if (selectedMode) {
    // Timeline mode - render timeline entry component
    if (selectedMode === 'timeline' && babyId) {
      return (
        <SleepTimelineEntry
          activeActivityId={activeActivityId}
          babyId={babyId}
          coSleepingWith={coSleepingWith}
          currentUserId={currentUserId}
          duration={duration}
          endTime={endTime}
          existingActivity={existingActivity}
          familyMembers={familyMembers}
          isCoSleeping={isCoSleeping}
          onBack={!existingActivity ? handleBack : undefined}
          setCoSleepingWith={setCoSleepingWith}
          setDuration={setDuration}
          setEndTime={setEndTime}
          setIsCoSleeping={setIsCoSleeping}
          setSleepLocation={setSleepLocation}
          setSleepQuality={setSleepQuality}
          setSleepType={setSleepType}
          setStartTime={setStartTime}
          setWakeReason={setWakeReason}
          sleepLocation={sleepLocation}
          sleepQuality={sleepQuality}
          sleepType={sleepType}
          startTime={startTime}
          wakeReason={wakeReason}
        />
      );
    }

    // Timer mode - render sleep drawer content
    return (
      <div className="space-y-6">
        <SleepDrawerContent
          activeActivityId={activeActivityId}
          coSleepingWith={coSleepingWith}
          currentUserId={currentUserId}
          duration={duration}
          endTime={endTime}
          existingActivity={existingActivity}
          familyMembers={familyMembers}
          isCoSleeping={isCoSleeping}
          isManualEndTime={isManualEndTime}
          isTimerStopped={isTimerStopped}
          mode={selectedMode}
          onBack={!existingActivity ? handleBack : undefined}
          onTimerStart={onTimerStart}
          setCoSleepingWith={setCoSleepingWith}
          setDuration={setDuration}
          setEndTime={setEndTime}
          setIsCoSleeping={setIsCoSleeping}
          setSleepLocation={setSleepLocation}
          setSleepQuality={setSleepQuality}
          setSleepType={setSleepType}
          setStartTime={setStartTime}
          setWakeReason={setWakeReason}
          sleepLocation={sleepLocation}
          sleepQuality={sleepQuality}
          sleepType={sleepType}
          startTime={startTime}
          wakeReason={wakeReason}
        />
      </div>
    );
  }

  // Selection screen
  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-foreground mb-2">
          How would you like to track sleep?
        </h3>
        <p className="text-sm text-muted-foreground">
          Choose timer for live tracking or timeline entry
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {sleepModes.map((mode) => {
          const isTimerMode = mode.id === 'timer';
          const Icon = isTimerMode && isLoading ? Loader2 : mode.icon;
          const isDisabled = isTimerMode && isLoading;

          return (
            <button
              className={cn(
                'p-4 rounded-xl border-2 border-transparent transition-all',
                mode.color,
                'hover:scale-[1.02] active:scale-[0.98]',
                isDisabled &&
                  'opacity-50 cursor-not-allowed hover:scale-100 active:scale-100',
              )}
              disabled={isDisabled}
              key={mode.id}
              onClick={() => handleModeSelect(mode.id)}
              type="button"
            >
              <Icon
                className={cn(
                  'h-8 w-8 mx-auto mb-2',
                  mode.textColor,
                  isTimerMode && isLoading && 'animate-spin',
                )}
              />
              <p className={cn('font-semibold text-sm mb-1', mode.textColor)}>
                {mode.label}
              </p>
              <p className={cn('text-xs opacity-80', mode.textColor)}>
                {mode.description}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
