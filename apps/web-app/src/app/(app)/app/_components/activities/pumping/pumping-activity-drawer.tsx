'use client';

import { api } from '@nugget/api/react';
import type { Activities } from '@nugget/db/schema';
import { Button } from '@nugget/ui/button';
import { cn } from '@nugget/ui/lib/utils';
import { Droplets, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useOptimisticActivitiesStore } from '~/stores/optimistic-activities';
import { TimeInput } from '../shared/components/time-input';
import { useActivityMutations } from '../use-activity-mutations';
import { PumpingDrawerContent } from './pumping-drawer';

interface PumpingActivityDrawerProps {
  existingActivity?: typeof Activities.$inferSelect | null;
  isOpen: boolean;
  onClose: () => void;
  babyId?: string;
}

/**
 * Complete, self-contained pumping activity drawer
 * Manages all pumping-specific state and logic internally
 */
export function PumpingActivityDrawer({
  existingActivity,
  isOpen,
  onClose,
  babyId: _babyId,
}: PumpingActivityDrawerProps) {
  const { createActivity, updateActivity, isCreating, isUpdating } =
    useActivityMutations();
  const addOptimisticActivity = useOptimisticActivitiesStore(
    (state) => state.addActivity,
  );

  // Fetch user preferences to determine default unit
  const { data: user } = api.user.current.useQuery();
  const measurementUnit = user?.measurementUnit || 'metric';
  const userUnitPref = measurementUnit === 'imperial' ? 'OZ' : 'ML';

  // Pumping-specific state
  const [startTime, setStartTime] = useState(new Date());
  const [leftAmount, setLeftAmount] = useState(userUnitPref === 'OZ' ? 2 : 60);
  const [rightAmount, setRightAmount] = useState(
    userUnitPref === 'OZ' ? 2 : 60,
  );
  const [selectedDuration, setSelectedDuration] = useState<number | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<
    'electric' | 'manual' | null
  >(null);
  const [notes, setNotes] = useState('');

  const isPending = isCreating || isUpdating;
  const isEditing = Boolean(existingActivity);

  // Update state when existingActivity changes
  useEffect(() => {
    if (existingActivity?.startTime) {
      setStartTime(new Date(existingActivity.startTime));
      if (existingActivity.duration) {
        setSelectedDuration(existingActivity.duration);
      }
    } else {
      setStartTime(new Date());
    }

    // Initialize pumping-specific fields from existing activity
    if (existingActivity) {
      if (existingActivity.duration) {
        setSelectedDuration(existingActivity.duration);
      }
      if (existingActivity.notes) {
        setNotes(existingActivity.notes);
      }
      // Parse pumping details from details field
      if (
        existingActivity.details &&
        existingActivity.details.type === 'pumping'
      ) {
        // Convert stored ml to user's preferred unit
        const mlToOz = (ml: number) => Math.round((ml / 29.5735) * 2) / 2;

        if (existingActivity.details.leftBreastMl) {
          setLeftAmount(
            userUnitPref === 'OZ'
              ? mlToOz(existingActivity.details.leftBreastMl)
              : existingActivity.details.leftBreastMl,
          );
        }
        if (existingActivity.details.rightBreastMl) {
          setRightAmount(
            userUnitPref === 'OZ'
              ? mlToOz(existingActivity.details.rightBreastMl)
              : existingActivity.details.rightBreastMl,
          );
        }
      }
    }

    // Reset fields when drawer is opened for new activity
    if (!existingActivity) {
      setStartTime(new Date());
      setLeftAmount(userUnitPref === 'OZ' ? 2 : 60);
      setRightAmount(userUnitPref === 'OZ' ? 2 : 60);
      setSelectedDuration(null);
      setSelectedMethod(null);
      setNotes('');
    }
  }, [existingActivity, userUnitPref]);

  // Reset state when drawer closes - delay to allow closing animation to complete
  useEffect(() => {
    if (!isOpen) {
      // Delay state reset to prevent flash during drawer closing animation
      const timeoutId = setTimeout(() => {
        setLeftAmount(userUnitPref === 'OZ' ? 2 : 60);
        setRightAmount(userUnitPref === 'OZ' ? 2 : 60);
        setSelectedDuration(null);
        setSelectedMethod(null);
        setNotes('');
      }, 300); // Standard drawer animation duration

      return () => clearTimeout(timeoutId);
    }
  }, [isOpen, userUnitPref]);

  const handleSave = async () => {
    try {
      // Use selected duration (in minutes)
      const durationMinutes = selectedDuration;

      // Calculate end time from start time and duration
      const endTime = durationMinutes
        ? new Date(startTime.getTime() + durationMinutes * 60 * 1000)
        : startTime;

      // Close drawer immediately for better UX
      onClose();

      // Convert amounts to ml if needed
      const ozToMl = (oz: number) => Math.round(oz * 29.5735);
      const leftAmountMl =
        userUnitPref === 'OZ' ? ozToMl(leftAmount) : leftAmount;
      const rightAmountMl =
        userUnitPref === 'OZ' ? ozToMl(rightAmount) : rightAmount;
      const totalAmountMl = leftAmountMl + rightAmountMl;

      // Create details object
      const pumpingDetails = {
        leftAmount: leftAmountMl,
        method: selectedMethod,
        rightAmount: rightAmountMl,
        type: 'pumping' as const,
      };

      // Only add optimistic activity for new activities (not updates)
      if (!existingActivity) {
        // Create optimistic activity for immediate UI feedback
        const optimisticActivity = {
          amount: totalAmountMl,
          assignedUserId: null,
          babyId: 'temp',
          createdAt: startTime,
          details: pumpingDetails,
          duration: durationMinutes,
          endTime,
          familyId: 'temp',
          familyMemberId: null,
          feedingSource: 'pumped' as const,
          id: `optimistic-pumping-${Date.now()}`,
          isScheduled: false,
          notes: notes || null,
          startTime,
          subjectType: 'baby' as const,
          type: 'pumping' as const,
          updatedAt: startTime,
          userId: 'temp',
        } as typeof Activities.$inferSelect;

        addOptimisticActivity(optimisticActivity);
      }

      if (existingActivity) {
        // Update existing activity
        await updateActivity({
          amountMl: totalAmountMl,
          details: pumpingDetails,
          duration: durationMinutes ?? undefined,
          endTime,
          feedingSource: 'pumped',
          id: existingActivity.id,
          notes: notes || undefined,
          startTime,
        });
      } else {
        // Create new activity
        await createActivity({
          activityType: 'pumping',
          amountMl: totalAmountMl,
          details: pumpingDetails,
          duration: durationMinutes ?? undefined,
          feedingSource: 'pumped',
          notes: notes || undefined,
          startTime,
        });
      }
    } catch (error) {
      console.error('Failed to save pumping:', error);
    }
  };

  return (
    <>
      {/* Custom Header with Activity Color */}
      <div className="p-6 pb-4 bg-activity-pumping">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Droplets
              className="size-8 text-activity-pumping-foreground"
              strokeWidth={1.5}
            />
            <h2 className="text-2xl font-bold text-activity-pumping-foreground">
              Pumping
            </h2>
          </div>
          <button
            className="p-2 rounded-full hover:bg-black/10 transition-colors text-activity-pumping-foreground"
            onClick={onClose}
            type="button"
          >
            <X className="size-6" />
          </button>
        </div>
      </div>

      {/* Content - Scrollable */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <PumpingDrawerContent
          leftAmount={leftAmount}
          notes={notes}
          rightAmount={rightAmount}
          selectedDuration={selectedDuration}
          selectedMethod={selectedMethod}
          setLeftAmount={setLeftAmount}
          setNotes={setNotes}
          setRightAmount={setRightAmount}
          setSelectedDuration={setSelectedDuration}
          setSelectedMethod={setSelectedMethod}
        />

        {/* Time & Date Section */}
        <div className="space-y-3 min-w-0">
          <h3 className="text-sm font-medium text-muted-foreground">
            Start Time
          </h3>
          <TimeInput
            id="pumping-start-time"
            label="Start Time"
            onChange={setStartTime}
            value={startTime}
          />
        </div>
      </div>

      {/* Footer with Actions */}
      <div className="p-6 pt-4 border-t border-border">
        <div className="flex gap-3">
          <Button
            className="flex-1 h-12 text-base bg-transparent"
            onClick={onClose}
            variant="outline"
          >
            Cancel
          </Button>
          <Button
            className={cn(
              'flex-1 h-12 text-base font-semibold',
              'bg-activity-pumping text-activity-pumping-foreground',
            )}
            disabled={isPending}
            onClick={handleSave}
          >
            {isPending ? 'Saving...' : isEditing ? 'Update' : 'Save'}
          </Button>
        </div>
      </div>
    </>
  );
}
