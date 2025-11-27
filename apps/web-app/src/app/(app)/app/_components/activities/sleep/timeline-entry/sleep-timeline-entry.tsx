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
import { subHours } from 'date-fns';
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
import { useCallback, useMemo } from 'react';
import { calculateBabyAgeDays } from '../../shared/baby-age-utils';
import { TimelineView } from './timeline-view';
import {
  calculateSuggestedSleepDuration,
  calculateTimelineWindow,
  checkCollision,
  snapToInterval,
} from './utils/timeline-calculations';

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

  // Fetch baby info for birth date
  const { data: baby } = api.babies.getByIdLight.useQuery(
    { id: babyId },
    { enabled: Boolean(babyId) },
  );

  // Calculate baby age
  const babyAgeDays = useMemo(() => {
    if (!baby?.birthDate) return null;
    return calculateBabyAgeDays(new Date(baby.birthDate));
  }, [baby?.birthDate]);

  // Calculate timeline window (12 hours, centered on current time or selected time)
  const timelineWindow = useMemo(() => {
    if (existingActivity) {
      // If editing existing activity, center on that activity's time
      const activityTime = new Date(existingActivity.startTime);
      return calculateTimelineWindow(activityTime);
    }
    // Otherwise center on current time or selected start time
    return calculateTimelineWindow(startTime);
  }, [existingActivity, startTime]);

  // Fetch activities for the timeline window (expand window slightly to catch overlaps)
  const activitiesSince = useMemo(
    () => subHours(timelineWindow.startTime, 1),
    [timelineWindow.startTime],
  );

  const { data: allActivities = [] } = api.activities.list.useQuery(
    {
      babyId,
      limit: 200,
      since: activitiesSince,
    },
    { enabled: Boolean(babyId) },
  );

  // Calculate end time - prefer _endTime if provided, otherwise calculate from duration
  const endTime = useMemo(() => {
    if (_endTime) {
      return _endTime;
    }
    // Calculate from duration if no explicit endTime
    return new Date(startTime.getTime() + duration * 1000);
  }, [_endTime, startTime, duration]);

  // Handle clicking on empty space to create sleep entry
  const handleEmptySpaceClick = useCallback(
    (clickTime: Date) => {
      // Snap to 5-minute interval
      const snappedTime = snapToInterval(clickTime, 5);

      // Calculate suggested duration
      const recentSleeps = allActivities
        .filter((a) => a.type === 'sleep' && a.duration)
        .slice(0, 10)
        .map((a) => ({ duration: a.duration || null }));

      const suggestedDuration = calculateSuggestedSleepDuration(
        babyAgeDays,
        recentSleeps,
      );

      // Set start time to clicked time
      setStartTime(snappedTime);

      // Calculate end time
      const calculatedEndTime = new Date(
        snappedTime.getTime() + suggestedDuration * 60 * 1000,
      );
      if (setEndTime) {
        setEndTime(calculatedEndTime);
      }
      setDuration(suggestedDuration * 60); // Convert to seconds
    },
    [allActivities, babyAgeDays, setStartTime, setEndTime, setDuration],
  );

  // Handle sleep time changes from timeline
  const handleSleepTimeChange = useCallback(
    (newStart: Date, newEnd: Date) => {
      if (
        checkCollision(
          newStart,
          newEnd,
          allActivities,
          timelineWindow,
          existingActivity?.id,
        )
      ) {
        return;
      }
      // Set both times
      setStartTime(newStart);
      if (setEndTime) {
        setEndTime(newEnd);
      }
      // Calculate and set duration based on the new times
      const newDurationSeconds = Math.round(
        (newEnd.getTime() - newStart.getTime()) / 1000,
      );
      setDuration(newDurationSeconds);
    },
    [
      setStartTime,
      setEndTime,
      setDuration,
      allActivities,
      timelineWindow,
      existingActivity?.id,
    ],
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
      <TimelineView
        activities={allActivities}
        excludeActivityId={existingActivity?.id}
        onEmptySpaceClick={handleEmptySpaceClick}
        onSleepTimeChange={handleSleepTimeChange}
        selectedSleepEnd={endTime}
        selectedSleepStart={startTime}
        timeFormat={timeFormat}
        window={timelineWindow}
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
