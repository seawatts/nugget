'use client';

import { api } from '@nugget/api/react';
import type { Activities } from '@nugget/db/schema';
import { Button } from '@nugget/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@nugget/ui/dialog';
import { Drawer, DrawerContent, DrawerTitle } from '@nugget/ui/drawer';
import { useIsDesktop } from '@nugget/ui/hooks/use-media-query';
import { cn } from '@nugget/ui/lib/utils';
import { format } from 'date-fns';
import { Pill, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useOptimisticActivitiesStore } from '~/stores/optimistic-activities';
import { getActivityTheme } from '../shared/activity-theme-config';
import { TimeSelectionMode } from '../shared/components/time-selection-mode';
import { useActivityMutations } from '../use-activity-mutations';

interface VitaminDDialogProps {
  babyId: string;
  isOpen: boolean;
  onClose: (wasLogged: boolean) => void;
  initialDate?: Date | null;
}

export function VitaminDDialog({
  babyId,
  isOpen,
  onClose,
  initialDate,
}: VitaminDDialogProps) {
  const isDesktop = useIsDesktop();
  const [startTime, setStartTime] = useState(initialDate || new Date());
  const [endTime, setEndTime] = useState<Date | null>(null);
  const [duration, setDuration] = useState(0);
  const [method, setMethod] = useState<'drops' | 'spray' | null>(null);

  const vitaminDTheme = getActivityTheme('vitamin_d');

  const { data: user } = api.user.current.useQuery();

  // Use the centralized activity mutations hook for automatic cache invalidation
  const { createActivity } = useActivityMutations();
  const addOptimisticActivity = useOptimisticActivitiesStore(
    (state) => state.addActivity,
  );

  // Update startTime when dialog opens with a new initialDate
  useEffect(() => {
    if (isOpen && initialDate) {
      setStartTime(initialDate);
    } else if (isOpen && !initialDate) {
      setStartTime(new Date());
    }
  }, [isOpen, initialDate]);

  const quickTimeOptions = [
    { label: 'Just now', minutes: 0 },
    { label: '1 hour ago', minutes: 60 },
    { label: 'Earlier today', minutes: 180 },
  ];

  const handleSave = async () => {
    try {
      // Normalize date to noon (12:00) local time on the selected day
      // This ensures consistent date matching regardless of exact time selected
      const normalizedDate = new Date(startTime);
      normalizedDate.setHours(12, 0, 0, 0);

      console.log('[VitaminD] Starting save with babyId:', babyId);
      console.log('[VitaminD] Original startTime:', startTime);
      console.log(
        '[VitaminD] Normalized to:',
        normalizedDate,
        format(normalizedDate, 'yyyy-MM-dd HH:mm:ss'),
      );
      console.log('[VitaminD] method:', method);

      // Vitamin D details - only include method if selected
      // Schema expects: { method?: 'drops' | 'spray' }
      const vitaminDDetails = method
        ? {
            method,
            type: 'vitamin_d' as const,
          }
        : { type: 'vitamin_d' as const };

      console.log('[VitaminD] Details:', vitaminDDetails);

      // Create optimistic activity for immediate UI feedback
      const optimisticActivity = {
        amountMl: null,
        assignedUserId: null,
        babyId: 'temp',
        createdAt: normalizedDate,
        details: vitaminDDetails,
        duration: null,
        endTime: normalizedDate,
        familyId: 'temp',
        familyMemberId: null,
        feedingSource: null,
        id: `optimistic-vitamin-d-${Date.now()}`,
        isScheduled: false,
        notes: null,
        startTime: normalizedDate,
        subjectType: 'baby' as const,
        type: 'vitamin_d' as const,
        updatedAt: normalizedDate,
        userId: 'temp',
      } as typeof Activities.$inferSelect;

      // Add to optimistic store immediately
      console.log(
        '[VitaminD] Adding optimistic activity:',
        optimisticActivity.id,
      );
      addOptimisticActivity(optimisticActivity);

      // Close dialog immediately for better UX
      onClose(true);

      // Reset form
      setStartTime(new Date());
      setEndTime(null);
      setDuration(0);
      setMethod(null);

      // Create actual activity in the background
      // details should match the vitamin D schema: { method?: 'drops' | 'spray', type: 'vitamin_d' }
      console.log('[VitaminD] Creating activity with params:', {
        activityType: 'vitamin_d',
        babyId,
        details: vitaminDDetails,
        startTime: normalizedDate,
      });

      const result = await createActivity({
        activityType: 'vitamin_d',
        babyId,
        details: vitaminDDetails,
        startTime: normalizedDate,
      });

      console.log('[VitaminD] Activity created successfully:', result);
    } catch (error) {
      // Error handling is done by useActivityMutations hook
      console.error('[VitaminD] Failed to save vitamin D activity:', error);
      console.error('[VitaminD] Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });
    }
  };

  const handleClose = () => {
    onClose(false);
    // Reset form
    setStartTime(new Date());
    setEndTime(null);
    setDuration(0);
    setMethod(null);
  };

  if (isDesktop) {
    return (
      <Dialog onOpenChange={handleClose} open={isOpen}>
        <DialogContent className="max-w-lg p-0 gap-0">
          {/* Header */}
          <div className={cn('p-6 pb-4', `bg-${vitaminDTheme.color}`)}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Pill
                  className={cn('size-8', vitaminDTheme.textColor)}
                  strokeWidth={1.5}
                />
                <DialogTitle
                  className={cn('text-2xl font-bold', vitaminDTheme.textColor)}
                >
                  Log Vitamin D
                </DialogTitle>
              </div>
              <button
                className={cn(
                  'p-2 rounded-full hover:bg-black/10 transition-colors',
                  vitaminDTheme.textColor,
                )}
                onClick={handleClose}
                type="button"
              >
                <X className="size-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 space-y-6">
            {/* Time Selection Component */}
            <TimeSelectionMode
              activityColor="bg-activity-vitamin-d"
              activityTextColor="text-activity-vitamin-d-foreground"
              duration={duration}
              endTime={endTime}
              quickTimeOptions={quickTimeOptions}
              setDuration={setDuration}
              setEndTime={setEndTime}
              setStartTime={setStartTime}
              showDurationOptions={false}
              startTime={startTime}
              timeFormat={user?.timeFormat ?? '12h'}
            />

            {/* Method Selector (Optional) */}
            <div className="space-y-3">
              <p className="text-sm font-medium text-muted-foreground">
                Method (optional)
              </p>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  className={cn(
                    'h-12',
                    method === 'drops'
                      ? `bg-${vitaminDTheme.color} ${vitaminDTheme.textColor} hover:bg-${vitaminDTheme.color}/90`
                      : 'bg-transparent',
                  )}
                  onClick={() => setMethod('drops')}
                  type="button"
                  variant={method === 'drops' ? 'default' : 'outline'}
                >
                  Drops
                </Button>
                <Button
                  className={cn(
                    'h-12',
                    method === 'spray'
                      ? `bg-${vitaminDTheme.color} ${vitaminDTheme.textColor} hover:bg-${vitaminDTheme.color}/90`
                      : 'bg-transparent',
                  )}
                  onClick={() => setMethod('spray')}
                  type="button"
                  variant={method === 'spray' ? 'default' : 'outline'}
                >
                  Spray
                </Button>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 pt-4 border-t border-border">
            <div className="flex gap-3">
              <Button
                className="flex-1 h-12 text-base bg-transparent"
                onClick={handleClose}
                variant="outline"
              >
                Cancel
              </Button>
              <Button
                className={cn(
                  'flex-1 h-12 text-base font-semibold',
                  `bg-${vitaminDTheme.color}`,
                  vitaminDTheme.textColor,
                )}
                onClick={handleSave}
              >
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer onOpenChange={handleClose} open={isOpen}>
      <DrawerContent className="max-h-[90vh] p-0">
        {/* Header */}
        <div className={cn('p-6 pb-4', `bg-${vitaminDTheme.color}`)}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Pill
                className={cn('size-8', vitaminDTheme.textColor)}
                strokeWidth={1.5}
              />
              <DrawerTitle
                className={cn('text-2xl font-bold', vitaminDTheme.textColor)}
              >
                Log Vitamin D
              </DrawerTitle>
            </div>
            <button
              className={cn(
                'p-2 rounded-full hover:bg-black/10 transition-colors',
                vitaminDTheme.textColor,
              )}
              onClick={handleClose}
              type="button"
            >
              <X className="size-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 space-y-6">
          {/* Time Selection Component */}
          <TimeSelectionMode
            activityColor="bg-activity-vitamin-d"
            activityTextColor="text-activity-vitamin-d-foreground"
            duration={duration}
            endTime={endTime}
            quickTimeOptions={quickTimeOptions}
            setDuration={setDuration}
            setEndTime={setEndTime}
            setStartTime={setStartTime}
            showDurationOptions={false}
            startTime={startTime}
            timeFormat={user?.timeFormat ?? '12h'}
          />

          {/* Method Selector (Optional) */}
          <div className="space-y-3">
            <p className="text-sm font-medium text-muted-foreground">
              Method (optional)
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Button
                className={cn(
                  'h-12',
                  method === 'drops'
                    ? `bg-${vitaminDTheme.color} ${vitaminDTheme.textColor} hover:bg-${vitaminDTheme.color}/90`
                    : 'bg-transparent',
                )}
                onClick={() => setMethod('drops')}
                type="button"
                variant={method === 'drops' ? 'default' : 'outline'}
              >
                Drops
              </Button>
              <Button
                className={cn(
                  'h-12',
                  method === 'spray'
                    ? `bg-${vitaminDTheme.color} ${vitaminDTheme.textColor} hover:bg-${vitaminDTheme.color}/90`
                    : 'bg-transparent',
                )}
                onClick={() => setMethod('spray')}
                type="button"
                variant={method === 'spray' ? 'default' : 'outline'}
              >
                Spray
              </Button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 pt-4 border-t border-border">
          <div className="flex gap-3">
            <Button
              className="flex-1 h-12 text-base bg-transparent"
              onClick={handleClose}
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              className={cn(
                'flex-1 h-12 text-base font-semibold',
                `bg-${vitaminDTheme.color}`,
                vitaminDTheme.textColor,
              )}
              onClick={handleSave}
            >
              Save
            </Button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
