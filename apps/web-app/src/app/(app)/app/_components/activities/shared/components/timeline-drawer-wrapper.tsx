'use client';

import {
  buildDashboardEvent,
  DASHBOARD_ACTION,
  DASHBOARD_COMPONENT,
} from '@nugget/analytics/utils';
import { Dialog, DialogContent, DialogTitle } from '@nugget/ui/dialog';
import { Drawer, DrawerContent, DrawerTitle } from '@nugget/ui/drawer';
import { useIsDesktop } from '@nugget/ui/hooks/use-media-query';
import posthog from 'posthog-js';
import { useEffect, useRef } from 'react';

/**
 * Helper component to wrap timeline drawers with responsive Dialog/Drawer
 * On desktop, renders as a Dialog. On mobile, renders as a Drawer.
 */
export function TimelineDrawerWrapper({
  children,
  isOpen,
  onClose,
  title,
}: {
  children: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
  title: string;
}) {
  const isDesktop = useIsDesktop();
  const hasTrackedOpen = useRef(false);

  // Extract activity type from title (e.g., "Edit Feeding" -> "feeding")
  const activityType = title
    .toLowerCase()
    .replace('edit ', '')
    .replace(/\s+/g, '_');

  // Track drawer open/close events
  useEffect(() => {
    if (isOpen && !hasTrackedOpen.current) {
      // Track timeline drawer open
      posthog.capture(
        buildDashboardEvent(
          DASHBOARD_COMPONENT.ACTIVITY_TIMELINE,
          DASHBOARD_ACTION.DRAWER_OPEN,
        ),
        {
          activity_type: activityType,
          drawer_title: title,
          source: 'timeline',
        },
      );
      hasTrackedOpen.current = true;
    } else if (!isOpen) {
      // Reset tracking when drawer closes
      hasTrackedOpen.current = false;
    }
  }, [isOpen, activityType, title]);

  if (isDesktop) {
    return (
      <Dialog onOpenChange={onClose} open={isOpen}>
        <DialogContent
          className="sm:max-w-2xl max-h-[95vh] p-0 gap-0 overflow-hidden flex flex-col"
          showCloseButton={false}
        >
          <DialogTitle className="sr-only">{title}</DialogTitle>
          {children}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer onOpenChange={(open) => !open && onClose()} open={isOpen}>
      <DrawerContent className="max-h-[95vh] bg-background border-none p-0 overflow-x-hidden">
        <DrawerTitle className="sr-only">{title}</DrawerTitle>
        {children}
      </DrawerContent>
    </Drawer>
  );
}
