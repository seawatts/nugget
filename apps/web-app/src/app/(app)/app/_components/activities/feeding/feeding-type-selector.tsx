'use client';

/**
 * Feeding Type Selector
 * Handles selection between different feeding types (bottle, nursing, solids)
 * and routes to the appropriate form component
 */

import { api } from '@nugget/api/react';
import { Button } from '@nugget/ui/button';
import { cn } from '@nugget/ui/lib/utils';
import {
  ArrowLeft,
  Droplet,
  Loader2,
  Milk,
  Pill,
  UtensilsCrossed,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { getVolumeUnit } from '../shared/volume-utils';
import type { VitaminDFormData } from '../vitamin-d/vitamin-d-drawer-content';
import { VitaminDDrawerContent } from '../vitamin-d/vitamin-d-drawer-content';
import type { BottleFormData } from './bottle-drawer';
import { BottleDrawerContent } from './bottle-drawer';
import type { NursingFormData } from './nursing-drawer';
import { NursingDrawerContent } from './nursing-drawer';
import {
  getSolidsEducationalMessage,
  isSolidsAgeAppropriate,
} from './solids-age-utils';
import { SolidsDrawerContent } from './solids-drawer';

type FeedingType = 'bottle' | 'nursing' | 'solids' | 'vitamin_d' | null;

export interface FeedingFormData {
  type: 'bottle' | 'nursing' | 'solids' | 'vitamin_d';
  amountMl?: number;
  bottleType?: 'breast_milk' | 'formula' | null;
  leftDuration?: number;
  rightDuration?: number;
  notes?: string;
  method?: 'drops' | 'spray' | null;
}

interface FeedingTypeSelectorProps {
  onTypeSelect?: (type: FeedingType) => void;
  existingActivityType?: 'bottle' | 'nursing' | 'solids' | 'vitamin_d' | null;
  onFormDataChange?: (data: FeedingFormData | null) => void;
  activeActivityId?: string | null;
  onTimerStart?: () => Promise<void>;
  isTimerStopped?: boolean;
  isLoading?: boolean;
  duration?: number;
  setDuration?: (duration: number) => void;
  startTime?: Date;
  setStartTime?: (date: Date) => void;
  endTime?: Date;
  setEndTime?: (date: Date) => void;
  babyAgeDays?: number | null;
  initialData?: Partial<FeedingFormData>;
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
  {
    color: 'bg-activity-vitamin-d',
    description: 'Daily supplement',
    icon: Pill,
    id: 'vitamin_d' as const,
    label: 'Vitamin D',
    textColor: 'text-activity-vitamin-d-foreground',
  },
];

export function FeedingTypeSelector({
  onTypeSelect,
  existingActivityType,
  onFormDataChange,
  activeActivityId,
  onTimerStart,
  isTimerStopped = false,
  isLoading = false,
  duration = 0,
  setDuration,
  startTime,
  setStartTime,
  endTime,
  setEndTime,
  babyAgeDays = null,
  initialData,
}: FeedingTypeSelectorProps) {
  const [selectedType, setSelectedType] = useState<FeedingType>(null);
  const [bottleData, setBottleData] = useState<BottleFormData | null>(null);
  const [nursingData, setNursingData] = useState<NursingFormData | null>(null);
  const [vitaminDData, setVitaminDData] = useState<VitaminDFormData | null>(
    null,
  );

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
    } else if (selectedType === 'vitamin_d' && vitaminDData) {
      onFormDataChange?.({
        method: vitaminDData.method,
        type: 'vitamin_d',
      });
    }
  }, [selectedType, bottleData, nursingData, vitaminDData, onFormDataChange]);

  const handleTypeSelect = (type: FeedingType) => {
    // Prevent selection of solids if baby is too young
    if (type === 'solids' && !isSolidsAgeAppropriate(babyAgeDays)) {
      return;
    }

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
            babyAgeDays={babyAgeDays}
            duration={duration}
            endTime={endTime}
            initialData={
              initialData?.type === 'bottle'
                ? {
                    amountMl: initialData.amountMl,
                    bottleType: initialData.bottleType,
                    notes: initialData.notes,
                  }
                : undefined
            }
            onDataChange={setBottleData}
            setDuration={setDuration}
            setEndTime={setEndTime}
            setStartTime={setStartTime}
            startTime={startTime}
            unitPref={userUnitPref}
          />
        )}
        {selectedType === 'nursing' && (
          <NursingDrawerContent
            activeActivityId={activeActivityId}
            duration={duration}
            endTime={endTime}
            initialData={
              initialData?.type === 'nursing'
                ? {
                    amountMl: initialData.amountMl,
                    leftDuration: initialData.leftDuration,
                    notes: initialData.notes,
                    rightDuration: initialData.rightDuration,
                  }
                : undefined
            }
            isTimerStopped={isTimerStopped}
            onDataChange={setNursingData}
            onTimerStart={onTimerStart}
            setDuration={setDuration}
            setEndTime={setEndTime}
            setStartTime={setStartTime}
            startTime={startTime}
          />
        )}
        {selectedType === 'solids' && <SolidsDrawerContent />}
        {selectedType === 'vitamin_d' && (
          <VitaminDDrawerContent
            duration={duration}
            endTime={endTime}
            initialData={
              initialData?.type === 'vitamin_d'
                ? {
                    method: initialData.method,
                  }
                : undefined
            }
            onDataChange={setVitaminDData}
            setDuration={setDuration}
            setEndTime={setEndTime}
            setStartTime={setStartTime}
            startTime={startTime}
          />
        )}
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

      <div className="grid grid-cols-2 gap-3">
        {feedingTypes.map((type) => {
          const isNursingOrBottle =
            type.id === 'nursing' || type.id === 'bottle';
          const Icon = isNursingOrBottle && isLoading ? Loader2 : type.icon;
          const isSolids = type.id === 'solids';
          const isAgeAppropriate = isSolidsAgeAppropriate(babyAgeDays);
          const isSolidsDisabled = isSolids && !isAgeAppropriate;
          const isLoadingDisabled = isNursingOrBottle && isLoading;
          const isDisabled = isSolidsDisabled || isLoadingDisabled;
          const educationalMessage = isSolidsDisabled
            ? getSolidsEducationalMessage(babyAgeDays)
            : null;

          return (
            <button
              className={cn(
                'p-4 rounded-xl border-2 border-transparent transition-all',
                type.color,
                isDisabled
                  ? 'opacity-50 cursor-not-allowed hover:scale-100 active:scale-100'
                  : 'hover:scale-[1.02] active:scale-[0.98]',
              )}
              disabled={isDisabled}
              key={type.id}
              onClick={() => handleTypeSelect(type.id)}
              title={educationalMessage || undefined}
              type="button"
            >
              <Icon
                className={cn(
                  'h-8 w-8 mx-auto mb-2',
                  type.textColor,
                  isNursingOrBottle && isLoading && 'animate-spin',
                )}
              />
              <p className={cn('font-semibold text-sm mb-1', type.textColor)}>
                {type.label}
              </p>
              <p className={cn('text-xs opacity-80', type.textColor)}>
                {isSolidsDisabled ? educationalMessage : type.description}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
