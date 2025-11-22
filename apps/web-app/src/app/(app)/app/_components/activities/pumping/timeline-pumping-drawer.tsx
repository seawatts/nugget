'use client';

import { api } from '@nugget/api/react';
import type { Activities } from '@nugget/db/schema';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@nugget/ui/alert-dialog';
import { Button } from '@nugget/ui/button';
import { cn } from '@nugget/ui/lib/utils';
import { Droplets, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { TimeInput } from '../shared/components/time-input';
import { useActivityMutations } from '../use-activity-mutations';
import { PumpingDrawerContent } from './pumping-drawer';

interface TimelinePumpingDrawerProps {
  existingActivity: typeof Activities.$inferSelect;
  isOpen: boolean;
  onClose: () => void;
  babyId?: string;
}

/**
 * Timeline-specific pumping drawer for editing past activities
 * No timer functionality - just edit fields and delete button
 */
export function TimelinePumpingDrawer({
  existingActivity,
  isOpen: _isOpen,
  onClose,
  babyId: _babyId,
}: TimelinePumpingDrawerProps) {
  const { updateActivity, deleteActivity, isUpdating, isDeleting } =
    useActivityMutations();

  // Fetch user preferences to determine default unit
  const { data: user } = api.user.current.useQuery();
  const measurementUnit = user?.measurementUnit || 'metric';
  const userUnitPref = measurementUnit === 'imperial' ? 'OZ' : 'ML';

  // Helper function to get initial amounts from existing activity
  const getInitialAmounts = () => {
    const mlToOz = (ml: number) => Math.round((ml / 29.5735) * 2) / 2;
    const defaultAmount = userUnitPref === 'OZ' ? 2 : 60;

    if (
      existingActivity?.details &&
      existingActivity.details.type === 'pumping'
    ) {
      return {
        left: existingActivity.details.leftBreastMl
          ? userUnitPref === 'OZ'
            ? mlToOz(existingActivity.details.leftBreastMl)
            : existingActivity.details.leftBreastMl
          : defaultAmount,
        right: existingActivity.details.rightBreastMl
          ? userUnitPref === 'OZ'
            ? mlToOz(existingActivity.details.rightBreastMl)
            : existingActivity.details.rightBreastMl
          : defaultAmount,
      };
    }
    return { left: defaultAmount, right: defaultAmount };
  };

  const initialAmounts = getInitialAmounts();

  // Pumping-specific state - initialized from existing activity
  const [startTime, setStartTime] = useState(
    existingActivity?.startTime
      ? new Date(existingActivity.startTime)
      : new Date(),
  );
  const [leftAmount, setLeftAmount] = useState(initialAmounts.left);
  const [rightAmount, setRightAmount] = useState(initialAmounts.right);
  const [selectedDuration, setSelectedDuration] = useState<number | null>(
    existingActivity?.duration ?? null,
  );
  const [selectedMethod, setSelectedMethod] = useState<
    'electric' | 'manual' | null
  >(null);
  const [notes, setNotes] = useState(existingActivity?.notes ?? '');
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

  const isPending = isUpdating || isDeleting;

  // Update amounts when user preferences load or change
  useEffect(() => {
    if (
      existingActivity?.details &&
      existingActivity.details.type === 'pumping' &&
      user
    ) {
      const mlToOz = (ml: number) => Math.round((ml / 29.5735) * 2) / 2;

      if (existingActivity.details.leftBreastMl) {
        const convertedLeft =
          userUnitPref === 'OZ'
            ? mlToOz(existingActivity.details.leftBreastMl)
            : existingActivity.details.leftBreastMl;
        setLeftAmount(convertedLeft);
      }
      if (existingActivity.details.rightBreastMl) {
        const convertedRight =
          userUnitPref === 'OZ'
            ? mlToOz(existingActivity.details.rightBreastMl)
            : existingActivity.details.rightBreastMl;
        setRightAmount(convertedRight);
      }
    }
  }, [existingActivity, userUnitPref, user]);

  const handleSave = async () => {
    try {
      // Use selected duration (in minutes)
      const durationMinutes = selectedDuration;

      // Calculate end time from start time and duration
      const endTime = durationMinutes
        ? new Date(startTime.getTime() + durationMinutes * 60 * 1000)
        : startTime;

      // Convert amounts to ml if needed
      const ozToMl = (oz: number) => Math.round(oz * 29.5735);
      const leftAmountMl =
        userUnitPref === 'OZ' ? ozToMl(leftAmount) : leftAmount;
      const rightAmountMl =
        userUnitPref === 'OZ' ? ozToMl(rightAmount) : rightAmount;
      const totalAmountMl = leftAmountMl + rightAmountMl;

      // Create details object
      const pumpingDetails = {
        leftBreastMl: leftAmountMl,
        method: selectedMethod,
        rightBreastMl: rightAmountMl,
        type: 'pumping' as const,
      };

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

      onClose();
    } catch (error) {
      console.error('Failed to update pumping:', error);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteActivity(existingActivity.id);
      setShowDeleteConfirmation(false);
      onClose();
    } catch (error) {
      console.error('Failed to delete activity:', error);
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
              Edit Pumping
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
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 space-y-6">
        <PumpingDrawerContent
          isEditing={true}
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
            Start Date & Time
          </h3>
          <TimeInput
            id="pumping-start-time"
            label="Start Date & Time"
            onChange={setStartTime}
            value={startTime}
          />
        </div>
      </div>

      {/* Footer with Actions */}
      <div className="p-6 pt-4 border-t border-border">
        <div className="flex gap-3">
          <Button
            className="h-12 text-base"
            disabled={isPending}
            onClick={() => setShowDeleteConfirmation(true)}
            variant="destructive"
          >
            Delete
          </Button>
          <Button
            className="h-12 text-base bg-transparent"
            disabled={isPending}
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
            {isPending ? 'Updating...' : 'Update'}
          </Button>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        onOpenChange={setShowDeleteConfirmation}
        open={showDeleteConfirmation}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Pumping Activity?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this pumping activity. This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
