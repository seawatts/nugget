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
import { useTransition } from 'react';
import { toast } from 'sonner';
import { deleteOrgFromClerk, redirectToOnboarding } from '../actions';

interface DeleteOrgDialogProps {
  isOpen: boolean;
  onClose: () => void;
  organizationName: string;
  clerkOrgId: string;
}

export function DeleteOrgDialog({
  clerkOrgId,
  isOpen,
  onClose,
  organizationName,
}: DeleteOrgDialogProps) {
  const [isPending, startTransition] = useTransition();
  const deleteOrgMutation = api.family.delete.useMutation();

  const handleDelete = () => {
    startTransition(async () => {
      try {
        // First delete from database
        await deleteOrgMutation.mutateAsync();

        toast.success(`Successfully deleted ${organizationName}`);

        // Then delete from Clerk
        await deleteOrgFromClerk(clerkOrgId);

        // Redirect to onboarding
        await redirectToOnboarding();
      } catch (error) {
        console.error('Failed to delete organization:', error);
        toast.error(
          error instanceof Error
            ? error.message
            : 'Failed to delete baby profile',
        );
        onClose();
      }
    });
  };

  return (
    <AlertDialog onOpenChange={onClose} open={isOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Baby Profile?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete <strong>{organizationName}</strong> and
            all associated data including:
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>All activities (feeding, sleep, diapers, etc.)</li>
              <li>Supply tracking and inventory</li>
              <li>Growth records</li>
              <li>All photos and memories</li>
            </ul>
            <p className="mt-4 font-semibold text-destructive">
              This action cannot be undone.
            </p>
          </AlertDialogDescription>
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
