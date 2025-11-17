'use client';

import { Button } from '@nugget/ui/button';
import { Icons } from '@nugget/ui/custom/icons';
import { Input } from '@nugget/ui/input';
import { Textarea } from '@nugget/ui/textarea';
import { useAction } from 'next-safe-action/hooks';
import { useState } from 'react';
import { toast } from 'sonner';
import { createActivityWithDetailsAction } from '../activity-cards.actions';

interface GrowthDrawerProps {
  onClose?: () => void;
  onSaved?: () => void;
}

export function GrowthDrawer({ onClose, onSaved }: GrowthDrawerProps) {
  const [weight, setWeight] = useState('');
  const [weightUnit, setWeightUnit] = useState('lbs');
  const [height, setHeight] = useState('');
  const [heightUnit, setHeightUnit] = useState('in');
  const [headCircumference, setHeadCircumference] = useState('');
  const [notes, setNotes] = useState('');

  const { execute: createActivity, isExecuting } = useAction(
    createActivityWithDetailsAction,
    {
      onError: ({ error }) => {
        toast.error('Error', {
          description: error.serverError || 'Failed to save growth data.',
        });
      },
      onSuccess: () => {
        toast.success('Growth recorded', {
          description: 'Growth measurements have been saved successfully.',
        });
        onSaved?.();
        onClose?.();
      },
    },
  );

  const handleSave = () => {
    // TODO: Create a proper GrowthRecord instead of just logging an activity
    // Growth data should be stored in the GrowthRecords table
    const growthNotes = [
      weight && `Weight: ${weight} ${weightUnit}`,
      height && `Height: ${height} ${heightUnit}`,
      headCircumference && `Head Circumference: ${headCircumference} in`,
      notes,
    ]
      .filter(Boolean)
      .join('\n');

    createActivity({
      activityType: 'growth',
      details: undefined,
      notes: growthNotes || undefined,
      startTime: new Date(),
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <label
          className="mb-2 block text-sm font-medium text-muted-foreground"
          htmlFor="growth-weight"
        >
          Weight
        </label>
        <div className="flex gap-2">
          <Input
            className="flex-1"
            id="growth-weight"
            onChange={(e) => setWeight(e.target.value)}
            placeholder="0.0"
            step="0.1"
            type="number"
            value={weight}
          />
          <select
            className="rounded-md border border-input bg-background px-3 py-2"
            onChange={(e) => setWeightUnit(e.target.value)}
            value={weightUnit}
          >
            <option value="lbs">lbs</option>
            <option value="kg">kg</option>
            <option value="oz">oz</option>
          </select>
        </div>
      </div>

      <div>
        <label
          className="mb-2 block text-sm font-medium text-muted-foreground"
          htmlFor="growth-height"
        >
          Height/Length
        </label>
        <div className="flex gap-2">
          <Input
            className="flex-1"
            id="growth-height"
            onChange={(e) => setHeight(e.target.value)}
            placeholder="0.0"
            step="0.1"
            type="number"
            value={height}
          />
          <select
            className="rounded-md border border-input bg-background px-3 py-2"
            onChange={(e) => setHeightUnit(e.target.value)}
            value={heightUnit}
          >
            <option value="in">in</option>
            <option value="cm">cm</option>
          </select>
        </div>
      </div>

      <div>
        <label
          className="mb-2 block text-sm font-medium text-muted-foreground"
          htmlFor="growth-head-circumference"
        >
          Head Circumference (in)
        </label>
        <Input
          id="growth-head-circumference"
          onChange={(e) => setHeadCircumference(e.target.value)}
          placeholder="0.0"
          step="0.1"
          type="number"
          value={headCircumference}
        />
      </div>

      <div>
        <label
          className="mb-2 block text-sm font-medium text-muted-foreground"
          htmlFor="growth-notes"
        >
          Notes
        </label>
        <Textarea
          className="min-h-[100px]"
          id="growth-notes"
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Doctor visit notes, milestones..."
          value={notes}
        />
      </div>

      <Button
        className="w-full"
        disabled={isExecuting || (!weight && !height && !headCircumference)}
        onClick={handleSave}
        size="lg"
      >
        {isExecuting ? (
          <>
            <Icons.Spinner className="animate-spin" size="sm" />
            Saving...
          </>
        ) : (
          'Save Growth'
        )}
      </Button>
    </div>
  );
}
