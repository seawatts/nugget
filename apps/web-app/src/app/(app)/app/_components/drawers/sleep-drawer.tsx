'use client';

import { Button } from '@nugget/ui/button';
import { Textarea } from '@nugget/ui/textarea';
import { Moon, Play, Square } from 'lucide-react';
import { useState } from 'react';

interface SleepDrawerContentProps {
  startTime: Date;
  setStartTime: (date: Date) => void;
  duration: number;
  setDuration: (duration: number) => void;
  sleepType: 'nap' | 'night';
  setSleepType: (type: 'nap' | 'night') => void;
  notes: string;
  setNotes: (notes: string) => void;
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
}: SleepDrawerContentProps) {
  const [isTracking, setIsTracking] = useState(false);

  const handleStartStop = () => {
    if (!isTracking) {
      setIsTracking(true);
      setStartTime(new Date());
      setDuration(0);
    } else {
      setIsTracking(false);
    }
  };

  const quickDurations = [
    { label: '30 min', seconds: 30 * 60 },
    { label: '1 hour', seconds: 60 * 60 },
    { label: '2 hours', seconds: 120 * 60 },
  ];

  return (
    <div className="space-y-6">
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

      {/* Quick Actions */}
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
