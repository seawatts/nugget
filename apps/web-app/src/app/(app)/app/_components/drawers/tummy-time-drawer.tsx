'use client';

import { Button } from '@nugget/ui/button';
import { Icons } from '@nugget/ui/custom/icons';
import { Input } from '@nugget/ui/input';
import { Textarea } from '@nugget/ui/textarea';
import { useAction } from 'next-safe-action/hooks';
import { useState } from 'react';
import { toast } from 'sonner';
import { createActivityWithDetailsAction } from '../activity-cards.actions';

interface TummyTimeDrawerProps {
  onClose?: () => void;
  onSaved?: () => void;
}

export function TummyTimeDrawer({ onClose, onSaved }: TummyTimeDrawerProps) {
  const [duration, setDuration] = useState(5);
  const [notes, setNotes] = useState('');

  const { execute: createActivity, isExecuting } = useAction(
    createActivityWithDetailsAction,
    {
      onError: ({ error }) => {
        toast.error('Error', {
          description: error.serverError || 'Failed to save tummy time.',
        });
      },
      onSuccess: () => {
        toast.success('Tummy time logged', {
          description: 'Tummy time activity has been recorded successfully.',
        });
        onSaved?.();
        onClose?.();
      },
    },
  );

  const handleSave = () => {
    createActivity({
      activityType: 'tummy_time',
      duration,
      notes: notes || undefined,
      startTime: new Date(),
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <label
          className="mb-3 block text-sm font-medium text-muted-foreground"
          htmlFor="tummy-time-duration"
        >
          Duration (minutes)
        </label>
        <div className="flex items-center gap-3">
          <Button
            onClick={() => setDuration(Math.max(1, duration - 1))}
            size="icon"
            variant="outline"
          >
            -
          </Button>
          <Input
            className="text-center text-2xl font-bold"
            id="tummy-time-duration"
            onChange={(e) => setDuration(Number(e.target.value))}
            type="number"
            value={duration}
          />
          <Button
            onClick={() => setDuration(duration + 1)}
            size="icon"
            variant="outline"
          >
            +
          </Button>
        </div>
        <div className="mt-3 grid grid-cols-4 gap-2">
          {[3, 5, 10, 15].map((min) => (
            <Button
              key={min}
              onClick={() => setDuration(min)}
              size="sm"
              variant="outline"
            >
              {min}m
            </Button>
          ))}
        </div>
      </div>

      <div>
        <label
          className="mb-2 block text-sm font-medium text-muted-foreground"
          htmlFor="tummy-time-notes"
        >
          Notes
        </label>
        <Textarea
          className="min-h-[100px]"
          id="tummy-time-notes"
          onChange={(e) => setNotes(e.target.value)}
          placeholder="How did it go?"
          value={notes}
        />
      </div>

      <Button
        className="w-full"
        disabled={isExecuting || duration < 1}
        onClick={handleSave}
        size="lg"
      >
        {isExecuting ? (
          <>
            <Icons.Spinner className="animate-spin" size="sm" />
            Saving...
          </>
        ) : (
          'Save Tummy Time'
        )}
      </Button>
    </div>
  );
}
