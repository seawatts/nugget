'use client';

import { api } from '@nugget/api/react';
import type { Activities } from '@nugget/db/schema';
import { Button } from '@nugget/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@nugget/ui/dialog';
import { Drawer, DrawerContent, DrawerTitle } from '@nugget/ui/drawer';
import { useIsDesktop } from '@nugget/ui/hooks/use-media-query';
import { cn } from '@nugget/ui/lib/utils';
import { useEffect, useState } from 'react';
import {
  getUserRelationFromStore,
  useOptimisticActivitiesStore,
} from '~/stores/optimistic-activities';
import { getActivityTheme } from '../shared/activity-theme-config';
import { ActivityDrawerHeader } from '../shared/components/activity-drawer-header';
import { TimeSelectionMode } from '../shared/components/time-selection-mode';
import { useActivityMutations } from '../use-activity-mutations';

interface NailTrimmingDialogProps {
  babyId: string;
  isOpen: boolean;
  onClose: (wasLogged: boolean) => void;
  initialDate?: Date | null;
}

export function NailTrimmingDialog({
  babyId,
  isOpen,
  onClose,
  initialDate,
}: NailTrimmingDialogProps) {
  const isDesktop = useIsDesktop();
  const [startTime, setStartTime] = useState(initialDate || new Date());
  const [endTime, setEndTime] = useState<Date | null>(null);
  const [duration, setDuration] = useState(0);
  const [location, setLocation] = useState<'hands' | 'feet' | 'both' | null>(
    null,
  );

  const nailTrimmingTheme = getActivityTheme('nail_trimming');

  const { data: user } = api.user.current.useQuery();

  const { createActivity } = useActivityMutations();
  const addOptimisticActivity = useOptimisticActivitiesStore(
    (state) => state.addActivity,
  );

  useEffect(() => {
    if (isOpen && initialDate) {
      setStartTime(initialDate);
    } else if (isOpen && !initialDate) {
      setStartTime(new Date());
    }
  }, [isOpen, initialDate]);

  const handleSave = async () => {
    try {
      const normalizedDate = new Date(startTime);
      normalizedDate.setHours(12, 0, 0, 0);

      const nailTrimmingDetails = location
        ? {
            location,
            type: 'nail_trimming' as const,
          }
        : { type: 'nail_trimming' as const };

      const userRelation = getUserRelationFromStore();
      const optimisticActivity = {
        amountMl: null,
        assignedUserId: null,
        babyId: babyId,
        createdAt: normalizedDate,
        details: nailTrimmingDetails,
        duration: null,
        endTime: normalizedDate,
        familyId: 'temp',
        familyMemberId: null,
        feedingSource: null,
        id: `optimistic-nail-trimming-${Date.now()}`,
        isScheduled: false,
        notes: null,
        startTime: normalizedDate,
        subjectType: 'baby' as const,
        type: 'nail_trimming' as const,
        updatedAt: normalizedDate,
        user: userRelation,
        userId: userRelation?.id || 'temp',
      } as typeof Activities.$inferSelect;

      addOptimisticActivity(optimisticActivity);

      onClose(true);

      setStartTime(new Date());
      setEndTime(null);
      setDuration(0);
      setLocation(null);

      await createActivity({
        activityType: 'nail_trimming',
        babyId,
        details: nailTrimmingDetails,
        startTime: normalizedDate,
      });
    } catch (error) {
      console.error('Failed to save nail trimming:', error);
    }
  };

  const handleCancel = () => {
    onClose(false);
    setStartTime(new Date());
    setEndTime(null);
    setDuration(0);
    setLocation(null);
  };

  const drawerContent = (
    <>
      {/* Header */}
      <ActivityDrawerHeader
        activityType="nail_trimming"
        customTitle="Log Nail Trimming"
        onClose={handleCancel}
      />

      {/* Content - Scrollable */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 space-y-6">
        <TimeSelectionMode
          activityColor={`bg-${nailTrimmingTheme.color}`}
          activityTextColor={nailTrimmingTheme.textColor}
          duration={duration}
          endTime={endTime}
          quickDurationOptions={[]}
          setDuration={setDuration}
          setEndTime={setEndTime}
          setStartTime={setStartTime}
          showDurationOptions={false}
          startTime={startTime}
          timeFormat={user?.timeFormat ?? '12h'}
        />

        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">
            Location (optional)
          </p>
          <div className="grid grid-cols-3 gap-3">
            <Button
              className={cn(
                'h-12',
                location === 'hands'
                  ? `bg-${nailTrimmingTheme.color} ${nailTrimmingTheme.textColor} hover:bg-${nailTrimmingTheme.color}/90`
                  : 'bg-transparent',
              )}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setLocation(location === 'hands' ? null : 'hands');
              }}
              type="button"
              variant={location === 'hands' ? 'default' : 'outline'}
            >
              Hands
            </Button>
            <Button
              className={cn(
                'h-12',
                location === 'feet'
                  ? `bg-${nailTrimmingTheme.color} ${nailTrimmingTheme.textColor} hover:bg-${nailTrimmingTheme.color}/90`
                  : 'bg-transparent',
              )}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setLocation(location === 'feet' ? null : 'feet');
              }}
              type="button"
              variant={location === 'feet' ? 'default' : 'outline'}
            >
              Feet
            </Button>
            <Button
              className={cn(
                'h-12',
                location === 'both'
                  ? `bg-${nailTrimmingTheme.color} ${nailTrimmingTheme.textColor} hover:bg-${nailTrimmingTheme.color}/90`
                  : 'bg-transparent',
              )}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setLocation(location === 'both' ? null : 'both');
              }}
              type="button"
              variant={location === 'both' ? 'default' : 'outline'}
            >
              Both
            </Button>
          </div>
        </div>
      </div>

      {/* Footer with Actions */}
      <div className="p-6 pt-4 border-t border-border">
        <div className="flex gap-3">
          <Button
            className="flex-1 h-12 text-base bg-transparent"
            onClick={handleCancel}
            type="button"
            variant="outline"
          >
            Cancel
          </Button>
          <Button
            className={cn(
              'flex-1 h-12 text-base font-semibold',
              `bg-${nailTrimmingTheme.color} ${nailTrimmingTheme.textColor}`,
            )}
            onClick={handleSave}
            type="button"
          >
            Save
          </Button>
        </div>
      </div>
    </>
  );

  if (isDesktop) {
    return (
      <Dialog onOpenChange={(open) => !open && handleCancel()} open={isOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[95vh] p-0 gap-0 overflow-hidden flex flex-col">
          <DialogTitle className="sr-only">Log Nail Trimming</DialogTitle>
          {drawerContent}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer
      dismissible={false}
      onOpenChange={(open) => !open && handleCancel()}
      open={isOpen}
    >
      <DrawerContent className="max-h-[95vh] bg-background border-none p-0 overflow-x-hidden">
        <DrawerTitle className="sr-only">Log Nail Trimming</DrawerTitle>
        {drawerContent}
      </DrawerContent>
    </Drawer>
  );
}
