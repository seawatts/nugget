'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@nugget/ui/alert-dialog';
import { Button } from '@nugget/ui/button';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@nugget/ui/drawer';
import { useIsDesktop } from '@nugget/ui/hooks/use-media-query';

interface RemovePhotoDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  babyName: string;
  isPending: boolean;
}

export function RemovePhotoDialog({
  isOpen,
  onClose,
  onConfirm,
  babyName,
  isPending,
}: RemovePhotoDialogProps) {
  const isDesktop = useIsDesktop();

  const content = (
    <div>
      <p className="text-sm text-muted-foreground">
        This will remove <strong>{babyName}</strong>'s profile picture. The
        photo will remain stored and can be restored by selecting the photo
        option from the color choices.
      </p>
    </div>
  );

  if (isDesktop) {
    return (
      <AlertDialog onOpenChange={onClose} open={isOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Profile Picture?</AlertDialogTitle>
            <AlertDialogDescription asChild>{content}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isPending}
              onClick={(e) => {
                e.preventDefault();
                onConfirm();
              }}
            >
              {isPending ? 'Removing...' : 'Remove Photo'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  return (
    <Drawer onOpenChange={onClose} open={isOpen}>
      <DrawerContent>
        <DrawerHeader className="text-left">
          <DrawerTitle>Remove Profile Picture?</DrawerTitle>
          <DrawerDescription asChild>{content}</DrawerDescription>
        </DrawerHeader>
        <DrawerFooter>
          <Button
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={isPending}
            onClick={onConfirm}
          >
            {isPending ? 'Removing...' : 'Remove Photo'}
          </Button>
          <DrawerClose asChild>
            <Button disabled={isPending} variant="outline">
              Cancel
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
