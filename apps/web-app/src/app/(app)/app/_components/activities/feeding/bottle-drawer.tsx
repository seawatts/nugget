'use client';

import { Button } from '@nugget/ui/button';
import { Play, Square } from 'lucide-react';
import React, { useEffect } from 'react';
import { AmountAdjuster } from '../shared/components/amount-adjuster';
import { NotesField } from '../shared/components/notes-field';
import { QuickSelectButtons } from '../shared/components/quick-select-buttons';
import { TimerDisplay } from '../shared/components/timer-display';
import { useActivityTimer } from '../shared/hooks/use-activity-timer';
import {
  getQuickSelectVolumes,
  getVolumeStep,
  ozToMl,
} from '../shared/volume-utils';

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

export function BottleDrawerContent({
  unitPref = 'OZ',
  onDataChange,
  activeActivityId,
  onTimerStart,
  isTimerStopped = false,
}: BottleDrawerContentProps) {
  // Store amount internally in the user's preferred unit
  const defaultAmount = unitPref === 'OZ' ? 4 : 120;
  const [amount, setAmount] = React.useState(defaultAmount);
  const [bottleType, setBottleType] = React.useState<
    'breast_milk' | 'formula' | null
  >(null);
  const [notes, setNotes] = React.useState('');

  // Use the activity timer hook
  const timer = useActivityTimer({
    onStart: onTimerStart,
  });

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
      // Timer is already running from activeActivityId
    }
  }, [activeActivityId, isTimerStopped]);

  // Get step size and min value based on user preference
  const step = getVolumeStep(unitPref);
  const minAmount = unitPref === 'OZ' ? 0.5 : 30;
  const unit = unitPref === 'OZ' ? 'oz' : 'ml';

  // Get quick select values based on unit
  const quickSelectValues = getQuickSelectVolumes(unitPref);

  // Determine if we should show detail fields
  const showDetailFields = !activeActivityId || isTimerStopped;

  return (
    <div className="space-y-6">
      {/* Timer Display - Show when tracking */}
      {timer.isRunning && (
        <TimerDisplay
          duration={timer.duration}
          isTracking={timer.isRunning}
          label="Bottle feeding in progress"
          startTime={timer.startTime}
        />
      )}

      {/* Start/Stop Button - Only show when not in active mode (button moved to footer) */}
      {!activeActivityId && (
        <Button
          className={`w-full h-16 text-lg font-semibold ${
            timer.isRunning
              ? 'bg-destructive hover:bg-destructive/90 text-destructive-foreground'
              : 'bg-activity-feeding hover:bg-activity-feeding/90 text-activity-feeding-foreground'
          }`}
          onClick={timer.isRunning ? timer.stop : timer.start}
        >
          {timer.isRunning ? (
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
        <QuickSelectButtons
          activeColorClass="bg-activity-feeding text-activity-feeding-foreground hover:bg-activity-feeding/90"
          onSelect={setAmount}
          options={quickSelectValues}
          selected={amount}
          unit={unit}
        />
      )}

      {/* Amount Selector - Hide when timer is active */}
      {showDetailFields && (
        <AmountAdjuster
          min={minAmount}
          onChange={setAmount}
          step={step}
          unit={unit}
          value={amount}
        />
      )}

      {/* Bottle Type - Hide when timer is active */}
      {showDetailFields && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">Type</p>
          <div className="grid grid-cols-2 gap-3">
            <Button
              className={`h-12 ${
                bottleType === 'breast_milk'
                  ? 'bg-activity-feeding text-activity-feeding-foreground hover:bg-activity-feeding/90'
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
              Breast Milk
            </Button>
            <Button
              className={`h-12 ${
                bottleType === 'formula'
                  ? 'bg-activity-feeding text-activity-feeding-foreground hover:bg-activity-feeding/90'
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
              Formula
            </Button>
          </div>
        </div>
      )}

      {/* Notes - Hide when timer is active */}
      {showDetailFields && (
        <NotesField
          onChange={setNotes}
          placeholder="Add any notes about this feeding..."
          value={notes}
        />
      )}
    </div>
  );
}
