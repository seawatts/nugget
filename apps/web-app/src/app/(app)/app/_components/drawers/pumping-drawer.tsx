'use client';

import { Button } from '@nugget/ui/button';
import { Droplets, Minus, Plus } from 'lucide-react';
import { useState } from 'react';

export function PumpingDrawerContent() {
  const [leftAmount, setLeftAmount] = useState(2);
  const [rightAmount, setRightAmount] = useState(2);

  return (
    <div className="space-y-6">
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
              onClick={() => setLeftAmount(Math.max(0, leftAmount - 0.5))}
              size="icon"
              variant="outline"
            >
              <Minus className="h-4 w-4" />
            </Button>
            <div className="text-center min-w-[60px]">
              <div className="text-3xl font-bold">{leftAmount}</div>
              <p className="text-xs text-muted-foreground">oz</p>
            </div>
            <Button
              className="h-10 w-10 rounded-full bg-transparent"
              onClick={() => setLeftAmount(leftAmount + 0.5)}
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
              onClick={() => setRightAmount(Math.max(0, rightAmount - 0.5))}
              size="icon"
              variant="outline"
            >
              <Minus className="h-4 w-4" />
            </Button>
            <div className="text-center min-w-[60px]">
              <div className="text-3xl font-bold">{rightAmount}</div>
              <p className="text-xs text-muted-foreground">oz</p>
            </div>
            <Button
              className="h-10 w-10 rounded-full bg-transparent"
              onClick={() => setRightAmount(rightAmount + 0.5)}
              size="icon"
              variant="outline"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Total */}
      <div className="bg-[oklch(0.65_0.18_280)]/10 rounded-2xl p-6 border-2 border-[oklch(0.65_0.18_280)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Droplets className="h-5 w-5 text-[oklch(0.65_0.18_280)]" />
            <p className="font-semibold">Total Amount</p>
          </div>
          <p className="text-2xl font-bold">{leftAmount + rightAmount} oz</p>
        </div>
      </div>

      {/* Duration */}
      <div className="space-y-3">
        <p className="text-sm font-medium text-muted-foreground">Duration</p>
        <div className="grid grid-cols-4 gap-2">
          {[10, 15, 20, 30].map((min) => (
            <Button className="h-12 bg-transparent" key={min} variant="outline">
              {min}m
            </Button>
          ))}
        </div>
      </div>

      {/* Method */}
      <div className="space-y-3">
        <p className="text-sm font-medium text-muted-foreground">Method</p>
        <div className="grid grid-cols-2 gap-3">
          <Button className="h-12 bg-transparent" variant="outline">
            Electric
          </Button>
          <Button className="h-12 bg-transparent" variant="outline">
            Manual
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
          placeholder="Add any notes about this pumping session..."
        />
      </div>
    </div>
  );
}
