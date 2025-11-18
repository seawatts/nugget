'use client';

import { api } from '@nugget/api/react';
import type { Activities } from '@nugget/db/schema';
import { Button } from '@nugget/ui/button';
import { cn } from '@nugget/ui/lib/utils';
import { Calendar, Clock, Droplets, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useActivityMutations } from '../use-activity-mutations';
import { PumpingDrawerContent } from './pumping-drawer';

interface PumpingActivityDrawerProps {
  existingActivity?: typeof Activities.$inferSelect | null;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Complete, self-contained pumping activity drawer
 * Manages all pumping-specific state and logic internally
 */
export function PumpingActivityDrawer({
  existingActivity,
  isOpen,
  onClose,
}: PumpingActivityDrawerProps) {
  const { createActivity, updateActivity, isCreating, isUpdating } =
    useActivityMutations();

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

        if (existingActivity.details.leftAmount) {
          setLeftAmount(
            userUnitPref === 'OZ'
              ? mlToOz(existingActivity.details.leftAmount)
              : existingActivity.details.leftAmount,
          );
        }
        if (existingActivity.details.rightAmount) {
          setRightAmount(
            userUnitPref === 'OZ'
              ? mlToOz(existingActivity.details.rightAmount)
              : existingActivity.details.rightAmount,
          );
        }
        if (existingActivity.details.method) {
          setSelectedMethod(existingActivity.details.method);
        }
      }
    }

    // Reset fields when drawer is opened for new activity
    if (!existingActivity) {
      setLeftAmount(userUnitPref === 'OZ' ? 2 : 60);
      setRightAmount(userUnitPref === 'OZ' ? 2 : 60);
      setSelectedDuration(null);
      setSelectedMethod(null);
      setNotes('');
    }
  }, [existingActivity, userUnitPref]);

  // Reset state when drawer closes
  useEffect(() => {
    if (!isOpen) {
      setLeftAmount(userUnitPref === 'OZ' ? 2 : 60);
      setRightAmount(userUnitPref === 'OZ' ? 2 : 60);
      setSelectedDuration(null);
      setSelectedMethod(null);
      setNotes('');
    }
  }, [isOpen, userUnitPref]);

  const handleSave = async () => {
    try {
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

      if (existingActivity) {
        // Update existing activity
        await updateActivity({
          amount: totalAmountMl,
          details: pumpingDetails,
          duration: selectedDuration || undefined,
          feedingSource: 'pumped',
          id: existingActivity.id,
          notes: notes || undefined,
          startTime,
        });
      } else {
        // Create new activity
        await createActivity({
          activityType: 'pumping',
          amount: totalAmountMl,
          details: pumpingDetails,
          duration: selectedDuration || undefined,
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
      <div className="p-6 pb-4 bg-[oklch(0.65_0.18_280)]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Droplets className="size-8 text-white" strokeWidth={1.5} />
            <h2 className="text-2xl font-bold text-white">Pumping</h2>
          </div>
          <button
            className="p-2 rounded-full hover:bg-black/10 transition-colors text-white"
            onClick={onClose}
            type="button"
          >
            <X className="size-6" />
          </button>
        </div>

        {/* Time Display */}
        <div className="flex items-center gap-4 text-sm text-white opacity-90">
          <div className="flex items-center gap-2">
            <Clock className="size-4" />
            <span>
              {startTime.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="size-4" />
            <span>
              {startTime.toLocaleDateString([], {
                day: 'numeric',
                month: 'short',
              })}
            </span>
          </div>
        </div>
      </div>

      {/* Content - Scrollable */}
      <div className="flex-1 overflow-y-auto p-6">
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
              'bg-[oklch(0.65_0.18_280)] text-white',
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
