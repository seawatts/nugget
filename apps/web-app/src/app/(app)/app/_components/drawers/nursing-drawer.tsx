'use client';

import { Button } from '@nugget/ui/button';
import { Droplet, Pause, Play, Timer } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export interface NursingFormData {
  leftDuration: number; // in minutes
  rightDuration: number; // in minutes
  notes: string;
}

interface NursingDrawerContentProps {
  onDataChange?: (data: NursingFormData) => void;
}

export function NursingDrawerContent({
  onDataChange,
}: NursingDrawerContentProps) {
  const [activeSide, setActiveSide] = useState<'left' | 'right' | null>(null);
  const [leftDuration, setLeftDuration] = useState(0); // in seconds
  const [rightDuration, setRightDuration] = useState(0); // in seconds
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [notes, setNotes] = useState('');
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Timer effect - runs when isTimerRunning is true
  useEffect(() => {
    if (isTimerRunning && activeSide) {
      timerRef.current = setInterval(() => {
        if (activeSide === 'left') {
          setLeftDuration((prev) => prev + 1);
        } else if (activeSide === 'right') {
          setRightDuration((prev) => prev + 1);
        }
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
  }, [isTimerRunning, activeSide]);

  // Call onDataChange whenever form data changes
  useEffect(() => {
    onDataChange?.({
      leftDuration: Math.floor(leftDuration / 60), // convert seconds to minutes
      notes,
      rightDuration: Math.floor(rightDuration / 60), // convert seconds to minutes
    });
  }, [leftDuration, rightDuration, notes, onDataChange]);

  const handleSideSelect = (side: 'left' | 'right') => {
    if (activeSide === side) {
      // If clicking the same side, toggle pause/resume
      setIsTimerRunning(!isTimerRunning);
    } else {
      // Switching to a different side
      setActiveSide(side);
      setIsTimerRunning(true);
    }
  };

  const handleQuickAdd = (minutes: number) => {
    const seconds = minutes * 60;
    if (activeSide === 'left') {
      setLeftDuration(seconds);
    } else if (activeSide === 'right') {
      setRightDuration(seconds);
    } else {
      // If no side is selected, default to left side
      setActiveSide('left');
      setLeftDuration(seconds);
    }
  };

  const toggleTimer = () => {
    setIsTimerRunning(!isTimerRunning);
  };

  const resetTracking = () => {
    setActiveSide(null);
    setLeftDuration(0);
    setRightDuration(0);
    setIsTimerRunning(false);
  };

  // Format seconds to mm:ss
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* Side Selection */}
      <div className="grid grid-cols-2 gap-4">
        <button
          aria-pressed={activeSide === 'left'}
          className={`p-8 rounded-2xl border-2 transition-all ${
            activeSide === 'left'
              ? 'border-[oklch(0.68_0.18_35)] bg-[oklch(0.68_0.18_35)]/10'
              : 'border-border bg-card'
          }`}
          onClick={() => handleSideSelect('left')}
          type="button"
        >
          <Droplet className="h-12 w-12 mx-auto mb-3 text-[oklch(0.68_0.18_35)]" />
          <p className="font-semibold text-lg">Left</p>
          <p className="text-2xl font-bold mt-2">{formatTime(leftDuration)}</p>
        </button>
        <button
          aria-pressed={activeSide === 'right'}
          className={`p-8 rounded-2xl border-2 transition-all ${
            activeSide === 'right'
              ? 'border-[oklch(0.68_0.18_35)] bg-[oklch(0.68_0.18_35)]/10'
              : 'border-border bg-card'
          }`}
          onClick={() => handleSideSelect('right')}
          type="button"
        >
          <Droplet className="h-12 w-12 mx-auto mb-3 text-[oklch(0.68_0.18_35)]" />
          <p className="font-semibold text-lg">Right</p>
          <p className="text-2xl font-bold mt-2">{formatTime(rightDuration)}</p>
        </button>
      </div>

      {/* Timer Controls */}
      {activeSide && (
        <div className="bg-card rounded-2xl p-6 space-y-3">
          <div className="flex items-center justify-center gap-4 mb-4">
            <Timer className="h-5 w-5 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Tracking {activeSide} side{' '}
              {isTimerRunning ? '(Running)' : '(Paused)'}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Button
              className="h-12 bg-transparent"
              onClick={toggleTimer}
              variant="outline"
            >
              {isTimerRunning ? (
                <>
                  <Pause className="mr-2 h-4 w-4" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Resume
                </>
              )}
            </Button>
            <Button
              className="h-12 bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={resetTracking}
            >
              Reset
            </Button>
          </div>
        </div>
      )}

      {/* Quick Duration */}
      <div className="space-y-3">
        <p className="text-sm font-medium text-muted-foreground">
          Quick Add Duration
        </p>
        <div className="grid grid-cols-4 gap-2">
          {[5, 10, 15, 20].map((min) => (
            <Button
              className="h-12 bg-transparent"
              key={min}
              onClick={() => handleQuickAdd(min)}
              variant="outline"
            >
              {min}m
            </Button>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-3">
        <p className="text-sm font-medium text-muted-foreground">
          Notes (optional)
        </p>
        <textarea
          className="w-full h-24 p-4 rounded-xl bg-card border border-border resize-none focus:outline-none focus:ring-2 focus:ring-ring"
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add any notes about this feeding..."
          value={notes}
        />
      </div>
    </div>
  );
}
