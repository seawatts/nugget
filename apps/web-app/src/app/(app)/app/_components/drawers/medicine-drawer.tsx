'use client';

import { Button } from '@nugget/ui/button';
import { Input } from '@nugget/ui/input';
import { Textarea } from '@nugget/ui/textarea';
import { useState } from 'react';

export function MedicineDrawer() {
  const [medicineName, setMedicineName] = useState('');
  const [dosage, setDosage] = useState('');
  const [unit, setUnit] = useState('ml');
  const [notes, setNotes] = useState('');

  const handleSave = () => {
    console.log('[v0] Saving medicine:', {
      dosage,
      medicineName,
      notes,
      timestamp: new Date(),
      unit,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <label
          className="mb-2 block text-sm font-medium text-muted-foreground"
          htmlFor="medicine-name"
        >
          Medicine Name
        </label>
        <Input
          id="medicine-name"
          onChange={(e) => setMedicineName(e.target.value)}
          placeholder="e.g., Tylenol, Vitamin D"
          value={medicineName}
        />
      </div>

      <div>
        <p className="mb-2 block text-sm font-medium text-muted-foreground">
          Dosage
        </p>
        <div className="flex gap-2">
          <Input
            className="flex-1"
            id="medicine-dosage"
            onChange={(e) => setDosage(e.target.value)}
            placeholder="Amount"
            type="number"
            value={dosage}
          />
          <select
            className="rounded-md border border-input bg-background px-3 py-2"
            onChange={(e) => setUnit(e.target.value)}
            value={unit}
          >
            <option value="ml">ml</option>
            <option value="mg">mg</option>
            <option value="drops">drops</option>
            <option value="tsp">tsp</option>
          </select>
        </div>
      </div>

      <div>
        <label
          className="mb-2 block text-sm font-medium text-muted-foreground"
          htmlFor="medicine-notes"
        >
          Notes
        </label>
        <Textarea
          className="min-h-[100px]"
          id="medicine-notes"
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any additional information..."
          value={notes}
        />
      </div>

      <Button className="w-full" onClick={handleSave} size="lg">
        Save Medicine
      </Button>
    </div>
  );
}
