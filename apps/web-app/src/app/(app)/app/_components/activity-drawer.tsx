'use client';

import type { Activities } from '@nugget/db/schema';
import { Button } from '@nugget/ui/button';
import { DateTimeRangePicker } from '@nugget/ui/custom/date-time-range-picker';
import { Dialog, DialogContent, DialogTitle } from '@nugget/ui/dialog';
import { Drawer, DrawerContent, DrawerTitle } from '@nugget/ui/drawer';
import { useIsDesktop } from '@nugget/ui/hooks/use-media-query';
import { cn } from '@nugget/ui/lib/utils';
import type { LucideIcon } from 'lucide-react';
import { X } from 'lucide-react';
import { useState } from 'react';
import { ActivityDrawerContent } from '~/app/(app)/app/_components/drawers/activity-drawer-content';
import { BathDrawer } from '~/app/(app)/app/_components/drawers/bath-drawer';
import { DiaperActivityDrawer } from '~/app/(app)/app/_components/drawers/diaper-activity-drawer';
import { FeedingActivityDrawer } from '~/app/(app)/app/_components/drawers/feeding-activity-drawer';
import { GrowthDrawer } from '~/app/(app)/app/_components/drawers/growth-drawer';
import { MedicineDrawer } from '~/app/(app)/app/_components/drawers/medicine-drawer';
import { PottyDrawer } from '~/app/(app)/app/_components/drawers/potty-drawer';
import { PumpingActivityDrawer } from '~/app/(app)/app/_components/drawers/pumping-activity-drawer';
import { SleepActivityDrawer } from '~/app/(app)/app/_components/drawers/sleep-activity-drawer';
import { TemperatureDrawer } from '~/app/(app)/app/_components/drawers/temperature-drawer';
import { TummyTimeDrawer } from '~/app/(app)/app/_components/drawers/tummy-time-drawer';

interface ActivityDrawerProps {
  activity: {
    id: string;
    label: string;
    icon: LucideIcon;
    color: string;
    textColor: string;
  };
  existingActivity?: typeof Activities.$inferSelect | null;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Main activity drawer component - responsive Dialog (desktop) / Drawer (mobile)
 * Each activity type has its own dedicated drawer component with all logic contained
 */
export function ActivityDrawer({
  activity,
  existingActivity,
  isOpen,
  onClose,
}: ActivityDrawerProps) {
  const isDesktop = useIsDesktop();
  const Icon = activity.icon;

  // State for generic activities time selection
  const [startTime, setStartTime] = useState(new Date());

  const renderContent = () => {
    switch (activity.id) {
      case 'sleep':
        // Sleep has its own header, so return the full component
        return (
          <SleepActivityDrawer
            existingActivity={existingActivity}
            isOpen={isOpen}
            onClose={onClose}
          />
        );
      case 'feeding':
      case 'nursing':
      case 'bottle':
      case 'solids':
        // Feeding has its own header, so return the full component
        return (
          <FeedingActivityDrawer
            existingActivity={existingActivity}
            isOpen={isOpen}
            onClose={onClose}
          />
        );
      case 'pumping':
        // Pumping has its own header, so return the full component
        return (
          <PumpingActivityDrawer
            existingActivity={existingActivity}
            isOpen={isOpen}
            onClose={onClose}
          />
        );
      case 'diaper':
        // Diaper has its own header, so return the full component
        return (
          <DiaperActivityDrawer
            existingActivity={existingActivity}
            isOpen={isOpen}
            onClose={onClose}
          />
        );
      case 'potty':
        return <PottyDrawer />;
      case 'activity':
        return <ActivityDrawerContent />;
      case 'tummy-time':
        return <TummyTimeDrawer />;
      case 'medicine':
        return <MedicineDrawer />;
      case 'temperature':
        return <TemperatureDrawer />;
      case 'growth':
        return <GrowthDrawer />;
      case 'bath':
        return <BathDrawer />;
      default:
        return null;
    }
  };

  // For activities with their own headers (sleep, feeding, diaper, pumping), render without wrapper
  const hasOwnHeader = [
    'sleep',
    'feeding',
    'nursing',
    'bottle',
    'solids',
    'diaper',
    'pumping',
  ].includes(activity.id);

  if (hasOwnHeader) {
    if (isDesktop) {
      return (
        <Dialog onOpenChange={onClose} open={isOpen}>
          <DialogContent
            className="sm:max-w-2xl max-h-[95vh] p-0 gap-0 overflow-hidden flex flex-col"
            showCloseButton={false}
          >
            <DialogTitle className="sr-only">{activity.label}</DialogTitle>
            {renderContent()}
          </DialogContent>
        </Dialog>
      );
    }

    return (
      <Drawer onOpenChange={(open) => !open && onClose()} open={isOpen}>
        <DrawerContent className="max-h-[95vh] bg-background border-none p-0">
          <DrawerTitle className="sr-only">{activity.label}</DrawerTitle>
          {renderContent()}
        </DrawerContent>
      </Drawer>
    );
  }

  // For all other activities, wrap with colored header
  const contentWithHeader = (
    <>
      {/* Custom Header with Activity Color */}
      <div className={cn('p-6 pb-4', activity.color)}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Icon
              className={cn('size-8', activity.textColor)}
              strokeWidth={1.5}
            />
            <h2 className={cn('text-2xl font-bold', activity.textColor)}>
              {activity.label}
            </h2>
          </div>
          <button
            className={cn(
              'p-2 rounded-full hover:bg-black/10 transition-colors',
              activity.textColor,
            )}
            onClick={onClose}
            type="button"
          >
            <X className="size-6" />
          </button>
        </div>

        {/* Time Picker */}
        <DateTimeRangePicker
          className={cn(activity.textColor, 'opacity-90')}
          mode="single"
          setStartDate={setStartTime}
          startDate={startTime}
        />
      </div>

      {/* Content - Scrollable */}
      <div className="flex-1 overflow-y-auto p-6 pt-0">{renderContent()}</div>

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
              activity.color,
              activity.textColor,
            )}
          >
            Save
          </Button>
        </div>
      </div>
    </>
  );

  if (isDesktop) {
    return (
      <Dialog onOpenChange={onClose} open={isOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[95vh] p-0 gap-0 overflow-hidden flex flex-col">
          <DialogTitle className="sr-only">{activity.label}</DialogTitle>
          {contentWithHeader}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer onOpenChange={(open) => !open && onClose()} open={isOpen}>
      <DrawerContent className="max-h-[95vh] bg-background border-none p-0">
        <DrawerTitle className="sr-only">{activity.label}</DrawerTitle>
        {contentWithHeader}
      </DrawerContent>
    </Drawer>
  );
}
