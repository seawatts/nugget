'use client';

import { Button } from '@nugget/ui/button';
import { Input } from '@nugget/ui/input';
import { Textarea } from '@nugget/ui/textarea';
import { useState } from 'react';

export function GrowthDrawer() {
  const [weight, setWeight] = useState('');
  const [weightUnit, setWeightUnit] = useState('lbs');
  const [height, setHeight] = useState('');
  const [heightUnit, setHeightUnit] = useState('in');
  const [headCircumference, setHeadCircumference] = useState('');
  const [notes, setNotes] = useState('');

  const handleSave = () => {
    console.log('[v0] Saving growth:', {
      headCircumference,
      height,
      heightUnit,
      notes,
      timestamp: new Date(),
      weight,
      weightUnit,
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

      <Button className="w-full" onClick={handleSave} size="lg">
        Save Growth
      </Button>
    </div>
  );
}
