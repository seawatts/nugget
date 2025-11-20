'use client';

import { api } from '@nugget/api/react';
import { Button } from '@nugget/ui/button';
import { Droplets, Info, Minus, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  calculateBabyAgeDays,
  calculatePumpingVolumes,
  isColostrumPhase,
  mlToOz,
} from './pumping-volume-calculator';

export interface PumpingFormData {
  leftAmount: number;
  rightAmount: number;
  duration: number | null;
  method: 'electric' | 'manual' | null;
  notes: string;
}

interface PumpingDrawerContentProps {
  leftAmount?: number;
  rightAmount?: number;
  selectedDuration?: number | null;
  selectedMethod?: 'electric' | 'manual' | null;
  notes?: string;
  setLeftAmount?: (amount: number) => void;
  setRightAmount?: (amount: number) => void;
  setSelectedDuration?: (duration: number | null) => void;
  setSelectedMethod?: (method: 'electric' | 'manual' | null) => void;
  setNotes?: (notes: string) => void;
}

export function PumpingDrawerContent({
  leftAmount: controlledLeftAmount,
  rightAmount: controlledRightAmount,
  selectedDuration: controlledSelectedDuration,
  selectedMethod: controlledSelectedMethod,
  notes: controlledNotes,
  setLeftAmount: setControlledLeftAmount,
  setRightAmount: setControlledRightAmount,
  setSelectedDuration: setControlledSelectedDuration,
  setSelectedMethod: setControlledSelectedMethod,
  setNotes: setControlledNotes,
}: PumpingDrawerContentProps = {}) {
  // Fetch baby data and user preferences
  const { data: babies = [] } = api.babies.list.useQuery();
  const { data: user } = api.user.current.useQuery();
  const baby = babies[0]; // Use first baby
  const measurementUnit = user?.measurementUnit || 'metric';
  const userUnitPref = measurementUnit === 'imperial' ? 'OZ' : 'ML';

  // Internal state - use default values that will be updated based on user preference
  const [internalLeftAmount, setInternalLeftAmount] = useState(2);
  const [internalRightAmount, setInternalRightAmount] = useState(2);
  const [internalSelectedDuration, setInternalSelectedDuration] = useState<
    number | null
  >(null);
  const [internalSelectedMethod, setInternalSelectedMethod] = useState<
    'electric' | 'manual' | null
  >(null);
  const [internalNotes, setInternalNotes] = useState('');
  const [hasInitialized, setHasInitialized] = useState(false);

  // Use controlled props if provided, otherwise use internal state
  const leftAmount =
    controlledLeftAmount !== undefined
      ? controlledLeftAmount
      : internalLeftAmount;
  const rightAmount =
    controlledRightAmount !== undefined
      ? controlledRightAmount
      : internalRightAmount;
  const selectedDuration =
    controlledSelectedDuration !== undefined
      ? controlledSelectedDuration
      : internalSelectedDuration;
  const selectedMethod =
    controlledSelectedMethod !== undefined
      ? controlledSelectedMethod
      : internalSelectedMethod;

  // Check if we're in controlled mode
  const isControlled = setControlledLeftAmount !== undefined;

  const setLeftAmount = setControlledLeftAmount || setInternalLeftAmount;
  const setRightAmount = setControlledRightAmount || setInternalRightAmount;
  const setSelectedDuration =
    setControlledSelectedDuration || setInternalSelectedDuration;
  const setSelectedMethod =
    setControlledSelectedMethod || setInternalSelectedMethod;

  // Calculate baby age
  const babyAgeDays = baby?.birthDate
    ? calculateBabyAgeDays(new Date(baby.birthDate))
    : null;

  // Check if in colostrum phase
  const showColostrumBadge =
    babyAgeDays !== null && isColostrumPhase(babyAgeDays);

  // Initialize amounts based on user preference when data loads
  // Only run this in uncontrolled mode
  useEffect(() => {
    if (!isControlled && user && !hasInitialized) {
      const defaultAmount = userUnitPref === 'OZ' ? 2 : 60;
      setLeftAmount(defaultAmount);
      setRightAmount(defaultAmount);
      setHasInitialized(true);
    }
  }, [
    user,
    userUnitPref,
    hasInitialized,
    isControlled,
    setLeftAmount,
    setRightAmount,
  ]);

  // Auto-calculate volumes when duration is selected
  useEffect(() => {
    if (selectedDuration !== null && babyAgeDays !== null) {
      const volumes = calculatePumpingVolumes(
        babyAgeDays,
        selectedDuration,
        baby?.mlPerPump,
      );

      // Convert to user's preferred unit
      if (userUnitPref === 'OZ') {
        setLeftAmount(mlToOz(volumes.leftMl));
        setRightAmount(mlToOz(volumes.rightMl));
      } else {
        setLeftAmount(Math.round(volumes.leftMl));
        setRightAmount(Math.round(volumes.rightMl));
      }
    }
  }, [
    selectedDuration,
    babyAgeDays,
    baby?.mlPerPump,
    userUnitPref,
    setLeftAmount,
    setRightAmount,
  ]);

  // Get step size and min value based on user preference
  const step = userUnitPref === 'OZ' ? 0.5 : 30;
  const minAmount = 0; // Allow going down to 0
  const unit = userUnitPref === 'OZ' ? 'oz' : 'ml';

  return (
    <div className="space-y-6">
      {/* Duration - Moved to top */}
      <div className="space-y-3">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Duration</p>
          <p className="text-xs text-muted-foreground/70 mt-1">
            {babyAgeDays !== null
              ? "Volumes will auto-fill based on your baby's age"
              : 'Select duration to auto-fill suggested volumes'}
          </p>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {[10, 15, 20, 30].map((min) => (
            <Button
              className={`h-12 ${
                selectedDuration === min
                  ? 'bg-activity-pumping text-activity-pumping-foreground hover:bg-activity-pumping/90'
                  : 'bg-transparent'
              }`}
              key={min}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setSelectedDuration(min);
              }}
              type="button"
              variant={selectedDuration === min ? 'default' : 'outline'}
            >
              {min}m
            </Button>
          ))}
        </div>
      </div>

      {/* Amount Selectors */}
      <div className="grid grid-cols-2 gap-4">
        {/* Left Side */}
        <div className="bg-card rounded-2xl p-6">
          <p className="text-sm font-medium text-muted-foreground mb-4 text-center">
            Left
          </p>
          <div className="flex items-center justify-center gap-3">
            <Button
              className="h-10 w-10 rounded-full bg-transparent"
              onClick={() =>
                setLeftAmount(Math.max(minAmount, leftAmount - step))
              }
              size="icon"
              variant="outline"
            >
              <Minus className="h-4 w-4" />
            </Button>
            <div className="text-center min-w-[60px]">
              <div className="text-3xl font-bold">{leftAmount}</div>
              <p className="text-xs text-muted-foreground">{unit}</p>
            </div>
            <Button
              className="h-10 w-10 rounded-full bg-transparent"
              onClick={() => setLeftAmount(leftAmount + step)}
              size="icon"
              variant="outline"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Right Side */}
        <div className="bg-card rounded-2xl p-6">
          <p className="text-sm font-medium text-muted-foreground mb-4 text-center">
            Right
          </p>
          <div className="flex items-center justify-center gap-3">
            <Button
              className="h-10 w-10 rounded-full bg-transparent"
              onClick={() =>
                setRightAmount(Math.max(minAmount, rightAmount - step))
              }
              size="icon"
              variant="outline"
            >
              <Minus className="h-4 w-4" />
            </Button>
            <div className="text-center min-w-[60px]">
              <div className="text-3xl font-bold">{rightAmount}</div>
              <p className="text-xs text-muted-foreground">{unit}</p>
            </div>
            <Button
              className="h-10 w-10 rounded-full bg-transparent"
              onClick={() => setRightAmount(rightAmount + step)}
              size="icon"
              variant="outline"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Total */}
      <div className="bg-activity-pumping/10 rounded-2xl p-6 border-2 border-activity-pumping">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Droplets className="h-5 w-5 text-activity-pumping" />
            <p className="font-semibold">Total Amount</p>
          </div>
          <p className="text-2xl font-bold">
            {leftAmount + rightAmount} {unit}
          </p>
        </div>
      </div>

      {/* Colostrum Badge */}
      {showColostrumBadge && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <Info className="size-5 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-900">
                Colostrum Phase
              </p>
              <p className="text-xs text-amber-700 mt-1">
                Small volumes are completely normal in the first few days. Your
                body is producing nutrient-rich colostrum.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Method */}
      <div className="space-y-3">
        <p className="text-sm font-medium text-muted-foreground">Method</p>
        <div className="grid grid-cols-2 gap-3">
          <Button
            className={`h-12 ${
              selectedMethod === 'electric'
                ? 'bg-activity-pumping text-activity-pumping-foreground hover:bg-activity-pumping/90'
                : 'bg-transparent'
            }`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setSelectedMethod('electric');
            }}
            type="button"
            variant={selectedMethod === 'electric' ? 'default' : 'outline'}
          >
            Electric
          </Button>
          <Button
            className={`h-12 ${
              selectedMethod === 'manual'
                ? 'bg-activity-pumping text-activity-pumping-foreground hover:bg-activity-pumping/90'
                : 'bg-transparent'
            }`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setSelectedMethod('manual');
            }}
            type="button"
            variant={selectedMethod === 'manual' ? 'default' : 'outline'}
          >
            Manual
          </Button>
        </div>
      </div>

      {/* Notes */}
      {/* <div className="space-y-3">
        <p className="text-sm font-medium text-muted-foreground">
          Notes (optional)
        </p>
        <textarea
          className="w-full h-24 p-4 rounded-xl bg-card border border-border resize-none focus:outline-none focus:ring-2 focus:ring-ring"
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add any notes about this pumping session..."
          value={notes}
        />
      </div> */}
    </div>
  );
}
