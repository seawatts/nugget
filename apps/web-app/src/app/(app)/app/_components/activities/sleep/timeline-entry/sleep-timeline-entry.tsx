'use client';

/**
 * SleepTimelineEntry Component
 * Main component integrating timeline view with sleep form fields
 * Replaces manual entry mode with a timeline-based interface
 */

import { api } from '@nugget/api/react';
import type { Activities } from '@nugget/db/schema';
import { Avatar, AvatarFallback, AvatarImage } from '@nugget/ui/avatar';
import { Button } from '@nugget/ui/button';
import {
  ArrowLeft,
  Baby,
  BedDouble,
  Car,
  CloudRain,
  Flame,
  Moon,
  Music,
  Shield,
  Smile,
  Volume2,
} from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { TimeSelectionMode } from '../../shared/components/time-selection-mode';
import { SleepTimeline } from '../sleep-timeline';

interface SleepTimelineEntryProps {
  startTime: Date;
  setStartTime: (date: Date) => void;
  endTime?: Date;
  setEndTime?: (date: Date) => void;
  duration: number;
  setDuration: (duration: number) => void;
  sleepType: 'nap' | 'night';
  setSleepType: (type: 'nap' | 'night') => void;
  activeActivityId?: string | null;
  onBack?: () => void;
  existingActivity?: typeof Activities.$inferSelect | null;
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
  babyId: string;
}

