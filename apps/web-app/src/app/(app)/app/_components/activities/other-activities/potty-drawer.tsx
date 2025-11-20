'use client';

import { Button } from '@nugget/ui/button';
import { Icons } from '@nugget/ui/custom/icons';
import { Textarea } from '@nugget/ui/textarea';
import { useAction } from 'next-safe-action/hooks';
import { useState } from 'react';
import { toast } from 'sonner';
import { createActivityWithDetailsAction } from '../activity-cards.actions';

interface PottyDrawerProps {
  onClose?: () => void;
  onSaved?: () => void;
}

export function PottyDrawer({ onClose, onSaved }: PottyDrawerProps) {
  const [type, setType] = useState<'pee' | 'poop' | 'both'>('pee');
  const [notes, setNotes] = useState('');

  const { execute: createActivity, isExecuting } = useAction(
    createActivityWithDetailsAction,
    {
      onError: ({ error }) => {
        toast.error('Error', {
          description: error.serverError || 'Failed to save potty activity.',
        });
      },
      onSuccess: () => {
        toast.success('Potty logged', {
          description: 'Potty activity has been recorded successfully.',
        });
        onSaved?.();
        onClose?.();
      },
    },
  );

  const handleSave = () => {
    createActivity({
      activityType: 'potty',
      notes: notes || undefined,
      startTime: new Date(),
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="mb-3 block text-sm font-medium text-muted-foreground">
          Type
        </p>
        <div className="grid grid-cols-3 gap-2">
          {(['pee', 'poop', 'both'] as const).map((t) => (
            <Button
              className="capitalize"
              key={t}
              onClick={() => setType(t)}
              variant={type === t ? 'default' : 'outline'}
            >
              {t}
            </Button>
          ))}
        </div>
      </div>

      <div>
        <label
          className="mb-2 block text-sm font-medium text-muted-foreground"
          htmlFor="potty-notes"
        >
          Notes
        </label>
        <Textarea
          className="min-h-[100px]"
          id="potty-notes"
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add any notes..."
          value={notes}
        />
      </div>

      <Button
        className="w-full"
        disabled={isExecuting}
        onClick={handleSave}
        size="lg"
      >
        {isExecuting ? (
          <>
            <Icons.Spinner className="animate-spin" size="sm" />
            Saving...
          </>
        ) : (
          'Save Potty'
        )}
      </Button>
    </div>
  );
}
