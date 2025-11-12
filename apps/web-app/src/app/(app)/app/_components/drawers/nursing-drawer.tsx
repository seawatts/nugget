'use client';

import { Button } from '@nugget/ui/button';
import { Droplet, Timer } from 'lucide-react';
import { useState } from 'react';

export function NursingDrawerContent() {
  const [activeSide, setActiveSide] = useState<'left' | 'right' | null>(null);
  const [leftDuration, setLeftDuration] = useState(0);
  const [rightDuration, setRightDuration] = useState(0);

  const handleSideSelect = (side: 'left' | 'right') => {
    setActiveSide(side);
  };

  const handleQuickAdd = (minutes: number) => {
    if (activeSide === 'left') {
      setLeftDuration(minutes);
    } else if (activeSide === 'right') {
      setRightDuration(minutes);
    }
  };

  const resetTracking = () => {
    setActiveSide(null);
    setLeftDuration(0);
    setRightDuration(0);
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
          <p className="text-2xl font-bold mt-2">{leftDuration} min</p>
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
          <p className="text-2xl font-bold mt-2">{rightDuration} min</p>
        </button>
      </div>

      {/* Timer Controls */}
      {activeSide && (
        <div className="bg-card rounded-2xl p-6">
          <div className="flex items-center justify-center gap-4 mb-4">
            <Timer className="h-5 w-5 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Tracking {activeSide} side
            </p>
          </div>
          <Button
            className="w-full h-12 bg-[oklch(0.68_0.18_35)] hover:bg-[oklch(0.68_0.18_35)]/90"
            onClick={resetTracking}
          >
            Stop Timer
          </Button>
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
          placeholder="Add any notes about this feeding..."
        />
      </div>
    </div>
  );
}
