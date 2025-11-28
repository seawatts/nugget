'use client';

/**
 * Sleep Mode Selector
 * Handles selection between timer tracking and manual entry
 * and routes to the appropriate flow
 */

import type { Activities } from '@nugget/db/schema';
import { useMemo } from 'react';
import { SleepDrawerContent } from './sleep-drawer';
import { SleepTimelineEntry } from './timeline-entry/sleep-timeline-entry';

type SleepMode = 'timer' | 'timeline' | null;

interface SleepModeSelectorProps {
  existingActivity?: typeof Activities.$inferSelect | null;
  selectedMode?: SleepMode;
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

export function SleepModeSelector({
  existingActivity,
  selectedMode: externalSelectedMode,
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
  const selectedMode = useMemo<SleepMode>(() => {
    if (externalSelectedMode) return externalSelectedMode;
    if (existingActivity) return 'timeline';
    return 'timeline';
  }, [existingActivity, externalSelectedMode]);

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

  return null;
}
