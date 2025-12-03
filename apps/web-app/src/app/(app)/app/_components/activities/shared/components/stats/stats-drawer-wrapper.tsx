'use client';

import { buildDashboardEvent, DASHBOARD_ACTION } from '@nugget/analytics/utils';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@nugget/ui/drawer';
import posthog from 'posthog-js';
import { type ReactNode, useEffect, useRef } from 'react';

interface StatsDrawerWrapperProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: ReactNode;
  /** Optional component name for analytics tracking */
  componentName?: string;
  /** Optional baby ID for analytics tracking */
  babyId?: string | null;
}

export function StatsDrawerWrapper({
  open,
  onOpenChange,
  title,
  children,
  componentName,
  babyId,
}: StatsDrawerWrapperProps) {
  const hasTrackedOpen = useRef(false);

  // Track drawer open event
  useEffect(() => {
    if (open && !hasTrackedOpen.current) {
      const eventName = componentName
        ? buildDashboardEvent(componentName, DASHBOARD_ACTION.DRAWER_OPEN)
        : 'dashboard.stats_drawer.open';

      posthog.capture(eventName, {
        baby_id: babyId,
        drawer_title: title,
      });
      hasTrackedOpen.current = true;
    } else if (!open) {
      // Reset tracking when drawer closes
      hasTrackedOpen.current = false;
    }
  }, [open, title, componentName, babyId]);

  return (
    <Drawer onOpenChange={onOpenChange} open={open}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader>
          <DrawerTitle>{title}</DrawerTitle>
        </DrawerHeader>
        <div className="space-y-4 overflow-y-auto px-4 pb-6">{children}</div>
      </DrawerContent>
    </Drawer>
  );
}
