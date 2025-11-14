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
import { Checkbox } from '@nugget/ui/checkbox';
import { Label } from '@nugget/ui/label';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { deleteUserFromClerk, redirectToHome } from '../actions';

interface DeleteAccountDialogProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

export function DeleteAccountDialog({
  isOpen,
  onClose,
  userId,
}: DeleteAccountDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [confirmed, setConfirmed] = useState(false);
  const deleteAccountMutation = api.user.deleteAccount.useMutation();

  const handleDelete = () => {
    if (!confirmed) {
      toast.error('Please confirm that you understand this is permanent');
      return;
    }

    startTransition(async () => {
      try {
        // First delete from database (cascades to all data)
        await deleteAccountMutation.mutateAsync();

        toast.success('Your account has been deleted');

        // Then delete from Clerk
        await deleteUserFromClerk(userId);

        // Redirect to home
        await redirectToHome();
      } catch (error) {
        console.error('Failed to delete account:', error);
        toast.error(
          error instanceof Error ? error.message : 'Failed to delete account',
        );
        onClose();
        setConfirmed(false);
      }
    });
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setConfirmed(false);
    }
    onClose();
  };

  return (
    <AlertDialog onOpenChange={handleOpenChange} open={isOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-destructive">
            Delete Account Permanently?
          </AlertDialogTitle>
          <AlertDialogDescription>
            <div className="space-y-4">
              <p>
                This will permanently delete your account and{' '}
                <strong>ALL</strong> associated data including:
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li>All baby profiles and organizations</li>
                <li>All activities across all profiles</li>
                <li>All supply tracking and inventory</li>
                <li>All growth records and medical information</li>
                <li>All photos and memories</li>
                <li>Your account information and settings</li>
              </ul>
              <div className="bg-destructive/10 border border-destructive rounded-lg p-4">
                <p className="font-semibold text-destructive">
                  ⚠️ This action is final and cannot be undone
                </p>
                <p className="text-sm mt-2">
                  All data will be permanently deleted and cannot be recovered.
                </p>
              </div>
              <div className="flex items-start gap-3 pt-2">
                <Checkbox
                  checked={confirmed}
                  id="confirm-delete"
                  onCheckedChange={(checked) =>
                    setConfirmed(checked as boolean)
                  }
                />
                <Label
                  className="text-sm font-medium cursor-pointer"
                  htmlFor="confirm-delete"
                >
                  I understand this is permanent and cannot be undone
                </Label>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={isPending || !confirmed}
            onClick={(e) => {
              e.preventDefault();
              handleDelete();
            }}
          >
            {isPending ? 'Deleting...' : 'Delete Account Permanently'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
