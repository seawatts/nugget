import { auth } from '@clerk/nextjs/server';
import { getApi } from '@nugget/api/server';
import { Card } from '@nugget/ui/card';
import {
  AlertCircle,
  Check,
  Clock,
  Crown,
  Heart,
  Shield,
  Users,
} from 'lucide-react';
import { notFound } from 'next/navigation';
import { AcceptInvitationButton } from './_components/accept-invitation-button';

const roleIcons = {
  caregiver: Shield,
  partner: Heart,
  primary: Crown,
};

const roleLabels = {
  caregiver: 'Caregiver',
  partner: 'Partner',
  primary: 'Primary',
};

const roleDescriptions = {
  caregiver:
    'Limited access for caregivers and babysitters. Can view schedules and add basic entries.',
  partner:
    'Full access to track and manage baby care together. Can add entries, view all data, and manage settings.',
  primary:
    'Complete access with administrative privileges. Can manage family members and all settings.',
};

export default async function InviteAcceptPage(props: {
  params: Promise<{ code: string }>;
}) {
  const params = await props.params;
  const { userId } = await auth();

  // Fetch invitation details (public, no auth required)
  const api = await getApi();
  let invitation: Awaited<ReturnType<typeof api.invitations.get>>;
  try {
    invitation = await api.invitations.get({ code: params.code });
  } catch (_error) {
    // Invitation not found or error occurred
    notFound();
  }

  // Check if expired
  const expiresAt = invitation.expiresAt
    ? new Date(invitation.expiresAt)
    : null;
  const isExpired = expiresAt && expiresAt < new Date();

  // Check if already used
  const isUsed = !invitation.isActive || !!invitation.usedAt;

  const RoleIcon = invitation.role
    ? roleIcons[invitation.role as keyof typeof roleIcons]
    : Users;
  const roleLabel = invitation.role
    ? roleLabels[invitation.role as keyof typeof roleLabels]
    : 'Member';
  const roleDescription = invitation.role
    ? roleDescriptions[invitation.role as keyof typeof roleDescriptions]
    : 'Access to family data';

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-muted/20">
      <Card className="max-w-md w-full p-8 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center size-16 rounded-full bg-primary/20 mb-2">
            <Users className="size-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">You've Been Invited!</h1>
          <p className="text-muted-foreground">
            {invitation.invitedBy?.firstName || invitation.invitedBy?.lastName
              ? `${invitation.invitedBy.firstName || ''} ${invitation.invitedBy.lastName || ''}`
              : 'Someone'}{' '}
            has invited you to join{' '}
            <span className="font-semibold text-foreground">
              {invitation.family.name}
            </span>
          </p>
        </div>

        {/* Inviter Info */}
        {invitation.invitedBy && (
          <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
            <div className="size-12 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
              {invitation.invitedBy.avatarUrl ? (
                <img
                  alt={
                    invitation.invitedBy.firstName ||
                    invitation.invitedBy.lastName ||
                    'User'
                  }
                  className="size-12 object-cover"
                  src={invitation.invitedBy.avatarUrl}
                />
              ) : (
                <Users className="size-6 text-primary" />
              )}
            </div>
            <div className="flex-1">
              <p className="font-medium">
                {invitation.invitedBy.firstName} {invitation.invitedBy.lastName}
              </p>
              <p className="text-sm text-muted-foreground">Invited by</p>
            </div>
          </div>
        )}

        {/* Role Information */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <RoleIcon className="size-4" />
            <span>You'll be invited as a {roleLabel}</span>
          </div>
          <Card className="p-4 bg-muted/30 border-border">
            <p className="text-sm text-muted-foreground">{roleDescription}</p>
          </Card>
        </div>

        {/* Status Messages */}
        {isExpired && (
          <div className="flex items-start gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/20">
            <AlertCircle className="size-5 text-destructive shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-destructive">
                Invitation Expired
              </p>
              <p className="text-sm text-destructive/80">
                This invitation has expired. Please request a new invitation
                from the family.
              </p>
            </div>
          </div>
        )}

        {isUsed && !isExpired && (
          <div className="flex items-start gap-3 p-4 rounded-lg bg-muted border border-border">
            <Check className="size-5 text-muted-foreground shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Already Used</p>
              <p className="text-sm text-muted-foreground">
                This invitation has already been accepted.
              </p>
            </div>
          </div>
        )}

        {/* Expiration Info */}
        {!isExpired && !isUsed && expiresAt && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="size-4" />
            <span>
              Expires on{' '}
              {expiresAt.toLocaleDateString('en-US', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </span>
          </div>
        )}

        {/* Accept Button */}
        {!isExpired && !isUsed && (
          <AcceptInvitationButton
            code={params.code}
            familyName={invitation.family.name}
            isAuthenticated={!!userId}
          />
        )}

        {/* Sign In Prompt */}
        {!userId && !isExpired && !isUsed && (
          <p className="text-xs text-center text-muted-foreground">
            You'll be asked to sign in or create an account to accept this
            invitation
          </p>
        )}
      </Card>
    </main>
  );
}
