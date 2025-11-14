'use client';

import { api } from '@nugget/api/react';
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
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { toast } from 'sonner';

interface DeleteBabyDialogProps {
  isOpen: boolean;
  onClose: () => void;
  babyName: string;
  babyId: string;
}

export function DeleteBabyDialog({
  babyId,
  babyName,
  isOpen,
  onClose,
}: DeleteBabyDialogProps) {
  const [isPending, startTransition] = useTransition();
  const deleteBabyMutation = api.babies.delete.useMutation();
  const router = useRouter();
  const isDesktop = useIsDesktop();

  const handleDelete = () => {
    startTransition(async () => {
      try {
        // Delete baby from database
        await deleteBabyMutation.mutateAsync({ id: babyId });

        toast.success(`Successfully deleted ${babyName}'s profile`);

        // Redirect to app home
        router.push('/app');
        router.refresh();
      } catch (error) {
        console.error('Failed to delete baby:', error);
        toast.error(
          error instanceof Error
            ? error.message
            : 'Failed to delete baby profile',
        );
        onClose();
      }
    });
  };

  const content = (
    <div>
      <p className="text-sm text-muted-foreground">
        This will permanently delete <strong>{babyName}</strong>'s profile and
        all associated data including:
      </p>
      <ul className="list-disc list-inside mt-2 space-y-1 text-sm text-muted-foreground">
        <li>All activities (feeding, sleep, diapers, etc.)</li>
        <li>Supply tracking and inventory</li>
        <li>Growth records</li>
        <li>Medical records and milestones</li>
      </ul>
      <p className="mt-4 font-semibold text-destructive text-sm">
        This action cannot be undone.
      </p>
    </div>
  );

  if (isDesktop) {
    return (
      <AlertDialog onOpenChange={onClose} open={isOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Baby Profile?</AlertDialogTitle>
            <AlertDialogDescription asChild>{content}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isPending}
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
            >
              {isPending ? 'Deleting...' : 'Delete Profile'}
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
          <DrawerTitle>Delete Baby Profile?</DrawerTitle>
          <DrawerDescription asChild>{content}</DrawerDescription>
        </DrawerHeader>
        <DrawerFooter>
          <Button
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={isPending}
            onClick={handleDelete}
          >
            {isPending ? 'Deleting...' : 'Delete Profile'}
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
