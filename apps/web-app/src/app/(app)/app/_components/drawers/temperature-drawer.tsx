'use client';

import { Button } from '@nugget/ui/button';
import { Input } from '@nugget/ui/input';
import { Textarea } from '@nugget/ui/textarea';
import { useState } from 'react';

export function TemperatureDrawer() {
  const [temperature, setTemperature] = useState('98.6');
  const [unit, setUnit] = useState<'F' | 'C'>('F');
  const [method, setMethod] = useState('oral');
  const [notes, setNotes] = useState('');

  const methods = ['Oral', 'Rectal', 'Armpit', 'Forehead', 'Ear'];

  const handleSave = () => {
    // TODO: Implement save functionality
  };

  return (
    <div className="space-y-6">
      <div>
        <label
          className="mb-3 block text-sm font-medium text-muted-foreground"
          htmlFor="temperature-value"
        >
          Temperature
        </label>
        <div className="flex items-center gap-3">
          <Input
            className="text-center text-3xl font-bold"
            id="temperature-value"
            onChange={(e) => setTemperature(e.target.value)}
            step="0.1"
            type="number"
            value={temperature}
          />
          <div className="flex gap-1">
            <Button
              onClick={() => setUnit('F')}
              size="sm"
              variant={unit === 'F' ? 'default' : 'outline'}
            >
              °F
            </Button>
            <Button
              onClick={() => setUnit('C')}
              size="sm"
              variant={unit === 'C' ? 'default' : 'outline'}
            >
              °C
            </Button>
          </div>
        </div>
      </div>

      <div>
        <p className="mb-3 block text-sm font-medium text-muted-foreground">
          Method
        </p>
        <div className="grid grid-cols-3 gap-2">
          {methods.map((m) => (
            <Button
              className="text-sm"
              key={m}
              onClick={() => setMethod(m.toLowerCase())}
              variant={method === m.toLowerCase() ? 'default' : 'outline'}
            >
              {m}
            </Button>
          ))}
        </div>
      </div>

      <div>
        <label
          className="mb-2 block text-sm font-medium text-muted-foreground"
          htmlFor="temperature-notes"
        >
          Notes
        </label>
        <Textarea
          className="min-h-[100px]"
          id="temperature-notes"
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any symptoms or observations..."
          value={notes}
        />
      </div>

      <Button className="w-full" onClick={handleSave} size="lg">
        Save Temperature
      </Button>
    </div>
  );
}
