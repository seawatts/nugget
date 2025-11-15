'use client';

import { api } from '@nugget/api/react';
import { Button } from '@nugget/ui/button';
import { cn } from '@nugget/ui/lib/utils';
import {
  ArrowLeft,
  Droplet,
  Droplets,
  Milk,
  UtensilsCrossed,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import type { BottleFormData } from './bottle-drawer';
import { BottleDrawerContent } from './bottle-drawer';
import type { NursingFormData } from './nursing-drawer';
import { NursingDrawerContent } from './nursing-drawer';
import { PumpingDrawerContent } from './pumping-drawer';
import { SolidsDrawerContent } from './solids-drawer';

type FeedingType = 'bottle' | 'nursing' | 'solids' | 'pumping' | null;

export interface FeedingFormData {
  type: 'bottle' | 'nursing' | 'solids' | 'pumping';
  amountMl?: number;
  bottleType?: 'breast_milk' | 'formula' | null;
  leftDuration?: number;
  rightDuration?: number;
  notes?: string;
}

interface FeedingDrawerContentProps {
  onTypeSelect?: (type: FeedingType) => void;
  existingActivityType?: 'bottle' | 'nursing' | 'solids' | 'pumping' | null;
  onFormDataChange?: (data: FeedingFormData | null) => void;
}

const feedingTypes = [
  {
    color: 'bg-[oklch(0.68_0.18_35)]',
    description: 'Breast milk or formula',
    icon: Milk,
    id: 'bottle' as const,
    label: 'Bottle',
    textColor: 'text-white',
  },
  {
    color: 'bg-[oklch(0.68_0.18_35)]',
    description: 'Breastfeeding session',
    icon: Droplet,
    id: 'nursing' as const,
    label: 'Nursing',
    textColor: 'text-white',
  },
  {
    color: 'bg-[oklch(0.72_0.16_330)]',
    description: 'Food and meals',
    icon: UtensilsCrossed,
    id: 'solids' as const,
    label: 'Solids',
    textColor: 'text-white',
  },
  {
    color: 'bg-[oklch(0.65_0.18_280)]',
    description: 'Breast milk expression',
    icon: Droplets,
    id: 'pumping' as const,
    label: 'Pumping',
    textColor: 'text-white',
  },
];

export function FeedingDrawerContent({
  onTypeSelect,
  existingActivityType,
  onFormDataChange,
}: FeedingDrawerContentProps) {
  const [selectedType, setSelectedType] = useState<FeedingType>(null);
  const [bottleData, setBottleData] = useState<BottleFormData | null>(null);
  const [nursingData, setNursingData] = useState<NursingFormData | null>(null);

  // Fetch user preferences
  const { data: user } = api.user.current.useQuery();
  const userUnitPref = user?.unitPref || 'ML';

  // If editing an existing feeding activity, skip selection and show the form
  useEffect(() => {
    if (existingActivityType) {
      setSelectedType(existingActivityType);
    }
  }, [existingActivityType]);

  // Call onFormDataChange whenever form data changes
  useEffect(() => {
    if (!selectedType) {
      onFormDataChange?.(null);
      return;
    }

    if (selectedType === 'bottle' && bottleData) {
      onFormDataChange?.({
        amountMl: bottleData.amountMl,
        bottleType: bottleData.bottleType,
        notes: bottleData.notes,
        type: 'bottle',
      });
    } else if (selectedType === 'nursing' && nursingData) {
      onFormDataChange?.({
        leftDuration: nursingData.leftDuration,
        notes: nursingData.notes,
        rightDuration: nursingData.rightDuration,
        type: 'nursing',
      });
    }
  }, [selectedType, bottleData, nursingData, onFormDataChange]);

  const handleTypeSelect = (type: FeedingType) => {
    setSelectedType(type);
    onTypeSelect?.(type);
  };

  const handleBack = () => {
    // Don't allow going back if editing an existing activity
    if (existingActivityType) return;
    setSelectedType(null);
    onTypeSelect?.(null);
  };

  // If a type is selected, show the specific form
  if (selectedType) {
    return (
      <div className="space-y-6">
        {/* Back Button - Only show if not editing existing activity */}
        {!existingActivityType && (
          <Button
            className="w-full h-12 text-base bg-transparent"
            onClick={handleBack}
            variant="outline"
          >
            <ArrowLeft className="mr-2 h-5 w-5" />
            Back to Feeding Types
          </Button>
        )}

        {/* Render the specific feeding form */}
        {selectedType === 'bottle' && (
          <BottleDrawerContent
            onDataChange={setBottleData}
            unitPref={userUnitPref}
          />
        )}
        {selectedType === 'nursing' && (
          <NursingDrawerContent onDataChange={setNursingData} />
        )}
        {selectedType === 'solids' && <SolidsDrawerContent />}
        {selectedType === 'pumping' && <PumpingDrawerContent />}
      </div>
    );
  }

  // Selection screen
  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-foreground mb-2">
          What type of feeding?
        </h3>
        <p className="text-sm text-muted-foreground">
          Select a feeding type to continue
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {feedingTypes.map((type) => {
          const Icon = type.icon;
          return (
            <button
              className={cn(
                'p-6 rounded-2xl border-2 border-transparent transition-all hover:scale-[1.02] active:scale-[0.98]',
                type.color,
              )}
              key={type.id}
              onClick={() => handleTypeSelect(type.id)}
              type="button"
            >
              <Icon className={cn('h-12 w-12 mx-auto mb-3', type.textColor)} />
              <p className={cn('font-semibold text-lg mb-1', type.textColor)}>
                {type.label}
              </p>
              <p className={cn('text-sm opacity-80', type.textColor)}>
                {type.description}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
