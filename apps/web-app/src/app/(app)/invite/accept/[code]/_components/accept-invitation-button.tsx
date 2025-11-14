'use client';

import { SignInButton } from '@clerk/nextjs';
import { api } from '@nugget/api/react';
import { Button } from '@nugget/ui/button';
import { Icons } from '@nugget/ui/custom/icons';
import { Check, UserPlus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface AcceptInvitationButtonProps {
  code: string;
  familyName: string;
  isAuthenticated: boolean;
}

export function AcceptInvitationButton({
  code,
  familyName: _familyName,
  isAuthenticated,
}: AcceptInvitationButtonProps) {
  const router = useRouter();

  const acceptMutation = api.invitations.accept.useMutation({
    onError: (error) => {
      // If user is already a member, just redirect them to the app
      if (
        error.message?.includes('already a member') ||
        error.message?.includes('already in this family')
      ) {
        router.push('/app');
        return;
      }
      // For other errors, show the error message
      toast.error(error.message || 'Failed to accept invitation');
    },
    onSuccess: (data) => {
      toast.success(`Welcome to ${data.familyName}!`);
      // Redirect to main app after accepting
      router.push('/app');
    },
  });

  const handleAccept = () => {
    acceptMutation.mutate({ code });
  };

  if (!isAuthenticated) {
    return (
      <SignInButton
        forceRedirectUrl={`/app/invite/accept/${code}`}
        mode="modal"
      >
        <Button className="w-full" size="lg">
          <UserPlus className="size-4 mr-2" />
          Sign In to Accept
        </Button>
      </SignInButton>
    );
  }

  return (
    <Button
      className="w-full"
      disabled={acceptMutation.isPending || acceptMutation.isSuccess}
      onClick={handleAccept}
      size="lg"
    >
      {acceptMutation.isPending ? (
        <>
          <Icons.Spinner className="size-4 mr-2 animate-spin" />
          Accepting...
        </>
      ) : acceptMutation.isSuccess ? (
        <>
          <Check className="size-4 mr-2" />
          Accepted!
        </>
      ) : (
        <>
          <Check className="size-4 mr-2" />
          Accept Invitation
        </>
      )}
    </Button>
  );
}
