'use client';

import { Button } from '@nugget/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@nugget/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@nugget/ui/drawer';
import { useMediaQuery } from '@nugget/ui/hooks/use-media-query';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { ChatDialogContent } from './chat-dialog';

interface MilestoneCompletionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  babyId: string;
  milestoneTitle: string;
  milestoneType: string;
  onComplete: (data: { note?: string; photoUrl?: string }) => Promise<void>;
}

export function MilestoneCompletionDialog({
  open,
  onOpenChange,
  babyId,
  milestoneTitle,
  milestoneType: _milestoneType,
  onComplete,
}: MilestoneCompletionDialogProps) {
  const isDesktop = useMediaQuery({ query: '(min-width: 768px)' });
  const [isCompleting, setIsCompleting] = useState(false);
  const [note, setNote] = useState('');

  // Generate initial AI question about the milestone
  const initialMessages = [
    {
      content: `Tell me more about "${milestoneTitle}". What does this milestone mean for my baby's development?`,
      createdAt: new Date(),
      id: 'initial-question',
      role: 'user' as const,
    },
  ];

  const handleComplete = async () => {
    setIsCompleting(true);
    try {
      await onComplete({ note: note || undefined });
      onOpenChange(false);
      setNote('');
    } catch (error) {
      console.error('Error completing milestone:', error);
    } finally {
      setIsCompleting(false);
    }
  };

  const content = (
    <div className="flex flex-col h-full">
      {/* AI Chat Section */}
      <div className="flex-1 min-h-0">
        <ChatDialogContent
          babyId={babyId}
          compact={true}
          initialMessages={initialMessages}
        />
      </div>

      {/* Optional Note Section */}
      <div className="border-t border-border p-4 space-y-3">
        <div className="space-y-2">
          <label
            className="text-sm font-medium text-foreground"
            htmlFor="milestone-note"
          >
            Add a note (optional)
          </label>
          <textarea
            className="w-full min-h-[80px] rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            id="milestone-note"
            onChange={(e) => setNote(e.target.value)}
            placeholder="Any thoughts or observations about this milestone?"
            value={note}
          />
        </div>
      </div>
    </div>
  );

  const footer = (
    <Button
      className="w-full"
      disabled={isCompleting}
      onClick={handleComplete}
      size="lg"
    >
      {isCompleting ? (
        <>
          <Loader2 className="size-4 mr-2 animate-spin" />
          Saving...
        </>
      ) : (
        <>
          <CheckCircle2 className="size-4 mr-2" />
          Mark as Complete
        </>
      )}
    </Button>
  );

  if (isDesktop) {
    return (
      <Dialog onOpenChange={onOpenChange} open={open}>
        <DialogContent className="max-w-2xl h-[80vh] flex flex-col p-0">
          <DialogHeader className="px-6 py-4 border-b">
            <DialogTitle>{milestoneTitle}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 min-h-0">{content}</div>
          <DialogFooter className="px-6 py-4 border-t">{footer}</DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer onOpenChange={onOpenChange} open={open}>
      <DrawerContent className="h-[90vh] flex flex-col">
        <DrawerHeader className="border-b">
          <DrawerTitle>{milestoneTitle}</DrawerTitle>
        </DrawerHeader>
        <div className="flex-1 min-h-0">{content}</div>
        <DrawerFooter className="border-t">{footer}</DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

// Export ChatDialogContent for reuse
export { ChatDialogContent };
