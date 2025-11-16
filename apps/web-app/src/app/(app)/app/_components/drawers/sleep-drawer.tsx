'use client';

import { Button } from '@nugget/ui/button';
import { Textarea } from '@nugget/ui/textarea';
import {
  Baby,
  BedDouble,
  Car,
  CloudRain,
  Flame,
  Moon,
  Music,
  Play,
  Shield,
  Smile,
  Square,
  Volume2,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface SleepDrawerContentProps {
  startTime: Date;
  setStartTime: (date: Date) => void;
  duration: number;
  setDuration: (duration: number) => void;
  sleepType: 'nap' | 'night';
  setSleepType: (type: 'nap' | 'night') => void;
  notes: string;
  setNotes: (notes: string) => void;
  activeActivityId?: string | null;
  onTimerStart?: () => Promise<void>;
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
}

export function SleepDrawerContent({
  startTime,
  setStartTime,
  duration,
  setDuration,
  sleepType,
  setSleepType,
  notes,
  setNotes,
  activeActivityId,
  onTimerStart,
  sleepQuality,
  setSleepQuality,
  sleepLocation,
  setSleepLocation,
  wakeReason,
  setWakeReason,
}: SleepDrawerContentProps) {
  const [isTracking, setIsTracking] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Set tracking state if there's an active activity
  useEffect(() => {
    if (activeActivityId) {
      setIsTracking(true);
      // Calculate elapsed time from startTime
      const elapsedSeconds = Math.floor(
        (Date.now() - startTime.getTime()) / 1000,
      );
      setDuration(elapsedSeconds);
    }
  }, [activeActivityId, startTime, setDuration]);

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

  const handleStartStop = async () => {
    if (!isTracking) {
      const newStartTime = new Date();
      setStartTime(newStartTime);
      setDuration(0);
      setIsTracking(true);

      // Create activity in database immediately
      if (onTimerStart) {
        await onTimerStart();
      }
    } else {
      setIsTracking(false);
    }
  };

  const quickDurations = [
    { label: '30 min', seconds: 30 * 60 },
    { label: '1 hour', seconds: 60 * 60 },
    { label: '2 hours', seconds: 120 * 60 },
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

  return (
    <div className="space-y-6">
      {/* Quick Add - Moved to top */}
      <div className="space-y-3">
        <p className="text-sm font-medium text-muted-foreground">Quick Add</p>
        <div className="grid grid-cols-3 gap-3">
          {quickDurations.map((quick) => (
            <Button
              className="h-12 bg-transparent"
              key={quick.label}
              onClick={() => setDuration(quick.seconds)}
              variant="outline"
            >
              {quick.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Timer Display */}
      <div className="bg-card rounded-2xl p-8 text-center">
        <div className="text-6xl font-bold text-foreground mb-2">
          {Math.floor(duration / 3600)
            .toString()
            .padStart(2, '0')}
          :
          {Math.floor((duration % 3600) / 60)
            .toString()
            .padStart(2, '0')}
          :{(duration % 60).toString().padStart(2, '0')}
        </div>
        <p className="text-muted-foreground">Duration</p>
        {isTracking && (
          <p className="mt-2 text-xs text-muted-foreground">
            Started{' '}
            {startTime.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        )}
      </div>

      {/* Start/Stop Button */}
      <Button
        className={`w-full h-16 text-lg font-semibold ${
          isTracking
            ? 'bg-destructive hover:bg-destructive/90 text-destructive-foreground'
            : 'bg-[oklch(0.75_0.15_195)] hover:bg-[oklch(0.75_0.15_195)]/90 text-[oklch(0.18_0.02_250)]'
        }`}
        onClick={handleStartStop}
      >
        {isTracking ? (
          <>
            <Square className="mr-2 h-5 w-5" />
            Stop Sleep
          </>
        ) : (
          <>
            <Play className="mr-2 h-5 w-5" />
            Start Sleep
          </>
        )}
      </Button>

      {/* Sleep Type */}
      <div className="space-y-3">
        <p className="text-sm font-medium text-muted-foreground">Sleep Type</p>
        <div className="grid grid-cols-2 gap-3">
          <Button
            className={`h-12 ${
              sleepType === 'nap'
                ? 'bg-[oklch(0.75_0.15_195)] text-[oklch(0.18_0.02_250)]'
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
                ? 'bg-[oklch(0.75_0.15_195)] text-[oklch(0.18_0.02_250)]'
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
                    ? 'bg-[oklch(0.75_0.15_195)] text-[oklch(0.18_0.02_250)]'
                    : 'bg-transparent'
                }`}
                key={option.value}
                onClick={() => setSleepQuality(option.value)}
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
                    ? 'bg-[oklch(0.75_0.15_195)] text-[oklch(0.18_0.02_250)]'
                    : 'bg-transparent'
                }`}
                key={option.value}
                onClick={() => setSleepLocation(option.value)}
                variant={sleepLocation === option.value ? 'default' : 'outline'}
              >
                <Icon className="mr-2 h-4 w-4" />
                {option.label}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Wake Reason - Only show when not tracking */}
      {!isTracking && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">
            Wake Reason (optional)
          </p>
          <div className="grid grid-cols-2 gap-3">
            {wakeReasonOptions.map((option) => (
              <Button
                className={`h-12 ${
                  wakeReason === option.value
                    ? 'bg-[oklch(0.75_0.15_195)] text-[oklch(0.18_0.02_250)]'
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

      {/* Notes */}
      <div className="space-y-3">
        <p className="text-sm font-medium text-muted-foreground">Notes</p>
        <Textarea
          className="min-h-[100px] resize-none"
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add any notes about this sleep session..."
          value={notes}
        />
      </div>
    </div>
  );
}
