'use client';

/**
 * Feeding Type Selector
 * Handles selection between different feeding types (bottle, nursing, solids)
 * and routes to the appropriate form component
 */

import { api } from '@nugget/api/react';
import { Button } from '@nugget/ui/button';
import { cn } from '@nugget/ui/lib/utils';
import { ArrowLeft, Droplet, Milk, UtensilsCrossed } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getVolumeUnit } from '../shared/volume-utils';
import type { BottleFormData } from './bottle-drawer';
import { BottleDrawerContent } from './bottle-drawer';
import type { NursingFormData } from './nursing-drawer';
import { NursingDrawerContent } from './nursing-drawer';
import { SolidsDrawerContent } from './solids-drawer';

type FeedingType = 'bottle' | 'nursing' | 'solids' | null;

export interface FeedingFormData {
  type: 'bottle' | 'nursing' | 'solids';
  amountMl?: number;
  bottleType?: 'breast_milk' | 'formula' | null;
  leftDuration?: number;
  rightDuration?: number;
  notes?: string;
}

interface FeedingTypeSelectorProps {
  onTypeSelect?: (type: FeedingType) => void;
  existingActivityType?: 'bottle' | 'nursing' | 'solids' | null;
  onFormDataChange?: (data: FeedingFormData | null) => void;
  activeActivityId?: string | null;
  onTimerStart?: () => Promise<void>;
  isTimerStopped?: boolean;
  duration?: number;
  setDuration?: (duration: number) => void;
  startTime?: Date;
  setStartTime?: (date: Date) => void;
}

const feedingTypes = [
  {
    color: 'bg-activity-feeding',
    description: 'Breast milk or formula',
    icon: Milk,
    id: 'bottle' as const,
    label: 'Bottle',
    textColor: 'text-activity-feeding-foreground',
  },
  {
    color: 'bg-activity-feeding',
    description: 'Breastfeeding session',
    icon: Droplet,
    id: 'nursing' as const,
    label: 'Nursing',
    textColor: 'text-activity-feeding-foreground',
  },
  {
    color: 'bg-activity-solids',
    description: 'Food and meals',
    icon: UtensilsCrossed,
    id: 'solids' as const,
    label: 'Solids',
    textColor: 'text-activity-solids-foreground',
  },
];

export function FeedingTypeSelector({
  onTypeSelect,
  existingActivityType,
  onFormDataChange,
  activeActivityId,
  onTimerStart,
  isTimerStopped = false,
  duration = 0,
  setDuration,
  startTime,
  setStartTime,
}: FeedingTypeSelectorProps) {
  const [selectedType, setSelectedType] = useState<FeedingType>(null);
  const [bottleData, setBottleData] = useState<BottleFormData | null>(null);
  const [nursingData, setNursingData] = useState<NursingFormData | null>(null);

  // Fetch user preferences
  const { data: user } = api.user.current.useQuery();
  const userUnitPref = getVolumeUnit(user?.measurementUnit || 'metric');

  // If editing an existing feeding activity, skip selection and show the form
  useEffect(() => {
    if (existingActivityType) {
      setSelectedType(existingActivityType);
    } else {
      // Reset selection when existingActivityType becomes null
      setSelectedType(null);
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
        amountMl: nursingData.amountMl,
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
            activeActivityId={activeActivityId}
            duration={duration}
            isTimerStopped={isTimerStopped}
            onDataChange={setBottleData}
            onTimerStart={onTimerStart}
            setDuration={setDuration}
            setStartTime={setStartTime}
            startTime={startTime}
            unitPref={userUnitPref}
          />
        )}
        {selectedType === 'nursing' && (
          <NursingDrawerContent
            activeActivityId={activeActivityId}
            duration={duration}
            isTimerStopped={isTimerStopped}
            onDataChange={setNursingData}
            onTimerStart={onTimerStart}
            setDuration={setDuration}
            setStartTime={setStartTime}
            startTime={startTime}
          />
        )}
        {selectedType === 'solids' && <SolidsDrawerContent />}
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

      <div className="grid grid-cols-3 gap-3">
        {feedingTypes.map((type) => {
          const Icon = type.icon;
          return (
            <button
              className={cn(
                'p-4 rounded-xl border-2 border-transparent transition-all hover:scale-[1.02] active:scale-[0.98]',
                type.color,
              )}
              key={type.id}
              onClick={() => handleTypeSelect(type.id)}
              type="button"
            >
              <Icon className={cn('h-8 w-8 mx-auto mb-2', type.textColor)} />
              <p className={cn('font-semibold text-sm mb-1', type.textColor)}>
                {type.label}
              </p>
              <p className={cn('text-xs opacity-80', type.textColor)}>
                {type.description}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
