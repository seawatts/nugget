'use client';

import { Button } from '@nugget/ui/button';
import { Textarea } from '@nugget/ui/textarea';
import { useState } from 'react';

export function PottyDrawer() {
  const [type, setType] = useState<'pee' | 'poop' | 'both'>('pee');
  const [notes, setNotes] = useState('');

  const handleSave = () => {
    console.log('[v0] Saving potty:', { notes, timestamp: new Date(), type });
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

      <Button className="w-full" onClick={handleSave} size="lg">
        Save Potty
      </Button>
    </div>
  );
}