export function SleepTimelineEntry({
  startTime,
  setStartTime,
  endTime: _endTime,
  setEndTime,
  duration,
  setDuration,
  sleepType,
  setSleepType,
  onBack,
  existingActivity,
  sleepQuality,
  setSleepQuality,
  sleepLocation,
  setSleepLocation,
  wakeReason,
  setWakeReason,
  isCoSleeping,
  setIsCoSleeping,
  coSleepingWith,
  setCoSleepingWith,
  currentUserId,
  familyMembers = [],
  babyId,
}: SleepTimelineEntryProps) {
  const { data: user } = api.user.current.useQuery();
  const timeFormat = user?.timeFormat ?? '12h';
  const [timeInputMode, setTimeInputMode] = useState<
    'now' | 'quick' | 'custom' | null
  >(null);

  // Calculate end time - prefer _endTime if provided, otherwise calculate from duration
  const endTime = useMemo(() => {
    if (_endTime) {
      return _endTime;
    }
    // Calculate from duration if no explicit endTime
    return new Date(startTime.getTime() + duration * 1000);
  }, [_endTime, startTime, duration]);

  // Wrapper handlers to update duration when times change
  const handleStartTimeChange = useCallback(
    (newStartTime: Date) => {
      setStartTime(newStartTime);
      // Update duration based on new start time
      const newDurationSeconds = Math.round(
        (endTime.getTime() - newStartTime.getTime()) / 1000,
      );
      if (newDurationSeconds > 0) {
        setDuration(newDurationSeconds);
      }
    },
    [endTime, setStartTime, setDuration],
  );

  const handleEndTimeChange = useCallback(
    (newEndTime: Date) => {
      if (setEndTime) {
        setEndTime(newEndTime);
      }
      // Update duration based on new end time
      const newDurationSeconds = Math.round(
        (newEndTime.getTime() - startTime.getTime()) / 1000,
      );
      if (newDurationSeconds > 0) {
        setDuration(newDurationSeconds);
      }
    },
    [startTime, setEndTime, setDuration],
  );

  // Handler for timeline duration clicks - sets custom mode and fills times
  const handleTimelineDurationClick = useCallback(
    (newStartTime: Date, newEndTime: Date) => {
      setTimeInputMode('custom');
      setStartTime(newStartTime);
      if (setEndTime) {
        setEndTime(newEndTime);
      }
      // Calculate duration
      const newDurationSeconds = Math.round(
        (newEndTime.getTime() - newStartTime.getTime()) / 1000,
      );
      if (newDurationSeconds > 0) {
        setDuration(newDurationSeconds);
      }
    },
    [setStartTime, setEndTime, setDuration],
  );

  const qualityOptions = [
    { icon: Smile, label: 'Peaceful', value: 'peaceful' as const },
    { icon: CloudRain, label: 'Restless', value: 'restless' as const },
    { icon: Flame, label: 'Fussy', value: 'fussy' as const },
    { icon: Volume2, label: 'Crying', value: 'crying' as const },
  ];

  const locationOptions = [
    { icon: Baby, label: 'Crib', value: 'crib' as const },
    { icon: Baby, label: 'Bassinet', value: 'bassinet' as const },
    { icon: BedDouble, label: 'Bed', value: 'bed' as const },
    { icon: Car, label: 'Car Seat', value: 'car_seat' as const },
    { icon: Baby, label: 'Stroller', value: 'stroller' as const },
    { icon: Shield, label: 'Arms', value: 'arms' as const },
    { icon: Music, label: 'Swing', value: 'swing' as const },
    { icon: Music, label: 'Bouncer', value: 'bouncer' as const },
  ];

  const wakeReasonOptions = [
    { label: 'Hungry', value: 'hungry' as const },
    { label: 'Diaper', value: 'diaper' as const },
    { label: 'Crying', value: 'crying' as const },
    { label: 'Naturally', value: 'naturally' as const },
    { label: 'Noise', value: 'noise' as const },
    { label: 'Unknown', value: 'unknown' as const },
  ];

  return (
    <div className="space-y-6">
      {/* Back Button */}
      {onBack && !existingActivity && (
        <Button
          className="w-full h-12 text-base bg-transparent"
          onClick={onBack}
          variant="outline"
        >
          <ArrowLeft className="mr-2 h-5 w-5" />
          Back to Sleep Options
        </Button>
      )}

      {/* Timeline View */}
      <SleepTimeline
        babyId={babyId}
        endTime={endTime}
        onDurationClick={handleTimelineDurationClick}
        setEndTime={handleEndTimeChange}
        setStartTime={handleStartTimeChange}
        startTime={startTime}
        timeFormat={timeFormat}
      />

      {/* Time Selection Mode */}
      <TimeSelectionMode
        activityColor="bg-activity-sleep"
        activityTextColor="text-activity-sleep-foreground"
        duration={duration}
        endTime={endTime}
        externalMode={timeInputMode}
        onModeChange={setTimeInputMode}
        quickDurationOptions={[
          { label: '30 min', seconds: 30 * 60 },
          { label: '1 hour', seconds: 60 * 60 },
          { label: '1h 30m', seconds: 90 * 60 },
          { label: '2 hours', seconds: 120 * 60 },
        ]}
        setDuration={setDuration}
        setEndTime={setEndTime}
        setStartTime={handleStartTimeChange}
        startTime={startTime}
        timeFormat={timeFormat}
      />

      {/* Sleep Type */}
      <div className="space-y-3">
        <p className="text-sm font-medium text-muted-foreground">Sleep Type</p>
        <div className="grid grid-cols-2 gap-3">
          <Button
            className={`h-12 ${
              sleepType === 'nap'
                ? 'bg-activity-sleep text-activity-sleep-foreground'
                : 'bg-transparent'
            }`}
            onClick={() => setSleepType('nap')}
            variant={sleepType === 'nap' ? 'default' : 'outline'}
          >
            <Moon className="mr-2 h-4 w-4" />
            Nap
          </Button>
          <Button
            className={`h-12 ${
              sleepType === 'night'
                ? 'bg-activity-sleep text-activity-sleep-foreground'
                : 'bg-transparent'
            }`}
            onClick={() => setSleepType('night')}
            variant={sleepType === 'night' ? 'default' : 'outline'}
          >
            <Moon className="mr-2 h-4 w-4" />
            Night Sleep
          </Button>
        </div>
      </div>

      {/* Co-sleeping */}
      <div className="space-y-3">
        <p className="text-sm font-medium text-muted-foreground">
          Co-sleeping (optional)
        </p>
        <Button
          className={`h-12 w-full ${
            isCoSleeping
              ? 'bg-activity-sleep text-activity-sleep-foreground'
              : 'bg-transparent'
          }`}
          onClick={() => {
            const newValue = !isCoSleeping;
            setIsCoSleeping?.(newValue);
            if (newValue && currentUserId && setCoSleepingWith) {
              setCoSleepingWith([currentUserId]);
            } else if (!newValue && setCoSleepingWith) {
              setCoSleepingWith([]);
            }
          }}
          variant={isCoSleeping ? 'default' : 'outline'}
        >
          <BedDouble className="mr-2 h-4 w-4" />
          Co-sleeping
        </Button>

        {/* Family member selection */}
        {isCoSleeping && familyMembers.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Who is co-sleeping?</p>
            <div className="grid grid-cols-2 gap-2">
              {familyMembers.map((member) => (
                <Button
                  className={`h-12 justify-start ${
                    coSleepingWith?.includes(member.userId)
                      ? 'bg-activity-sleep text-activity-sleep-foreground'
                      : 'bg-transparent'
                  }`}
                  key={member.userId}
                  onClick={() => {
                    if (!setCoSleepingWith) return;
                    if (coSleepingWith?.includes(member.userId)) {
                      setCoSleepingWith(
                        coSleepingWith.filter((id) => id !== member.userId),
                      );
                    } else {
                      setCoSleepingWith([
                        ...(coSleepingWith || []),
                        member.userId,
                      ]);
                    }
                  }}
                  variant={
                    coSleepingWith?.includes(member.userId)
                      ? 'default'
                      : 'outline'
                  }
                >
                  <Avatar className="size-6 mr-2">
                    <AvatarImage
                      alt={member.name}
                      src={member.avatarUrl || undefined}
                    />
                    <AvatarFallback className="text-xs">
                      {member.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .toUpperCase()
                        .slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="truncate">{member.name}</span>
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Sleep Quality */}
      <div className="space-y-3">
        <p className="text-sm font-medium text-muted-foreground">
          Sleep Quality (optional)
        </p>
        <div className="grid grid-cols-2 gap-3">
          {qualityOptions.map((option) => {
            const Icon = option.icon;
            return (
              <Button
                className={`h-12 ${
                  sleepQuality === option.value
                    ? 'bg-activity-sleep text-activity-sleep-foreground'
                    : 'bg-transparent'
                }`}
                key={option.value}
                onClick={() => setSleepQuality?.(option.value)}
                variant={sleepQuality === option.value ? 'default' : 'outline'}
              >
                <Icon className="mr-2 h-4 w-4" />
                {option.label}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Sleep Location */}
      <div className="space-y-3">
        <p className="text-sm font-medium text-muted-foreground">
          Sleep Location (optional)
        </p>
        <div className="grid grid-cols-2 gap-3">
          {locationOptions.map((option) => {
            const Icon = option.icon;
            return (
              <Button
                className={`h-12 ${
                  sleepLocation === option.value
                    ? 'bg-activity-sleep text-activity-sleep-foreground'
                    : 'bg-transparent'
                }`}
                key={option.value}
                onClick={() => setSleepLocation?.(option.value)}
                variant={sleepLocation === option.value ? 'default' : 'outline'}
              >
                <Icon className="mr-2 h-4 w-4" />
                {option.label}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Wake Reason */}
      <div className="space-y-3">
        <p className="text-sm font-medium text-muted-foreground">
          Wake Reason (optional)
        </p>
        <div className="grid grid-cols-2 gap-3">
          {wakeReasonOptions.map((option) => (
            <Button
              className={`h-12 ${
                wakeReason === option.value
                  ? 'bg-activity-sleep text-activity-sleep-foreground'
                  : 'bg-transparent'
              }`}
              key={option.value}
              onClick={() => setWakeReason?.(option.value)}
              variant={wakeReason === option.value ? 'default' : 'outline'}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
