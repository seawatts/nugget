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

interface BathDialogProps {
  babyId: string;
  isOpen: boolean;
  onClose: (wasLogged: boolean) => void;
  initialDate?: Date | null;
}

export function BathDialog({
  babyId,
  isOpen,
  onClose,
  initialDate,
}: BathDialogProps) {
  const isDesktop = useIsDesktop();
  const [startTime, setStartTime] = useState(initialDate || new Date());
  const [endTime, setEndTime] = useState<Date | null>(null);
  const [duration, setDuration] = useState(0);
  const [waterTemp, setWaterTemp] = useState<
    'warm' | 'lukewarm' | 'cool' | null
  >(null);

  const bathTheme = getActivityTheme('bath');

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

      const bathDetails = waterTemp
        ? {
            type: 'bath' as const,
            waterTemp,
          }
        : { type: 'bath' as const };

      const userRelation = getUserRelationFromStore();
      const optimisticActivity = {
        amountMl: null,
        assignedUserId: null,
        babyId: babyId,
        createdAt: normalizedDate,
        details: bathDetails,
        duration: null,
        endTime: normalizedDate,
        familyId: 'temp',
        familyMemberId: null,
        feedingSource: null,
        id: `optimistic-bath-${Date.now()}`,
        isScheduled: false,
        notes: null,
        startTime: normalizedDate,
        subjectType: 'baby' as const,
        type: 'bath' as const,
        updatedAt: normalizedDate,
        user: userRelation,
        userId: userRelation?.id || 'temp',
      } as typeof Activities.$inferSelect;

      addOptimisticActivity(optimisticActivity);

      onClose(true);

      setStartTime(new Date());
      setEndTime(null);
      setDuration(0);
      setWaterTemp(null);

      await createActivity({
        activityType: 'bath',
        babyId,
        details: bathDetails,
        startTime: normalizedDate,
      });
    } catch (error) {
      console.error('Failed to save bath:', error);
    }
  };

  const handleCancel = () => {
    onClose(false);
    setStartTime(new Date());
    setEndTime(null);
    setDuration(0);
    setWaterTemp(null);
  };

  const drawerContent = (
    <>
      {/* Header */}
      <ActivityDrawerHeader
        activityType="bath"
        customTitle="Log Bath"
        onClose={handleCancel}
      />

      {/* Content - Scrollable */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 space-y-6">
        <TimeSelectionMode
          activityColor={`bg-${bathTheme.color}`}
          activityTextColor={bathTheme.textColor}
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
            Water Temperature (optional)
          </p>
          <div className="grid grid-cols-3 gap-3">
            <Button
              className={cn(
                'h-12',
                waterTemp === 'warm'
                  ? `bg-${bathTheme.color} ${bathTheme.textColor} hover:bg-${bathTheme.color}/90`
                  : 'bg-transparent',
              )}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setWaterTemp(waterTemp === 'warm' ? null : 'warm');
              }}
              type="button"
              variant={waterTemp === 'warm' ? 'default' : 'outline'}
            >
              Warm
            </Button>
            <Button
              className={cn(
                'h-12',
                waterTemp === 'lukewarm'
                  ? `bg-${bathTheme.color} ${bathTheme.textColor} hover:bg-${bathTheme.color}/90`
                  : 'bg-transparent',
              )}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setWaterTemp(waterTemp === 'lukewarm' ? null : 'lukewarm');
              }}
              type="button"
              variant={waterTemp === 'lukewarm' ? 'default' : 'outline'}
            >
              Lukewarm
            </Button>
            <Button
              className={cn(
                'h-12',
                waterTemp === 'cool'
                  ? `bg-${bathTheme.color} ${bathTheme.textColor} hover:bg-${bathTheme.color}/90`
                  : 'bg-transparent',
              )}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setWaterTemp(waterTemp === 'cool' ? null : 'cool');
              }}
              type="button"
              variant={waterTemp === 'cool' ? 'default' : 'outline'}
            >
              Cool
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
              `bg-${bathTheme.color} ${bathTheme.textColor}`,
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
          <DialogTitle className="sr-only">Log Bath</DialogTitle>
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
        <DrawerTitle className="sr-only">Log Bath</DrawerTitle>
        {drawerContent}
      </DrawerContent>
    </Drawer>
  );
}
