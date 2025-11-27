'use client';

import { api } from '@nugget/api/react';
import type { Activities } from '@nugget/db/schema';
import { Avatar, AvatarFallback, AvatarImage } from '@nugget/ui/avatar';
import { Button } from '@nugget/ui/button';
import {
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
import { useEffect, useRef, useState } from 'react';
import { formatTimeWithPreference } from '~/lib/format-time';
import { TimeSelectionMode } from '../shared/components/time-selection-mode';

interface SleepDrawerContentProps {
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
  mode?: 'timer' | 'timeline';
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
  hideTimeSelection?: boolean;
}

export function SleepDrawerContent({
  startTime,
  setStartTime,
  endTime: _endTime,
  setEndTime,
  duration,
  setDuration,
  sleepType,
  setSleepType,
  activeActivityId,
  onTimerStart: _onTimerStart,
  isTimerStopped = false,
  mode = 'timeline',
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
  hideTimeSelection = false,
}: SleepDrawerContentProps) {
  const { data: user } = api.user.current.useQuery();
  const [isTracking, setIsTracking] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Calculate end time based on start time and duration
  const endTime = _endTime || new Date(startTime.getTime() + duration * 1000);

  // Set tracking state when in timer mode or there's an active activity
  useEffect(() => {
    if ((mode === 'timer' || activeActivityId) && !isTimerStopped) {
      setIsTracking(true);
      // Calculate elapsed time from startTime
      const elapsedSeconds = Math.floor(
        (Date.now() - startTime.getTime()) / 1000,
      );
      setDuration(elapsedSeconds);
    } else {
      // Reset tracking state when activity is cleared or timer is stopped
      setIsTracking(false);
    }
  }, [mode, activeActivityId, isTimerStopped, startTime, setDuration]);

  // Timer effect - runs when isTracking is true
  useEffect(() => {
    if (isTracking) {
      timerRef.current = setInterval(() => {
        const elapsedSeconds = Math.floor(
          (Date.now() - startTime.getTime()) / 1000,
        );
        setDuration(elapsedSeconds);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isTracking, startTime, setDuration]);

  const quickTimeOptions = [
    { label: '15 mins ago', minutes: 15 },
    { label: '30 mins ago', minutes: 30 },
    { label: '1 hour ago', minutes: 60 },
  ];

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

  // Determine if we should show detail fields based on mode
  // Timer mode: only show when timer is stopped
  const showDetailFields = isTimerStopped;

  return (
    <div className="space-y-6">
      {/* TIMER MODE */}
      {mode === 'timer' && (
        <>
          {/* Timer Display - Show immediately in timer mode */}
          <div className="bg-activity-sleep/10 border-2 border-activity-sleep rounded-2xl p-8 text-center">
            <div className="text-6xl font-bold text-activity-sleep mb-2">
              {Math.floor(duration / 3600)
                .toString()
                .padStart(2, '0')}
              :
              {Math.floor((duration % 3600) / 60)
                .toString()
                .padStart(2, '0')}
              :{(duration % 60).toString().padStart(2, '0')}
            </div>
            <p className="text-activity-sleep/80 font-medium">Duration</p>
            <p className="mt-2 text-sm text-activity-sleep/70">
              Started{' '}
              {formatTimeWithPreference(startTime, user?.timeFormat ?? '12h')}
            </p>
          </div>

          {/* Time Selection Component - Always visible in timer mode */}
          {!hideTimeSelection && (
            <TimeSelectionMode
              activityColor="bg-activity-sleep"
              activityTextColor="text-activity-sleep-foreground"
              duration={duration}
              endTime={endTime}
              quickTimeOptions={quickTimeOptions}
              setDuration={setDuration}
              setEndTime={setEndTime}
              setStartTime={setStartTime}
              showDurationOptions={false}
              startTime={startTime}
              timeFormat={user?.timeFormat ?? '12h'}
            />
          )}
        </>
      )}

      {/* Sleep Type - Show for both modes when detail fields are visible */}
      {showDetailFields && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">
            Sleep Type
          </p>
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
      )}

      {/* Co-sleeping - Moved higher, show when detail fields are visible */}
      {showDetailFields && (
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
              setIsCoSleeping(newValue);
              if (newValue && currentUserId) {
                // Auto-select current user when enabling co-sleeping
                setCoSleepingWith([currentUserId]);
              } else if (!newValue) {
                // Clear selections when disabling
                setCoSleepingWith([]);
              }
            }}
            variant={isCoSleeping ? 'default' : 'outline'}
          >
            <BedDouble className="mr-2 h-4 w-4" />
            Co-sleeping
          </Button>

          {/* Family member selection - shown when co-sleeping is enabled */}
          {isCoSleeping && familyMembers.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                Who is co-sleeping?
              </p>
              <div className="grid grid-cols-2 gap-2">
                {familyMembers.map((member) => (
                  <Button
                    className={`h-12 justify-start ${
                      coSleepingWith.includes(member.userId)
                        ? 'bg-activity-sleep text-activity-sleep-foreground'
                        : 'bg-transparent'
                    }`}
                    key={member.userId}
                    onClick={() => {
                      if (coSleepingWith.includes(member.userId)) {
                        setCoSleepingWith(
                          coSleepingWith.filter((id) => id !== member.userId),
                        );
                      } else {
                        setCoSleepingWith([...coSleepingWith, member.userId]);
                      }
                    }}
                    variant={
                      coSleepingWith.includes(member.userId)
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
      )}

      {/* Sleep Quality - Hide when timer is active */}
      {showDetailFields && (
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
                  onClick={() => setSleepQuality(option.value)}
                  variant={
                    sleepQuality === option.value ? 'default' : 'outline'
                  }
                >
                  <Icon className="mr-2 h-4 w-4" />
                  {option.label}
                </Button>
              );
            })}
          </div>
        </div>
      )}

      {/* Sleep Location - Hide when timer is active */}
      {showDetailFields && (
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
                  onClick={() => setSleepLocation(option.value)}
                  variant={
                    sleepLocation === option.value ? 'default' : 'outline'
                  }
                >
                  <Icon className="mr-2 h-4 w-4" />
                  {option.label}
                </Button>
              );
            })}
          </div>
        </div>
      )}

      {/* Wake Reason - Only show when not tracking and detail fields are shown */}
      {showDetailFields && !isTracking && (
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
                onClick={() => setWakeReason(option.value)}
                variant={wakeReason === option.value ? 'default' : 'outline'}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Notes - Hide when timer is active */}
      {/* {showDetailFields && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">Notes</p>
          <Textarea
            className="min-h-[100px] resize-none"
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any notes about this sleep session..."
            value={notes}
          />
        </div>
      )} */}
    </div>
  );
}
