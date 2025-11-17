'use client';

import { Button } from '@nugget/ui/button';
import { Icons } from '@nugget/ui/custom/icons';
import { Input } from '@nugget/ui/input';
import { Textarea } from '@nugget/ui/textarea';
import { useAction } from 'next-safe-action/hooks';
import { useState } from 'react';
import { toast } from 'sonner';
import { createActivityWithDetailsAction } from '../activity-cards.actions';

interface ActivityDrawerContentProps {
  onClose?: () => void;
  onSaved?: () => void;
}

export function ActivityDrawerContent({
  onClose,
  onSaved,
}: ActivityDrawerContentProps) {
  const [activityType, setActivityType] = useState('play');
  const [duration, setDuration] = useState(30);
  const [notes, setNotes] = useState('');

  const activities = ['Play', 'Walk', 'Park', 'Reading', 'Music', 'Other'];

  const { execute: createActivity, isExecuting } = useAction(
    createActivityWithDetailsAction,
    {
      onError: ({ error }) => {
        toast.error('Error', {
          description: error.serverError || 'Failed to save activity.',
        });
      },
      onSuccess: () => {
        toast.success('Activity logged', {
          description: 'Activity has been recorded successfully.',
        });
        onSaved?.();
        onClose?.();
      },
    },
  );

  const handleSave = () => {
    createActivity({
      activityType: 'bath',
      duration,
      notes: notes || undefined,
      startTime: new Date(),
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="mb-3 block text-sm font-medium text-muted-foreground">
          Activity Type
        </p>
        <div className="grid grid-cols-3 gap-2">
          {activities.map((activity) => (
            <Button
              className="text-sm"
              key={activity}
              onClick={() => setActivityType(activity.toLowerCase())}
              variant={
                activityType === activity.toLowerCase() ? 'default' : 'outline'
              }
            >
              {activity}
            </Button>
          ))}
        </div>
      </div>

      <div>
        <label
          className="mb-3 block text-sm font-medium text-muted-foreground"
          htmlFor="activity-duration"
        >
          Duration (minutes)
        </label>
        <div className="flex items-center gap-3">
          <Button
            onClick={() => setDuration(Math.max(5, duration - 5))}
            size="icon"
            variant="outline"
          >
            -
          </Button>
          <Input
            className="text-center"
            id="activity-duration"
            onChange={(e) => setDuration(Number(e.target.value))}
            type="number"
            value={duration}
          />
          <Button
            onClick={() => setDuration(duration + 5)}
            size="icon"
            variant="outline"
          >
            +
          </Button>
        </div>
      </div>

      <div>
        <label
          className="mb-2 block text-sm font-medium text-muted-foreground"
          htmlFor="activity-notes"
        >
          Notes
        </label>
        <Textarea
          className="min-h-[100px]"
          id="activity-notes"
          onChange={(e) => setNotes(e.target.value)}
          placeholder="What did you do?"
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
          'Save Activity'
        )}
      </Button>
    </div>
  );
}
