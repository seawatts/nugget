'use client';

import { api } from '@nugget/api/react';
import { Button } from '@nugget/ui/button';
import { Droplet, Minus, Pause, Play, Plus, Timer } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { calculateBabyAgeDays } from '../shared/baby-age-utils';
import { AmountAdjuster } from '../shared/components/amount-adjuster';
// import { NotesField } from '../shared/components/notes-field';
import { QuickSelectButtons } from '../shared/components/quick-select-buttons';
import { StopSleepConfirmationDialog } from '../shared/components/stop-sleep-confirmation-dialog';
import { useInProgressSleep } from '../shared/hooks/use-in-progress-sleep';
import { formatTime } from '../shared/time-formatting-utils';
import { getVolumeStep, mlToOz, ozToMl } from '../shared/volume-utils';
import { autoStopInProgressSleepAction } from '../sleep/actions';
import { calculateNursingVolumes } from './nursing-volume-calculator';

export interface NursingFormData {
  leftDuration: number; // in minutes
  rightDuration: number; // in minutes
  notes: string;
  amountMl?: number; // Optional nursing amount in ml
  vitaminDGiven?: boolean;
}

interface NursingDrawerContentProps {
  onDataChange?: (data: NursingFormData) => void;
  activeActivityId?: string | null;
  onTimerStart?: () => Promise<void>;
  isTimerStopped?: boolean;
  duration?: number;
  setDuration?: (duration: number) => void;
  startTime?: Date;
  setStartTime?: (date: Date) => void;
  initialData?: Partial<NursingFormData>;
}

