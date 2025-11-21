/**
 * Confirmation dialog for stopping in-progress sleep
 * Used when logging feeding or diaper change while baby is sleeping
 */

'use client';

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

interface StopSleepConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sleepDuration: string | null;
  onStopSleep: () => void;
  onKeepSleeping: () => void;
}

export function StopSleepConfirmationDialog({
  open,
  onOpenChange,
  sleepDuration,
  onStopSleep,
  onKeepSleeping,
}: StopSleepConfirmationDialogProps) {
  return (
    <AlertDialog onOpenChange={onOpenChange} open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Baby is Currently Sleeping</AlertDialogTitle>
          <AlertDialogDescription>
            {sleepDuration
              ? `Your baby has been sleeping for ${sleepDuration}. `
              : 'Your baby is currently sleeping. '}
            Would you like to stop sleep tracking to log this activity?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onKeepSleeping}>
            Keep Sleeping
          </AlertDialogCancel>
          <AlertDialogAction
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={onStopSleep}
          >
            Stop Sleep
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
