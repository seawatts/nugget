'use client';

import { Button } from '@nugget/ui/button';
import { Milk, Minus, Play, Plus, Square, Timer } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export interface BottleFormData {
  amountMl: number;
  bottleType: 'breast_milk' | 'formula' | null;
  notes: string;
}

interface BottleDrawerContentProps {
  unitPref?: 'ML' | 'OZ';
  onDataChange?: (data: BottleFormData) => void;
  activeActivityId?: string | null;
  onTimerStart?: () => Promise<void>;
  isTimerStopped?: boolean;
  duration?: number;
  setDuration?: (duration: number) => void;
  startTime?: Date;
  setStartTime?: (date: Date) => void;
}

// Conversion helpers
const ozToMl = (oz: number) => Math.round(oz * 29.5735);

export function BottleDrawerContent({
  unitPref = 'OZ',
  onDataChange,
  activeActivityId,
  onTimerStart,
  isTimerStopped = false,
  duration = 0,
  setDuration,
  startTime,
  setStartTime,
}: BottleDrawerContentProps) {
  // Store amount internally in the user's preferred unit
  const [amount, setAmount] = useState(unitPref === 'OZ' ? 4 : 120);
  const [bottleType, setBottleType] = useState<
    'breast_milk' | 'formula' | null
  >(null);
  const [notes, setNotes] = useState('');
  const [isTracking, setIsTracking] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Call onDataChange whenever form data changes
  useEffect(() => {
    const amountMl = unitPref === 'OZ' ? ozToMl(amount) : amount;
    onDataChange?.({
      amountMl,
      bottleType,
      notes,
    });
  }, [amount, bottleType, notes, unitPref, onDataChange]);

  // Set tracking state if there's an active activity
  useEffect(() => {
    if (activeActivityId && !isTimerStopped) {
      setIsTracking(true);
    } else {
      setIsTracking(false);
    }
  }, [activeActivityId, isTimerStopped]);

  // Timer effect - runs when isTracking is true
  useEffect(() => {
    if (isTracking && startTime && setDuration) {
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

  // Get increment/decrement step based on unit
  const step = unitPref === 'OZ' ? 0.5 : 30;
  const minAmount = unitPref === 'OZ' ? 0.5 : 30;

  // Get quick select values based on unit
  const quickSelectValues =
    unitPref === 'OZ' ? [2, 4, 6, 8] : [60, 120, 180, 240];

  const handleStartStop = async () => {
    if (!isTracking) {
      if (setStartTime) {
        const newStartTime = new Date();
        setStartTime(newStartTime);
      }
      if (setDuration) {
        setDuration(0);
      }
      setIsTracking(true);

      // Create activity in database immediately
      if (onTimerStart) {
        await onTimerStart();
      }
    } else {
      setIsTracking(false);
    }
  };

  // Determine if we should show detail fields
  const showDetailFields = !activeActivityId || isTimerStopped;

  return (
    <div className="space-y-6">
      {/* Timer Display - Show when tracking */}
      {isTracking && (
        <div className="bg-card rounded-2xl p-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Timer className="h-5 w-5 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Bottle feeding in progress
            </p>
          </div>
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
          {startTime && (
            <p className="mt-2 text-xs text-muted-foreground">
              Started{' '}
              {startTime.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          )}
        </div>
      )}

      {/* Start/Stop Button - Only show when not in active mode (button moved to footer) */}
      {!activeActivityId && (
        <Button
          className={`w-full h-16 text-lg font-semibold ${
            isTracking
              ? 'bg-destructive hover:bg-destructive/90 text-destructive-foreground'
              : 'bg-[oklch(0.68_0.18_35)] hover:bg-[oklch(0.68_0.18_35)]/90 text-white'
          }`}
          onClick={handleStartStop}
        >
          {isTracking ? (
            <>
              <Square className="mr-2 h-5 w-5" />
              Stop Feeding
            </>
          ) : (
            <>
              <Play className="mr-2 h-5 w-5" />
              Start Feeding
            </>
          )}
        </Button>
      )}

      {/* Quick Amounts - Hide when timer is active */}
      {showDetailFields && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">
            Quick Select
          </p>
          <div className="grid grid-cols-4 gap-2">
            {quickSelectValues.map((value) => (
              <Button
                className="h-12 bg-transparent"
                key={value}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setAmount(value);
                }}
                type="button"
                variant="outline"
              >
                {value} {unitPref === 'OZ' ? 'oz' : 'ml'}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Amount Selector - Hide when timer is active */}
      {showDetailFields && (
        <div className="bg-card rounded-2xl p-8">
          <div className="flex items-center justify-center gap-6">
            <Button
              className="h-14 w-14 rounded-full bg-transparent"
              onClick={() => setAmount(Math.max(minAmount, amount - step))}
              size="icon"
              variant="outline"
            >
              <Minus className="h-6 w-6" />
            </Button>
            <div className="text-center">
              <div className="text-6xl font-bold text-foreground">{amount}</div>
              <p className="text-muted-foreground mt-1">
                {unitPref === 'OZ' ? 'oz' : 'ml'}
              </p>
            </div>
            <Button
              className="h-14 w-14 rounded-full bg-transparent"
              onClick={() => setAmount(amount + step)}
              size="icon"
              variant="outline"
            >
              <Plus className="h-6 w-6" />
            </Button>
          </div>
        </div>
      )}

      {/* Bottle Type - Hide when timer is active */}
      {showDetailFields && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">Type</p>
          <div className="grid grid-cols-2 gap-3">
            <Button
              className={`h-12 ${
                bottleType === 'breast_milk'
                  ? 'bg-[oklch(0.68_0.18_35)] text-white hover:bg-[oklch(0.68_0.18_35)]/90'
                  : 'bg-transparent'
              }`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setBottleType('breast_milk');
              }}
              type="button"
              variant={bottleType === 'breast_milk' ? 'default' : 'outline'}
            >
              <Milk className="mr-2 h-4 w-4" />
              Breast Milk
            </Button>
            <Button
              className={`h-12 ${
                bottleType === 'formula'
                  ? 'bg-[oklch(0.68_0.18_35)] text-white hover:bg-[oklch(0.68_0.18_35)]/90'
                  : 'bg-transparent'
              }`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setBottleType('formula');
              }}
              type="button"
              variant={bottleType === 'formula' ? 'default' : 'outline'}
            >
              <Milk className="mr-2 h-4 w-4" />
              Formula
            </Button>
          </div>
        </div>
      )}

      {/* Notes - Hide when timer is active */}
      {showDetailFields && (
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
      )}
    </div>
  );
}