export function NursingDrawerContent({
  onDataChange,
  activeActivityId,
  onTimerStart,
  duration: externalDuration,
  initialData,
}: NursingDrawerContentProps) {
  const [activeSide, setActiveSide] = useState<'left' | 'right' | null>(null);
  const [leftDuration, setLeftDuration] = useState(
    initialData?.leftDuration ? initialData.leftDuration * 60 : 0,
  ); // in seconds
  const [rightDuration, setRightDuration] = useState(
    initialData?.rightDuration ? initialData.rightDuration * 60 : 0,
  ); // in seconds
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [notes] = useState(initialData?.notes ?? '');
  const [amountMl, setAmountMl] = useState<number | null>(
    initialData?.amountMl ?? null,
  );
  const [isManuallyAdjusted, setIsManuallyAdjusted] = useState(
    !!initialData?.amountMl,
  );
  const [hasStartedDbTracking, setHasStartedDbTracking] = useState(false);
  const [showSleepConfirmation, setShowSleepConfirmation] = useState(false);
  const [pendingSide, setPendingSide] = useState<'left' | 'right' | null>(null);
  const [vitaminDGiven, setVitaminDGiven] = useState(
    initialData?.vitaminDGiven ?? false,
  );
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch baby data to get birth date for age calculation
  const { data: babies = [] } = api.babies.list.useQuery();
  const baby = babies[0]; // Get first baby

  // Fetch user preferences for unit display
  const { data: user } = api.user.current.useQuery();
  const measurementUnit = user?.measurementUnit || 'metric';
  const userUnitPref = measurementUnit === 'imperial' ? 'OZ' : 'ML';

  // Check for in-progress sleep
  const { inProgressSleep, sleepDuration } = useInProgressSleep({
    babyId: baby?.id,
    enabled: !hasStartedDbTracking,
  });

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

    // Only auto-calculate if user hasn't manually adjusted the amount
    if (totalDurationMinutes > 0 && baby?.birthDate && !isManuallyAdjusted) {
      const ageDays = calculateBabyAgeDays(baby.birthDate);
      if (ageDays !== null) {
        const { totalMl } = calculateNursingVolumes(
          ageDays,
          totalDurationMinutes,
        );
        setAmountMl(totalMl);
      }
    } else if (totalDurationMinutes === 0 && !isManuallyAdjusted) {
      setAmountMl(null);
    }
  }, [leftDuration, rightDuration, baby?.birthDate, isManuallyAdjusted]);

  // Call onDataChange whenever form data changes
  useEffect(() => {
    onDataChange?.({
      amountMl: amountMl ?? undefined,
      leftDuration: Math.floor(leftDuration / 60), // convert seconds to minutes
      notes,
      rightDuration: Math.floor(rightDuration / 60), // convert seconds to minutes
      vitaminDGiven,
    });
  }, [
    leftDuration,
    rightDuration,
    notes,
    amountMl,
    vitaminDGiven,
    onDataChange,
  ]);

  const handleSideSelect = async (side: 'left' | 'right') => {
    if (activeSide === side) {
      // If clicking the same side, toggle pause/resume
      setIsTimerRunning(!isTimerRunning);
    } else {
      // Switching to a different side
      setActiveSide(side);
      setIsTimerRunning(true);

      // Start database tracking on first side selection
      if (!hasStartedDbTracking && onTimerStart) {
        // Check if there's an in-progress sleep before starting
        if (inProgressSleep) {
          // Store which side was selected and show confirmation
          setPendingSide(side);
          setShowSleepConfirmation(true);
          setIsTimerRunning(false); // Pause timer until user confirms
          setActiveSide(null); // Reset active side until confirmed
          return;
        }

        // No in-progress sleep, proceed normally
        await onTimerStart();
        setHasStartedDbTracking(true);
      }
    }
  };

  const handleStopSleepAndStart = async () => {
    try {
      // Stop the in-progress sleep
      const result = await autoStopInProgressSleepAction();
      if (result?.data?.activity) {
        toast.info('Sleep tracking stopped');
      }
    } catch (error) {
      console.error('Failed to stop sleep:', error);
      toast.error('Failed to stop sleep tracking');
    }

    // Close confirmation dialog
    setShowSleepConfirmation(false);

    // Proceed with starting nursing timer
    if (pendingSide && onTimerStart) {
      setActiveSide(pendingSide);
      setIsTimerRunning(true);
      await onTimerStart();
      setHasStartedDbTracking(true);
    }

    // Clear pending side
    setPendingSide(null);
  };

  const handleKeepSleepingAndStart = async () => {
    // Close confirmation dialog
    setShowSleepConfirmation(false);

    // Proceed with starting nursing timer without stopping sleep
    if (pendingSide && onTimerStart) {
      setActiveSide(pendingSide);
      setIsTimerRunning(true);
      await onTimerStart();
      setHasStartedDbTracking(true);
    }

    // Clear pending side
    setPendingSide(null);
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
    setIsManuallyAdjusted(false);
    setHasStartedDbTracking(false);
  };

  // Manual duration adjustment handlers
  const adjustLeftDuration = (change: number) => {
    setLeftDuration((prev) => Math.max(0, prev + change * 60)); // change is in minutes
  };

  const adjustRightDuration = (change: number) => {
    setRightDuration((prev) => Math.max(0, prev + change * 60)); // change is in minutes
  };

  // Sync with external duration if there's an active activity
  useEffect(() => {
    if (activeActivityId && externalDuration !== undefined) {
      // When loading an in-progress activity, set the durations
      // For nursing, we track left and right separately, but for persistence
      // we use the total duration
      const totalDuration = externalDuration;
      // Split evenly for now - can be enhanced later
      setLeftDuration(Math.floor(totalDuration / 2));
      setRightDuration(Math.floor(totalDuration / 2));
      setHasStartedDbTracking(true);
    }
  }, [activeActivityId, externalDuration]);

  // Handle amount change from AmountAdjuster
  const handleAmountChange = (value: number) => {
    // Mark as manually adjusted to stop auto-calculation
    setIsManuallyAdjusted(true);
    // Convert to ml if user is in OZ mode
    const mlValue = userUnitPref === 'OZ' ? ozToMl(value) : value;
    setAmountMl(mlValue);
  };

  // Get step size and min value based on user preference
  const step = getVolumeStep(userUnitPref);
  const minAmount = userUnitPref === 'OZ' ? 0.5 : 30;
  const unit = userUnitPref === 'OZ' ? 'oz' : 'ml';

  // Get display value in user's preferred unit
  const displayAmount =
    amountMl !== null
      ? userUnitPref === 'OZ'
        ? mlToOz(amountMl)
        : Math.round(amountMl)
      : minAmount;

  return (
    <div className="space-y-6">
      {/* Quick Duration - Using shared component */}
      <QuickSelectButtons
        formatValue={(min: number) => `${min}m`}
        label="Quick Add Duration"
        onSelect={handleQuickAdd}
        options={[5, 10, 15, 20]}
        selected={null}
      />

      {/* Side Selection */}
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <button
            aria-pressed={activeSide === 'left'}
            className={`p-8 rounded-2xl border-2 transition-all ${
              activeSide === 'left'
                ? 'border-activity-feeding bg-activity-feeding/10'
                : 'border-border bg-card'
            }`}
            onClick={() => handleSideSelect('left')}
            type="button"
          >
            <Droplet className="h-12 w-12 mx-auto mb-3 text-activity-feeding" />
            <p className="font-semibold text-lg">Left</p>
            <p className="text-2xl font-bold mt-2">
              {formatTime(leftDuration)}
            </p>
          </button>
          <button
            aria-pressed={activeSide === 'right'}
            className={`p-8 rounded-2xl border-2 transition-all ${
              activeSide === 'right'
                ? 'border-activity-feeding bg-activity-feeding/10'
                : 'border-border bg-card'
            }`}
            onClick={() => handleSideSelect('right')}
            type="button"
          >
            <Droplet className="h-12 w-12 mx-auto mb-3 text-activity-feeding" />
            <p className="font-semibold text-lg">Right</p>
            <p className="text-2xl font-bold mt-2">
              {formatTime(rightDuration)}
            </p>
          </button>
        </div>

        {/* Manual Duration Adjustment */}
        <div className="grid grid-cols-2 gap-4">
          {/* Left Side Adjustment */}
          <div className="bg-card rounded-xl p-3">
            <p className="text-xs text-muted-foreground mb-2 text-center">
              Adjust Left
            </p>
            <div className="flex items-center justify-center gap-2">
              <Button
                className="h-8 w-8 rounded-full bg-transparent"
                onClick={() => adjustLeftDuration(-1)}
                size="icon"
                variant="outline"
              >
                <Minus className="h-3 w-3" />
              </Button>
              <span className="text-sm font-medium min-w-[60px] text-center">
                {Math.floor(leftDuration / 60)}m
              </span>
              <Button
                className="h-8 w-8 rounded-full bg-transparent"
                onClick={() => adjustLeftDuration(1)}
                size="icon"
                variant="outline"
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {/* Right Side Adjustment */}
          <div className="bg-card rounded-xl p-3">
            <p className="text-xs text-muted-foreground mb-2 text-center">
              Adjust Right
            </p>
            <div className="flex items-center justify-center gap-2">
              <Button
                className="h-8 w-8 rounded-full bg-transparent"
                onClick={() => adjustRightDuration(-1)}
                size="icon"
                variant="outline"
              >
                <Minus className="h-3 w-3" />
              </Button>
              <span className="text-sm font-medium min-w-[60px] text-center">
                {Math.floor(rightDuration / 60)}m
              </span>
              <Button
                className="h-8 w-8 rounded-full bg-transparent"
                onClick={() => adjustRightDuration(1)}
                size="icon"
                variant="outline"
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
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

      {/* Estimated Amount - Using AmountAdjuster */}
      {(leftDuration > 0 || rightDuration > 0) && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">
            Estimated Amount
          </p>
          <AmountAdjuster
            min={minAmount}
            onChange={handleAmountChange}
            size="md"
            step={step}
            unit={unit}
            value={displayAmount}
          />
        </div>
      )}

      {/* Vitamin D */}
      <div className="space-y-3">
        <p className="text-sm font-medium text-muted-foreground">Supplements</p>
        <Button
          className={`h-12 w-full ${
            vitaminDGiven
              ? 'bg-activity-feeding text-activity-feeding-foreground hover:bg-activity-feeding/90'
              : 'bg-transparent'
          }`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setVitaminDGiven(!vitaminDGiven);
          }}
          type="button"
          variant={vitaminDGiven ? 'default' : 'outline'}
        >
          Vitamin D given
        </Button>
      </div>

      {/* Notes - Using shared component */}
      {/* <NotesField onChange={setNotes} value={notes} /> */}

      {/* Sleep Stop Confirmation Dialog */}
      <StopSleepConfirmationDialog
        onKeepSleeping={handleKeepSleepingAndStart}
        onOpenChange={setShowSleepConfirmation}
        onStopSleep={handleStopSleepAndStart}
        open={showSleepConfirmation}
        sleepDuration={sleepDuration}
      />
    </div>
  );
}
