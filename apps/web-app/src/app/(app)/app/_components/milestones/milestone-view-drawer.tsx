'use client';

import type { Milestones } from '@nugget/db/schema';
import { Button } from '@nugget/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@nugget/ui/dialog';
import { Drawer, DrawerContent, DrawerTitle } from '@nugget/ui/drawer';
import { useIsDesktop } from '@nugget/ui/hooks/use-media-query';
import { format } from 'date-fns';
import { Sparkles, X } from 'lucide-react';

interface MilestoneViewDrawerProps {
  milestone: typeof Milestones.$inferSelect | null;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Drawer for viewing milestone details from the timeline
 */
export function MilestoneViewDrawer({
  milestone,
  isOpen,
  onClose,
}: MilestoneViewDrawerProps) {
  const isDesktop = useIsDesktop();

  if (!milestone) return null;

  const content = (
    <>
      {/* Header */}
      <div className="p-6 pb-4 bg-gradient-to-br from-purple-500/10 to-pink-500/10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Sparkles className="size-8 text-purple-600" strokeWidth={1.5} />
            <h2 className="text-2xl font-bold text-foreground">Milestone</h2>
          </div>
          <button
            className="p-2 rounded-full hover:bg-black/10 transition-colors text-foreground"
            onClick={onClose}
            type="button"
          >
            <X className="size-6" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Title */}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-foreground">
            {milestone.title}
          </h3>
          {milestone.achievedDate && (
            <p className="text-sm text-muted-foreground">
              Achieved on{' '}
              {format(new Date(milestone.achievedDate), 'MMMM d, yyyy')}
            </p>
          )}
        </div>

        {/* Description */}
        {'description' in milestone && milestone.description ? (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">
              Description
            </h4>
            <p className="text-base text-foreground whitespace-pre-wrap">
              {milestone.description}
            </p>
          </div>
        ) : null}

        {/* Type/Category */}
        {milestone.type && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">
              Category
            </h4>
            <p className="text-base text-foreground capitalize">
              {milestone.type.replace('_', ' ')}
            </p>
          </div>
        )}

        {/* Age Label */}
        {'ageLabel' in milestone && milestone.ageLabel ? (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">
              Typical Age Range
            </h4>
            <p className="text-base text-foreground">
              {String(milestone.ageLabel)}
            </p>
          </div>
        ) : null}
      </div>

      {/* Footer */}
      <div className="p-6 pt-4 border-t border-border">
        <Button
          className="w-full h-12 text-base"
          onClick={onClose}
          variant="outline"
        >
          Close
        </Button>
      </div>
    </>
  );

  if (isDesktop) {
    return (
      <Dialog onOpenChange={onClose} open={isOpen}>
        <DialogContent
          className="sm:max-w-2xl max-h-[95vh] p-0 gap-0 overflow-hidden flex flex-col"
          onPointerDownOutside={(e) => e.preventDefault()}
          showCloseButton={false}
        >
          <DialogTitle className="sr-only">Milestone Details</DialogTitle>
          {content}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer
      dismissible={false}
      onOpenChange={(open) => !open && onClose()}
      open={isOpen}
    >
      <DrawerContent
        className="max-h-[95vh] bg-background border-none p-0"
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <DrawerTitle className="sr-only">Milestone Details</DrawerTitle>
        {content}
      </DrawerContent>
    </Drawer>
  );
}
