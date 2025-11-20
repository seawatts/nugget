'use client';

import { Button } from '@nugget/ui/button';
import { Baby, Droplets, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';

export interface DiaperFormData {
  type: 'wet' | 'dirty' | 'both' | null;
  size: 'little' | 'medium' | 'large' | null;
  color:
    | 'yellow'
    | 'brown'
    | 'green'
    | 'black'
    | 'red'
    | 'white'
    | 'orange'
    | null;
  consistency:
    | 'solid'
    | 'loose'
    | 'runny'
    | 'mucousy'
    | 'hard'
    | 'pebbles'
    | 'diarrhea'
    | null;
  hasRash: boolean;
  notes: string;
}

interface DiaperDrawerContentProps {
  onDataChange?: (data: DiaperFormData) => void;
}

export function DiaperDrawerContent({
  onDataChange,
}: DiaperDrawerContentProps) {
  const [selectedType, setSelectedType] = useState<
    'wet' | 'dirty' | 'both' | null
  >(null);
  const [size, setSize] = useState<'little' | 'medium' | 'large' | null>(null);
  const [color, setColor] = useState<
    'yellow' | 'brown' | 'green' | 'black' | 'red' | 'white' | 'orange' | null
  >(null);
  const [consistency, setConsistency] = useState<
    | 'solid'
    | 'loose'
    | 'runny'
    | 'mucousy'
    | 'hard'
    | 'pebbles'
    | 'diarrhea'
    | null
  >(null);
  const [hasRash, setHasRash] = useState(false);
  const [notes, setNotes] = useState('');

  // Call onDataChange whenever form data changes
  useEffect(() => {
    onDataChange?.({
      color,
      consistency,
      hasRash,
      notes,
      size,
      type: selectedType,
    });
  }, [selectedType, size, color, consistency, hasRash, notes, onDataChange]);

  const types = [
    {
      color: 'text-blue-500',
      icon: Droplets,
      id: 'wet' as const,
      label: 'Pee',
    },
    {
      color: 'text-amber-600',
      icon: Trash2,
      id: 'dirty' as const,
      label: 'Poop',
    },
    {
      color: 'text-purple-500',
      icon: Baby,
      id: 'both' as const,
      label: 'Both',
    },
  ];

  const sizes = [
    { id: 'little' as const, label: 'Little' },
    { id: 'medium' as const, label: 'Medium' },
    { id: 'large' as const, label: 'Large' },
  ];

  const colors = [
    { dotColor: 'bg-yellow-400', id: 'yellow' as const, label: 'Yellow' },
    { dotColor: 'bg-amber-700', id: 'brown' as const, label: 'Brown' },
    { dotColor: 'bg-green-600', id: 'green' as const, label: 'Green' },
    { dotColor: 'bg-gray-900', id: 'black' as const, label: 'Black' },
    { dotColor: 'bg-red-600', id: 'red' as const, label: 'Red' },
    {
      dotColor: 'bg-gray-100 border-2 border-gray-300',
      id: 'white' as const,
      label: 'White',
    },
    { dotColor: 'bg-orange-500', id: 'orange' as const, label: 'Orange' },
  ];

  const consistencies = [
    { id: 'solid' as const, label: 'Solid' },
    { id: 'loose' as const, label: 'Loose' },
    { id: 'runny' as const, label: 'Runny' },
    { id: 'mucousy' as const, label: 'Mucousy' },
    { id: 'hard' as const, label: 'Hard' },
    { id: 'pebbles' as const, label: 'Pebbles' },
    { id: 'diarrhea' as const, label: 'Diarrhea' },
  ];

  const toggleType = (id: 'wet' | 'dirty' | 'both') => {
    setSelectedType(id);
  };

  const showSize = selectedType !== null;
  const showColorAndConsistency =
    selectedType === 'dirty' || selectedType === 'both';

  return (
    <div className="space-y-6">
      {/* Diaper Type */}
      <div className="space-y-3">
        <p className="text-sm font-medium text-muted-foreground">Diaper Type</p>
        <div className="grid grid-cols-3 gap-3">
          {types.map((type) => {
            const Icon = type.icon;
            const isSelected = selectedType === type.id;
            return (
              <button
                className={`p-6 rounded-2xl border-2 transition-all ${
                  isSelected
                    ? 'border-activity-diaper bg-activity-diaper/10'
                    : 'border-border bg-card'
                }`}
                key={type.id}
                onClick={() => toggleType(type.id)}
                type="button"
              >
                <Icon className={`h-8 w-8 mx-auto mb-2 ${type.color}`} />
                <p className="font-semibold">{type.label}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Size Selector - Shows for all types when selected */}
      {showSize && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">Size</p>
          <div className="grid grid-cols-3 gap-3">
            {sizes.map((sizeOption) => (
              <Button
                className={`h-12 ${
                  size === sizeOption.id
                    ? 'bg-activity-diaper text-activity-diaper-foreground hover:bg-activity-diaper/90'
                    : 'bg-transparent'
                }`}
                key={sizeOption.id}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setSize(sizeOption.id);
                }}
                type="button"
                variant={size === sizeOption.id ? 'default' : 'outline'}
              >
                {sizeOption.label}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Color Selector - Shows for Poop and Both */}
      {showColorAndConsistency && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">Color</p>
          <div className="grid grid-cols-7 gap-3">
            {colors.map((colorOption) => (
              <button
                aria-label={colorOption.label}
                className={`h-12 w-12 rounded-full transition-all ${colorOption.dotColor} ${
                  color === colorOption.id
                    ? 'ring-4 ring-activity-diaper ring-offset-2'
                    : 'hover:ring-2 hover:ring-border hover:ring-offset-2'
                }`}
                key={colorOption.id}
                onClick={() => setColor(colorOption.id)}
                title={colorOption.label}
                type="button"
              />
            ))}
          </div>
        </div>
      )}

      {/* Consistency Selector - Shows for Poop and Both */}
      {showColorAndConsistency && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">
            Consistency
          </p>
          <div className="grid grid-cols-2 gap-3">
            {consistencies.map((consistencyOption) => (
              <Button
                className={`h-12 ${
                  consistency === consistencyOption.id
                    ? 'bg-activity-diaper text-activity-diaper-foreground hover:bg-activity-diaper/90'
                    : 'bg-transparent'
                }`}
                key={consistencyOption.id}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setConsistency(consistencyOption.id);
                }}
                type="button"
                variant={
                  consistency === consistencyOption.id ? 'default' : 'outline'
                }
              >
                {consistencyOption.label}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Rash */}
      <div className="space-y-3">
        <p className="text-sm font-medium text-muted-foreground">
          Diaper Rash?
        </p>
        <div className="grid grid-cols-2 gap-3">
          <Button
            className={`h-12 ${
              !hasRash
                ? 'bg-activity-diaper text-activity-diaper-foreground hover:bg-activity-diaper/90'
                : 'bg-transparent'
            }`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setHasRash(false);
            }}
            type="button"
            variant={!hasRash ? 'default' : 'outline'}
          >
            No Rash
          </Button>
          <Button
            className={`h-12 ${
              hasRash
                ? 'bg-activity-diaper text-activity-diaper-foreground hover:bg-activity-diaper/90'
                : 'bg-transparent'
            }`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setHasRash(true);
            }}
            type="button"
            variant={hasRash ? 'default' : 'outline'}
          >
            Has Rash
          </Button>
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-3">
        <p className="text-sm font-medium text-muted-foreground">
          Notes (optional)
        </p>
        <textarea
          className="w-full h-24 p-4 rounded-xl bg-card border border-border resize-none focus:outline-none focus:ring-2 focus:ring-ring"
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add any notes about this diaper change..."
          value={notes}
        />
      </div>
    </div>
  );
}
