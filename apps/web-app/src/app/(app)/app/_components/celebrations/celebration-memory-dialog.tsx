'use client';

import { Button } from '@nugget/ui/button';
import { Icons } from '@nugget/ui/custom/icons';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@nugget/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@nugget/ui/drawer';
import { useMediaQuery } from '@nugget/ui/hooks/use-media-query';
import { Label } from '@nugget/ui/label';
import { Textarea } from '@nugget/ui/textarea';
import { useAction } from 'next-safe-action/hooks';
import { useState } from 'react';
import { saveCelebrationMemoryAction } from './celebration-card.actions';

interface CelebrationMemoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  babyId: string;
  babyName: string;
  celebrationType: string;
  existingNote: string;
}

export function CelebrationMemoryDialog({
  open,
  onOpenChange,
  babyId,
  babyName,
  celebrationType,
  existingNote,
}: CelebrationMemoryDialogProps) {
  const [note, setNote] = useState(existingNote);
  const isDesktop = useMediaQuery({ query: '(min-width: 768px)' });

  const { execute: saveMemory, isExecuting } = useAction(
    saveCelebrationMemoryAction,
    {
      onSuccess: () => {
        onOpenChange(false);
      },
    },
  );

  const handleSave = () => {
    saveMemory({
      babyId,
      celebrationType,
      note,
    });
  };

  const content = (
    <div className="gap-4 grid py-4">
      <div className="gap-2 grid">
        <Label htmlFor="memory-note">Your Memory</Label>
        <Textarea
          className="resize-none"
          id="memory-note"
          onChange={(e) => setNote(e.target.value)}
          placeholder={`Write a special memory about ${babyName}...`}
          rows={6}
          value={note}
        />
      </div>
    </div>
  );

  const footer = (
    <>
      <Button onClick={() => onOpenChange(false)} variant="outline">
        Cancel
      </Button>
      <Button disabled={isExecuting || !note.trim()} onClick={handleSave}>
        {isExecuting ? (
          <>
            <Icons.Spinner className="animate-spin" size="sm" />
            Saving...
          </>
        ) : (
          'Save Memory'
        )}
      </Button>
    </>
  );

  if (isDesktop) {
    return (
      <Dialog onOpenChange={onOpenChange} open={open}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Save a Memory</DialogTitle>
            <DialogDescription>
              Write down a special moment or thought about {babyName} to
              remember this milestone.
            </DialogDescription>
          </DialogHeader>
          {content}
          <DialogFooter>{footer}</DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer onOpenChange={onOpenChange} open={open}>
      <DrawerContent>
        <DrawerHeader className="text-left">
          <DrawerTitle>Save a Memory</DrawerTitle>
          <DrawerDescription>
            Write down a special moment or thought about {babyName} to remember
            this milestone.
          </DrawerDescription>
        </DrawerHeader>
        <div className="px-4">{content}</div>
        <DrawerFooter className="pt-2">{footer}</DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
