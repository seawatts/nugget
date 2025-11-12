'use client';

import { Button } from '@nugget/ui/button';
import { Input } from '@nugget/ui/input';
import { Textarea } from '@nugget/ui/textarea';
import { useState } from 'react';

export function ActivityDrawerContent() {
  const [activityType, setActivityType] = useState('play');
  const [duration, setDuration] = useState(30);
  const [notes, setNotes] = useState('');

  const activities = ['Play', 'Walk', 'Park', 'Reading', 'Music', 'Other'];

  const handleSave = () => {
    console.log('[v0] Saving activity:', {
      activityType,
      duration,
      notes,
      timestamp: new Date(),
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

      <Button className="w-full" onClick={handleSave} size="lg">
        Save Activity
      </Button>
    </div>
  );
}
