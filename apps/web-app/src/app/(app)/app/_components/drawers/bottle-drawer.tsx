'use client';

import { Button } from '@nugget/ui/button';
import { Milk, Minus, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';

export interface BottleFormData {
  amountMl: number;
  bottleType: 'breast_milk' | 'formula' | null;
  notes: string;
}

interface BottleDrawerContentProps {
  unitPref?: 'ML' | 'OZ';
  onDataChange?: (data: BottleFormData) => void;
}

// Conversion helpers
const ozToMl = (oz: number) => Math.round(oz * 29.5735);

export function BottleDrawerContent({
  unitPref = 'OZ',
  onDataChange,
}: BottleDrawerContentProps) {
  // Store amount internally in the user's preferred unit
  const [amount, setAmount] = useState(unitPref === 'OZ' ? 4 : 120);
  const [bottleType, setBottleType] = useState<
    'breast_milk' | 'formula' | null
  >(null);
  const [notes, setNotes] = useState('');

  // Call onDataChange whenever form data changes
  useEffect(() => {
    const amountMl = unitPref === 'OZ' ? ozToMl(amount) : amount;
    onDataChange?.({
      amountMl,
      bottleType,
      notes,
    });
  }, [amount, bottleType, notes, unitPref, onDataChange]);

  // Get increment/decrement step based on unit
  const step = unitPref === 'OZ' ? 0.5 : 30;
  const minAmount = unitPref === 'OZ' ? 0.5 : 30;

  // Get quick select values based on unit
  const quickSelectValues =
    unitPref === 'OZ' ? [2, 4, 6, 8] : [60, 120, 180, 240];

  return (
    <div className="space-y-6">
      {/* Amount Selector */}
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

      {/* Quick Amounts */}
      <div className="space-y-3">
        <p className="text-sm font-medium text-muted-foreground">
          Quick Select
        </p>
        <div className="grid grid-cols-4 gap-2">
          {quickSelectValues.map((value) => (
            <Button
              className="h-12 bg-transparent"
              key={value}
              onClick={() => setAmount(value)}
              variant="outline"
            >
              {value} {unitPref === 'OZ' ? 'oz' : 'ml'}
            </Button>
          ))}
        </div>
      </div>

      {/* Bottle Type */}
      <div className="space-y-3">
        <p className="text-sm font-medium text-muted-foreground">Type</p>
        <div className="grid grid-cols-2 gap-3">
          <Button
            className={`h-12 ${
              bottleType === 'breast_milk'
                ? 'border-[oklch(0.68_0.18_35)] bg-[oklch(0.68_0.18_35)]/10'
                : 'bg-transparent'
            }`}
            onClick={() => setBottleType('breast_milk')}
            variant="outline"
          >
            <Milk className="mr-2 h-4 w-4" />
            Breast Milk
          </Button>
          <Button
            className={`h-12 ${
              bottleType === 'formula'
                ? 'border-[oklch(0.68_0.18_35)] bg-[oklch(0.68_0.18_35)]/10'
                : 'bg-transparent'
            }`}
            onClick={() => setBottleType('formula')}
            variant="outline"
          >
            <Milk className="mr-2 h-4 w-4" />
            Formula
          </Button>
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
