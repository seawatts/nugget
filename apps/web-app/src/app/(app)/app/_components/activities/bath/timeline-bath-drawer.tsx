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
import { Bath, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { ClickableTimeDisplay } from '../shared/components/clickable-time-display';
import { useActivityMutations } from '../use-activity-mutations';

interface TimelineBathDrawerProps {
  existingActivity: typeof Activities.$inferSelect;
  isOpen: boolean;
  onClose: () => void;
  babyId?: string;
}

export function TimelineBathDrawer({
  existingActivity,
  isOpen: _isOpen,
  onClose,
  babyId: _babyId,
}: TimelineBathDrawerProps) {
  const { updateActivity, deleteActivity, isUpdating, isDeleting } =
    useActivityMutations();

  const { data: user } = api.user.current.useQuery();
  const timeFormat = user?.timeFormat || '12h';

  const [startTime, setStartTime] = useState(new Date());
  const [waterTemp, setWaterTemp] = useState<
    'warm' | 'lukewarm' | 'cool' | null
  >(null);
  const [notes, setNotes] = useState('');
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

  const isPending = isUpdating || isDeleting;

  useEffect(() => {
    if (existingActivity?.startTime) {
      const start = new Date(existingActivity.startTime);
      setStartTime(start);
    }

    if (existingActivity) {
      setNotes(existingActivity.notes || '');

      if (existingActivity.details) {
        const details = existingActivity.details as {
          waterTemp?: 'warm' | 'lukewarm' | 'cool';
          type?: string;
        };

        setWaterTemp(details.waterTemp || null);
      }
    }
  }, [existingActivity]);

  const handleSave = async () => {
    try {
      const bathDetails = waterTemp
        ? {
            type: 'bath' as const,
            waterTemp,
          }
        : { type: 'bath' as const };

      await updateActivity({
        details: bathDetails,
        id: existingActivity.id,
        notes: notes || undefined,
        startTime,
      });

      onClose();
    } catch (error) {
      console.error('Failed to update bath:', error);
    }
  };

  const handleDelete = async () => {
    try {
      setShowDeleteConfirmation(false);
      onClose();
      await deleteActivity(existingActivity.id);
    } catch (error) {
      console.error('Failed to delete activity:', error);
    }
  };

  return (
    <>
      <div className="p-6 pb-4 bg-activity-bath">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <Bath
              className="size-8 text-activity-bath-foreground"
              strokeWidth={1.5}
            />
            <h2 className="text-2xl font-bold text-activity-bath-foreground">
              Edit Bath
            </h2>
          </div>
          <button
            className="p-2 rounded-full hover:bg-black/10 transition-colors text-activity-bath-foreground"
            onClick={onClose}
            type="button"
          >
            <X className="size-6" />
          </button>
        </div>
        <div className="ml-11">
          <ClickableTimeDisplay
            className="text-activity-bath-foreground"
            mode="single"
            onStartTimeChange={setStartTime}
            startTime={startTime}
            timeFormat={timeFormat}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 space-y-6">
        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">
            Water Temperature (optional)
          </p>
          <div className="grid grid-cols-3 gap-3">
            <Button
              className={cn(
                'h-12',
                waterTemp === 'warm'
                  ? 'bg-activity-bath text-activity-bath-foreground hover:bg-activity-bath/90'
                  : 'bg-transparent',
              )}
              onClick={() => setWaterTemp(waterTemp === 'warm' ? null : 'warm')}
              type="button"
              variant={waterTemp === 'warm' ? 'default' : 'outline'}
            >
              Warm
            </Button>
            <Button
              className={cn(
                'h-12',
                waterTemp === 'lukewarm'
                  ? 'bg-activity-bath text-activity-bath-foreground hover:bg-activity-bath/90'
                  : 'bg-transparent',
              )}
              onClick={() =>
                setWaterTemp(waterTemp === 'lukewarm' ? null : 'lukewarm')
              }
              type="button"
              variant={waterTemp === 'lukewarm' ? 'default' : 'outline'}
            >
              Lukewarm
            </Button>
            <Button
              className={cn(
                'h-12',
                waterTemp === 'cool'
                  ? 'bg-activity-bath text-activity-bath-foreground hover:bg-activity-bath/90'
                  : 'bg-transparent',
              )}
              onClick={() => setWaterTemp(waterTemp === 'cool' ? null : 'cool')}
              type="button"
              variant={waterTemp === 'cool' ? 'default' : 'outline'}
            >
              Cool
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">
            Notes (optional)
          </p>
          <textarea
            className="w-full min-h-[100px] p-3 rounded-lg border border-border bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-activity-bath"
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any notes about this bath..."
            value={notes}
          />
        </div>
      </div>

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
              'bg-activity-bath text-activity-bath-foreground',
            )}
            disabled={isPending}
            onClick={handleSave}
          >
            {isPending ? 'Updating...' : 'Update'}
          </Button>
        </div>
      </div>

      <AlertDialog
        onOpenChange={setShowDeleteConfirmation}
        open={showDeleteConfirmation}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Bath Activity?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this bath activity. This action
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
