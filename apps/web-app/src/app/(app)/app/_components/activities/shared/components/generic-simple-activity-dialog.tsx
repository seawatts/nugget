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
import { useActivityMutations } from '../../use-activity-mutations';
import type { SimpleActivityConfig } from '../activity-config-registry';
import { ActivityDrawerHeader } from './activity-drawer-header';
import { TimeSelectionMode } from './time-selection-mode';

interface GenericSimpleActivityDialogProps {
  babyId: string;
  config: SimpleActivityConfig;
  isOpen: boolean;
  onClose: (wasLogged: boolean) => void;
  initialDate?: Date | null;
}

export function GenericSimpleActivityDialog({
  babyId,
  config,
  isOpen,
  onClose,
  initialDate,
}: GenericSimpleActivityDialogProps) {
  const isDesktop = useIsDesktop();
  const [startTime, setStartTime] = useState(initialDate || new Date());
  const [endTime, setEndTime] = useState<Date | null>(null);
  const [duration, setDuration] = useState(0);

  // Store optional field values
  const [optionalFields, setOptionalFields] = useState<
    Record<string, string | null>
  >({});

  const theme = config.theme;

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

      // Build details object with type and any optional fields that have values
      const detailsBase: Record<string, string | null> = { type: config.type };
      if (config.optionalFields) {
        for (const field of config.optionalFields) {
          const value = optionalFields[field.key];
          if (value !== null && value !== undefined) {
            detailsBase[field.key] = value;
          }
        }
      }
      const details = detailsBase as typeof Activities.$inferSelect.details;

      // Calculate duration in minutes (duration is stored in seconds in state)
      const durationMinutes = duration > 0 ? Math.floor(duration / 60) : null;

      // Calculate endTime if duration is set
      let calculatedEndTime: Date | null = null;
      if (duration > 0) {
        calculatedEndTime = new Date(normalizedDate);
        calculatedEndTime.setSeconds(calculatedEndTime.getSeconds() + duration);
      }

      const userRelation = getUserRelationFromStore();
      const optimisticActivity = {
        amountMl: null,
        assignedUserId: null,
        babyId: babyId,
        createdAt: normalizedDate,
        details,
        duration: durationMinutes,
        endTime: calculatedEndTime || normalizedDate,
        familyId: 'temp',
        familyMemberId: null,
        feedingSource: null,
        id: `optimistic-${config.type}-${Date.now()}`,
        isScheduled: false,
        notes: null,
        startTime: normalizedDate,
        subjectType: 'baby' as const,
        type: config.type as typeof Activities.$inferSelect.type,
        updatedAt: normalizedDate,
        user: userRelation,
        userId: userRelation?.id || 'temp',
      } as typeof Activities.$inferSelect;

      addOptimisticActivity(optimisticActivity);

      onClose(true);

      // Reset form
      setStartTime(new Date());
      setEndTime(null);
      setDuration(0);
      setOptionalFields({});

      await createActivity({
        activityType: config.type as typeof Activities.$inferSelect.type,
        babyId,
        details,
        duration: durationMinutes ?? undefined,
        endTime: calculatedEndTime ?? undefined,
        startTime: normalizedDate,
      });
    } catch (error) {
      console.error(`Failed to save ${config.type}:`, error);
    }
  };

  const handleCancel = () => {
    onClose(false);
    setStartTime(new Date());
    setEndTime(null);
    setDuration(0);
    setOptionalFields({});
  };

  const updateOptionalField = (key: string, value: string | null) => {
    setOptionalFields((prev) => {
      const current = prev[key];
      // Toggle if clicking the same value
      if (current === value) {
        const newFields = { ...prev };
        delete newFields[key];
        return newFields;
      }
      return { ...prev, [key]: value };
    });
  };

  const drawerContent = (
    <>
      {/* Header */}
      <ActivityDrawerHeader
        activityType={config.type}
        customTitle={`Log ${config.title}`}
        onClose={handleCancel}
      />

      {/* Content - Scrollable */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 space-y-6">
        <TimeSelectionMode
          activityColor={`bg-${theme.color}`}
          activityTextColor={theme.textColor}
          duration={duration}
          endTime={endTime}
          quickDurationOptions={config.quickDurationOptions ?? []}
          setDuration={setDuration}
          setEndTime={setEndTime}
          setStartTime={setStartTime}
          showDurationOptions={Boolean(
            config.quickDurationOptions &&
              config.quickDurationOptions.length > 0,
          )}
          startTime={startTime}
          timeFormat={user?.timeFormat ?? '12h'}
        />

        {/* Optional Fields */}
        {config.optionalFields?.map((field) => (
          <div className="space-y-3" key={field.key}>
            <p className="text-sm font-medium text-muted-foreground">
              {field.label} (optional)
            </p>
            <div
              className={cn(
                'grid gap-3',
                field.options.length === 2
                  ? 'grid-cols-2'
                  : field.options.length === 3
                    ? 'grid-cols-3'
                    : 'grid-cols-2',
              )}
            >
              {field.options.map((option) => {
                const isSelected = optionalFields[field.key] === option.value;
                return (
                  <Button
                    className={cn(
                      'h-12',
                      isSelected
                        ? `bg-${theme.color} ${theme.textColor} hover:bg-${theme.color}/90`
                        : 'bg-transparent',
                    )}
                    key={option.value}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      updateOptionalField(field.key, option.value);
                    }}
                    type="button"
                    variant={isSelected ? 'default' : 'outline'}
                  >
                    {option.label}
                  </Button>
                );
              })}
            </div>
          </div>
        ))}
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
              `bg-${theme.color} ${theme.textColor}`,
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
          <DialogTitle className="sr-only">Log {config.title}</DialogTitle>
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
        <DrawerTitle className="sr-only">Log {config.title}</DrawerTitle>
        {drawerContent}
      </DrawerContent>
    </Drawer>
  );
}
