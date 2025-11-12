'use client';

import { Button } from '@nugget/ui/button';
import { Baby, Droplets, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';

export function DiaperDrawerContent() {
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [babyAgeDays, setBabyAgeDays] = useState<number | null>(null);

  useEffect(() => {
    const onboardingData = localStorage.getItem('onboardingData');
    if (onboardingData) {
      const data = JSON.parse(onboardingData);
      if (data.birthDate) {
        const birth = new Date(data.birthDate);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - birth.getTime());
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        setBabyAgeDays(diffDays);
      }
    }
  }, []);

  const getConditionOptions = () => {
    if (babyAgeDays !== null && babyAgeDays <= 3) {
      return ['Meconium (Black/Tar)', 'Transitional', 'Seedy Yellow'];
    }
    return ['Normal', 'Runny', 'Hard', 'Unusual'];
  };

  const types = [
    { color: 'text-blue-500', icon: Droplets, id: 'wet', label: 'Wet' },
    { color: 'text-amber-600', icon: Trash2, id: 'dirty', label: 'Dirty' },
    { color: 'text-purple-500', icon: Baby, id: 'both', label: 'Both' },
  ];

  const toggleType = (id: string) => {
    setSelectedTypes([id]);
  };

  return (
    <div className="space-y-6">
      {/* Diaper Type */}
      <div className="space-y-3">
        <p className="text-sm font-medium text-muted-foreground">Diaper Type</p>
        <div className="grid grid-cols-3 gap-3">
          {types.map((type) => {
            const Icon = type.icon;
            const isSelected = selectedTypes.includes(type.id);
            return (
              <button
                className={`p-6 rounded-2xl border-2 transition-all ${
                  isSelected
                    ? 'border-[oklch(0.78_0.14_60)] bg-[oklch(0.78_0.14_60)]/10'
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

      {/* Condition */}
      <div className="space-y-3">
        <p className="text-sm font-medium text-muted-foreground">
          {babyAgeDays !== null && babyAgeDays <= 3
            ? 'Stool Type'
            : 'Condition'}
        </p>
        <div className="grid grid-cols-2 gap-3">
          {getConditionOptions().map((condition) => (
            <Button
              className="h-12 bg-transparent text-sm"
              key={condition}
              variant="outline"
            >
              {condition}
            </Button>
          ))}
        </div>
      </div>

      {/* Rash */}
      <div className="space-y-3">
        <p className="text-sm font-medium text-muted-foreground">
          Diaper Rash?
        </p>
        <div className="grid grid-cols-2 gap-3">
          <Button className="h-12 bg-transparent" variant="outline">
            No Rash
          </Button>
          <Button className="h-12 bg-transparent" variant="outline">
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
          placeholder="Add any notes about this diaper change..."
        />
      </div>
    </div>
  );
}
