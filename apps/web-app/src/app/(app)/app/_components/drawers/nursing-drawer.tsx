'use client';

import { api } from '@nugget/api/react';
import { Button } from '@nugget/ui/button';
import { Input } from '@nugget/ui/input';
import { Droplet, Edit2, Pause, Play, Timer } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import {
  calculateBabyAgeDays,
  calculateNursingVolumes,
  mlToOz,
  ozToMl,
} from './nursing-volume-calculator';

export interface NursingFormData {
  leftDuration: number; // in minutes
  rightDuration: number; // in minutes
  notes: string;
  amountMl?: number; // Optional nursing amount in ml
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
  const [amountMl, setAmountMl] = useState<number | null>(null);
  const [isEditingAmount, setIsEditingAmount] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch baby data to get birth date for age calculation
  const { data: babies = [] } = api.babies.list.useQuery();
  const baby = babies[0]; // Get first baby

  // Fetch user preferences for unit display
  const { data: user } = api.user.current.useQuery();
  const measurementUnit = user?.measurementUnit || 'metric';
  const userUnitPref = measurementUnit === 'imperial' ? 'OZ' : 'ML';

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

  // Auto-calculate nursing amount based on duration and baby age
  useEffect(() => {
    const totalDurationMinutes = Math.floor(
      (leftDuration + rightDuration) / 60,
    );

    if (totalDurationMinutes > 0 && baby?.birthDate && !isEditingAmount) {
      const ageDays = calculateBabyAgeDays(baby.birthDate);
      if (ageDays !== null) {
        const { totalMl } = calculateNursingVolumes(
          ageDays,
          totalDurationMinutes,
        );
        setAmountMl(totalMl);
      }
    } else if (totalDurationMinutes === 0 && !isEditingAmount) {
      setAmountMl(null);
    }
  }, [leftDuration, rightDuration, baby?.birthDate, isEditingAmount]);

  // Call onDataChange whenever form data changes
  useEffect(() => {
    onDataChange?.({
      amountMl: amountMl ?? undefined,
      leftDuration: Math.floor(leftDuration / 60), // convert seconds to minutes
      notes,
      rightDuration: Math.floor(rightDuration / 60), // convert seconds to minutes
    });
  }, [leftDuration, rightDuration, notes, amountMl, onDataChange]);

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
    // Add duration to BOTH sides simultaneously
    setLeftDuration(seconds);
    setRightDuration(seconds);
  };

  const toggleTimer = () => {
    setIsTimerRunning(!isTimerRunning);
  };

  const resetTracking = () => {
    setActiveSide(null);
    setLeftDuration(0);
    setRightDuration(0);
    setIsTimerRunning(false);
    setAmountMl(null);
    setIsEditingAmount(false);
  };

  // Format seconds to mm:ss
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Format amount for display based on user preference
  const formatAmount = (ml: number) => {
    if (userUnitPref === 'OZ') {
      return `${mlToOz(ml)}oz`;
    }
    return `${Math.round(ml)}ml`;
  };

  // Handle manual amount change
  const handleAmountChange = (value: string) => {
    setIsEditingAmount(true);
    const numValue = Number.parseFloat(value);
    if (!Number.isNaN(numValue) && numValue >= 0) {
      // Convert to ml if user is in OZ mode
      const mlValue = userUnitPref === 'OZ' ? ozToMl(numValue) : numValue;
      setAmountMl(mlValue);
    }
  };

  return (
    <div className="space-y-6">
      {/* Quick Duration - Moved to top */}
      <div className="space-y-3">
        <p className="text-sm font-medium text-muted-foreground">
          Quick Add Duration
        </p>
        <div className="grid grid-cols-4 gap-2">
          {[5, 10, 15, 20].map((min) => (
            <Button
              className="h-12 bg-transparent"
              key={min}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleQuickAdd(min);
              }}
              type="button"
              variant="outline"
            >
              {min}m
            </Button>
          ))}
        </div>
      </div>

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

      {/* Estimated Amount Display */}
      {amountMl !== null && (leftDuration > 0 || rightDuration > 0) && (
        <div className="bg-card rounded-2xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Estimated Amount</p>
            <button
              className="p-1 rounded hover:bg-muted transition-colors"
              onClick={() => setIsEditingAmount(!isEditingAmount)}
              type="button"
            >
              <Edit2 className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
          {isEditingAmount ? (
            <div className="flex items-center gap-2">
              <Input
                className="h-10"
                onChange={(e) => handleAmountChange(e.target.value)}
                placeholder={`Enter ${userUnitPref === 'OZ' ? 'oz' : 'ml'}`}
                type="number"
                value={
                  userUnitPref === 'OZ'
                    ? mlToOz(amountMl)
                    : Math.round(amountMl)
                }
              />
              <Button
                className="h-10"
                onClick={() => setIsEditingAmount(false)}
                size="sm"
                variant="outline"
              >
                Done
              </Button>
            </div>
          ) : (
            <p className="text-2xl font-semibold">{formatAmount(amountMl)}</p>
          )}
        </div>
      )}

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
