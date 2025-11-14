'use client';

import type { Activities } from '@nugget/db/schema';
import { Button } from '@nugget/ui/button';
import { cn } from '@nugget/ui/lib/utils';
import type { LucideIcon } from 'lucide-react';
import { Calendar, Clock, X } from 'lucide-react';
import type { KeyboardEvent } from 'react';
import { useEffect, useState } from 'react';
import { ActivityDrawerContent } from '~/app/(app)/app/_components/drawers/activity-drawer-content';
import { BathDrawer } from '~/app/(app)/app/_components/drawers/bath-drawer';
import { BottleDrawerContent } from '~/app/(app)/app/_components/drawers/bottle-drawer';
import { DiaperDrawerContent } from '~/app/(app)/app/_components/drawers/diaper-drawer';
import { GrowthDrawer } from '~/app/(app)/app/_components/drawers/growth-drawer';
import { MedicineDrawer } from '~/app/(app)/app/_components/drawers/medicine-drawer';
import { NursingDrawerContent } from '~/app/(app)/app/_components/drawers/nursing-drawer';
import { PottyDrawer } from '~/app/(app)/app/_components/drawers/potty-drawer';
import { PumpingDrawerContent } from '~/app/(app)/app/_components/drawers/pumping-drawer';
import { SleepDrawerContent } from '~/app/(app)/app/_components/drawers/sleep-drawer';
import { SolidsDrawerContent } from '~/app/(app)/app/_components/drawers/solids-drawer';
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

export function ActivityDrawer({
  activity,
  existingActivity,
  isOpen,
  onClose,
}: ActivityDrawerProps) {
  const Icon = activity.icon;
  const [startTime, setStartTime] = useState(new Date());
  const isEditing = Boolean(existingActivity);

  // Update startTime when existingActivity changes
  useEffect(() => {
    if (existingActivity?.startTime) {
      setStartTime(new Date(existingActivity.startTime));
    } else {
      setStartTime(new Date());
    }
  }, [existingActivity]);

  const handleSave = () => {
    if (isEditing) {
      console.log('[v0] Updating activity:', existingActivity?.id, startTime);
      // TODO: Implement update mutation
    } else {
      console.log('[v0] Saving activity:', activity.id, startTime);
    }
    onClose();
  };

  const handleOverlayKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'Escape' || event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onClose();
    }
  };

  const renderContent = () => {
    switch (activity.id) {
      case 'sleep':
        return (
          <SleepDrawerContent
            setStartTime={setStartTime}
            startTime={startTime}
          />
        );
      case 'nursing':
        return <NursingDrawerContent />;
      case 'bottle':
        return <BottleDrawerContent />;
      case 'solids':
        return <SolidsDrawerContent />;
      case 'diaper':
        return <DiaperDrawerContent />;
      case 'pumping':
        return <PumpingDrawerContent />;
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

  return (
    <>
      {/* Backdrop */}
      <button
        aria-label="Close activity drawer"
        className={cn(
          'fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity z-40',
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none',
        )}
        onClick={onClose}
        onKeyDown={handleOverlayKeyDown}
        type="button"
      />

      {/* Drawer */}
      <div
        className={cn(
          'fixed bottom-0 left-0 right-0 bg-card rounded-t-3xl shadow-2xl transition-transform duration-300 ease-out z-50 max-h-[85vh] overflow-hidden flex flex-col',
          isOpen ? 'translate-y-0' : 'translate-y-full',
        )}
      >
        {/* Header */}
        <div className={cn('p-6 pb-4', activity.color)}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Icon
                className={cn('h-8 w-8', activity.textColor)}
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
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Time Display */}
          <div
            className={cn(
              'flex items-center gap-4 text-sm',
              activity.textColor,
              'opacity-90',
            )}
          >
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>
                {startTime.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>
                {startTime.toLocaleDateString([], {
                  day: 'numeric',
                  month: 'short',
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-background">
          {renderContent()}
        </div>

        {/* Footer */}
        <div className="p-6 pt-4 bg-background border-t border-border">
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
              onClick={handleSave}
            >
              {isEditing ? 'Update' : 'Save'}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
