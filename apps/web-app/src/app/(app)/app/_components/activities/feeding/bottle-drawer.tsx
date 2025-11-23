'use client';

import { api } from '@nugget/api/react';
import { Button } from '@nugget/ui/button';
import React, { useEffect, useState } from 'react';
import { AmountAdjuster } from '../shared/components/amount-adjuster';
// import { NotesField } from '../shared/components/notes-field';
import { QuickSelectButtons } from '../shared/components/quick-select-buttons';
import { TimeSelectionMode } from '../shared/components/time-selection-mode';
import {
  getQuickSelectVolumesByAge,
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
  babyAgeDays?: number | null;
  initialData?: Partial<BottleFormData>;
  duration?: number;
  setDuration?: (duration: number) => void;
  startTime?: Date;
  setStartTime?: (date: Date) => void;
  endTime?: Date;
  setEndTime?: (date: Date) => void;
}

export function BottleDrawerContent({
  unitPref = 'OZ',
  onDataChange,
  babyAgeDays = null,
  initialData,
  duration: externalDuration,
  setDuration,
  startTime: externalStartTime,
  setStartTime,
  endTime: externalEndTime,
  setEndTime,
}: BottleDrawerContentProps) {
  // Get age-appropriate quick select values
  const quickSelectValues = getQuickSelectVolumesByAge(babyAgeDays, unitPref);

  // Set default amount to first quick select value for the baby's age
  const defaultAmount = quickSelectValues[0] || (unitPref === 'OZ' ? 4 : 120);

  // Initialize amount from initialData if provided
  const getInitialAmount = () => {
    if (initialData?.amountMl) {
      // Convert from ml to user's preferred unit
      return unitPref === 'OZ'
        ? Math.round((initialData.amountMl / 29.5735) * 2) / 2
        : initialData.amountMl;
    }
    return defaultAmount;
  };

  const [amount, setAmount] = React.useState(getInitialAmount());
  const [bottleType, setBottleType] = React.useState<
    'breast_milk' | 'formula' | null
  >(initialData?.bottleType ?? null);
  const [notes] = React.useState(initialData?.notes ?? '');
  // const [notes, setNotes] = React.useState('');

  // Local state for time selection if not provided via props
  const [localStartTime, setLocalStartTime] = useState(new Date());
  const [localEndTime, setLocalEndTime] = useState(new Date());
  const [localDuration, setLocalDuration] = useState(0);

  // Use props if available, otherwise use local state
  const startTime = externalStartTime ?? localStartTime;
  const handleSetStartTime = setStartTime ?? setLocalStartTime;
  const endTime = externalEndTime ?? localEndTime;
  const handleSetEndTime = setEndTime ?? setLocalEndTime;
  const duration = externalDuration ?? localDuration;
  const handleSetDuration = setDuration ?? setLocalDuration;

  // Fetch user preferences for time format
  const { data: user } = api.user.current.useQuery();

  // Call onDataChange whenever form data changes
  useEffect(() => {
    const amountMl = unitPref === 'OZ' ? ozToMl(amount) : amount;
    onDataChange?.({
      amountMl,
      bottleType,
      notes,
    });
  }, [amount, bottleType, notes, unitPref, onDataChange]);

  // Get step size and min value based on user preference
  const step = getVolumeStep(unitPref);
  const minAmount = unitPref === 'OZ' ? 0.5 : 30;
  const unit = unitPref === 'OZ' ? 'oz' : 'ml';

  return (
    <div className="space-y-6">
      {/* Time Selection Mode */}
      <TimeSelectionMode
        activityColor="bg-activity-feeding"
        activityTextColor="text-activity-feeding-foreground"
        duration={duration}
        endTime={endTime}
        quickDurationOptions={[
          { label: '5 min', seconds: 5 * 60 },
          { label: '10 min', seconds: 10 * 60 },
          { label: '15 min', seconds: 15 * 60 },
        ]}
        setDuration={handleSetDuration}
        setEndTime={handleSetEndTime}
        setStartTime={handleSetStartTime}
        showDurationOptions={false}
        startTime={startTime}
        timeFormat={user?.timeFormat ?? '12h'}
      />

      {/* Quick Amounts */}
      <QuickSelectButtons
        activeColorClass="bg-activity-feeding text-activity-feeding-foreground hover:bg-activity-feeding/90"
        onSelect={setAmount}
        options={quickSelectValues}
        selected={amount}
        unit={unit}
      />

      {/* Amount Selector */}
      <AmountAdjuster
        min={minAmount}
        onChange={setAmount}
        step={step}
        unit={unit}
        value={amount}
      />

      {/* Bottle Type */}
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

      {/* Notes */}
      {/* {(
        <NotesField
          onChange={setNotes}
          placeholder="Add any notes about this feeding..."
          value={notes}
        />
      )} */}
    </div>
  );
}
