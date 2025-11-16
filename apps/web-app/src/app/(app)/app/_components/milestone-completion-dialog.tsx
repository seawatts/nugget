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
import { QuickChatDialogContent } from './quick-chat-dialog';

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
  milestoneType,
  onComplete,
}: MilestoneCompletionDialogProps) {
  const isDesktop = useMediaQuery({ query: '(min-width: 768px)' });
  const [isCompleting, setIsCompleting] = useState(false);

  // Generate initial assistant messages
  const initialMessages = [
    {
      content: milestoneTitle,
      createdAt: new Date(),
      id: 'milestone-title',
      role: 'assistant' as const,
    },
    {
      content:
        'Do you have any questions, comments or concerns around this milestone?',
      createdAt: new Date(),
      id: 'follow-up-question',
      role: 'assistant' as const,
    },
  ];

  const handleComplete = async () => {
    setIsCompleting(true);
    try {
      await onComplete({});
      onOpenChange(false);
    } catch (error) {
      console.error('Error completing milestone:', error);
    } finally {
      setIsCompleting(false);
    }
  };

  const content = (
    <QuickChatDialogContent
      babyId={babyId}
      contextId={`${milestoneType}-${milestoneTitle}`}
      contextType="milestone"
      initialMessages={initialMessages}
      placeholder="Share your thoughts..."
      title={milestoneTitle}
    />
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
