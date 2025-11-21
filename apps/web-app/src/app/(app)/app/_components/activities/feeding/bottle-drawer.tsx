'use client';

import { Button } from '@nugget/ui/button';
import React, { useEffect } from 'react';
import { AmountAdjuster } from '../shared/components/amount-adjuster';
// import { NotesField } from '../shared/components/notes-field';
import { QuickSelectButtons } from '../shared/components/quick-select-buttons';
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
}

export function BottleDrawerContent({
  unitPref = 'OZ',
  onDataChange,
  babyAgeDays = null,
  initialData,
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
