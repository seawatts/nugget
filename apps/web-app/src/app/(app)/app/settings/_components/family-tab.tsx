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
import { Card } from '@nugget/ui/card';
import { Icons } from '@nugget/ui/custom/icons';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@nugget/ui/dropdown-menu';
import { formatDistanceToNow } from 'date-fns';
import {
  AlertCircle,
  Calendar,
  Crown,
  Heart,
  MoreVertical,
  Plus,
  Shield,
  Trash2,
  User,
  Users,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { InviteDialog } from './invite-dialog';

type RoleType = 'primary' | 'partner' | 'caregiver';

const roleIcons: Record<
  RoleType,
  React.ComponentType<{ className?: string }>
> = {
  caregiver: Shield,
  partner: Heart,
  primary: Crown,
};

const roleLabels: Record<RoleType, string> = {
  caregiver: 'Caregiver',
  partner: 'Partner',
  primary: 'Primary',
};

const roleColors: Record<RoleType, string> = {
  caregiver: 'text-secondary',
  partner: 'text-accent',
  primary: 'text-primary',
};

export function FamilyTab() {
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [selectedInvitation, setSelectedInvitation] = useState<{
    code: string;
    role: RoleType;
  } | null>(null);
  const [memberToRemove, setMemberToRemove] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [invitationToRevoke, setInvitationToRevoke] = useState<{
    id: string;
  } | null>(null);

  const { data: members, isLoading: membersLoading } =
    api.familyMembers.all.useQuery();
  const { data: invitations, isLoading: invitationsLoading } =
    api.invitations.list.useQuery();

  const utils = api.useUtils();

  const removeMemberMutation = api.familyMembers.remove.useMutation({
    onError: (error) => {
      toast.error(error.message || 'Failed to remove member');
    },
    onSuccess: () => {
      toast.success('Member removed from family');
      void utils.familyMembers.all.invalidate();
      setMemberToRemove(null);
    },
  });

  const revokeInvitationMutation = api.invitations.revoke.useMutation({
    onError: (error) => {
      toast.error(error.message || 'Failed to revoke invitation');
    },
    onSuccess: () => {
      toast.success('Invitation revoked');
      void utils.invitations.list.invalidate();
      setInvitationToRevoke(null);
    },
  });

  const handleRemoveMember = () => {
    if (memberToRemove) {
      removeMemberMutation.mutate({ userId: memberToRemove.id });
    }
  };

  const handleRevokeInvitation = () => {
    if (invitationToRevoke) {
      revokeInvitationMutation.mutate({
        invitationId: invitationToRevoke.id,
      });
    }
  };

  const activeInvitations = invitations?.filter(
    (inv) => inv.isActive && !inv.usedAt,
  );
  const usedInvitations = invitations?.filter(
    (inv) => inv.usedAt || !inv.isActive,
  );

  return (
    <div className="space-y-4">
      {/* Family Members */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Family Members</h2>
            <p className="text-sm text-muted-foreground">
              People who have access to your family
            </p>
          </div>
          <Button
            onClick={() => {
              setSelectedInvitation(null);
              setShowInviteDialog(true);
            }}
            size="sm"
          >
            <Plus className="size-4 mr-2" />
            Invite
          </Button>
        </div>

        {membersLoading ? (
          <div className="flex items-center justify-center py-8">
            <Icons.Spinner className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : members && members.length > 0 ? (
          <div className="space-y-2">
            {members.map((member) => {
              const RoleIcon = member.role
                ? roleIcons[member.role as RoleType]
                : User;
              const roleLabel = member.role
                ? roleLabels[member.role as RoleType]
                : 'Member';
              const roleColor = member.role
                ? roleColors[member.role as RoleType]
                : 'text-muted-foreground';

              return (
                <div
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors"
                  key={member.id}
                >
                  <div className="size-10 rounded-full bg-primary/20 flex items-center justify-center">
                    {member.user?.avatarUrl ? (
                      <img
                        alt={`${member.user.firstName || ''} ${member.user.lastName || ''}`}
                        className="size-10 rounded-full object-cover"
                        src={member.user.avatarUrl}
                      />
                    ) : (
                      <User className="size-5 text-primary" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium truncate">
                        {member.user?.firstName || member.user?.email}{' '}
                        {member.user?.lastName || ''}
                      </p>
                      <div className={`flex items-center gap-1 ${roleColor}`}>
                        <RoleIcon className="size-3" />
                        <span className="text-xs">{roleLabel}</span>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {member.user?.email}
                    </p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" variant="ghost">
                        <MoreVertical className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => {
                          setMemberToRemove({
                            id: member.userId,
                            name: `${member.user?.firstName || member.user?.email} ${member.user?.lastName || ''}`.trim(),
                          });
                        }}
                      >
                        <Trash2 className="size-4 mr-2" />
                        Remove
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Users className="size-12 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">
              No family members yet
            </p>
          </div>
        )}
      </Card>

      {/* Active Invitations */}
      {activeInvitations && activeInvitations.length > 0 && (
        <Card className="p-6 space-y-4">
          <div>
            <h2 className="text-xl font-semibold">Pending Invitations</h2>
            <p className="text-sm text-muted-foreground">
              Invitations waiting to be accepted
            </p>
          </div>

          {invitationsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Icons.Spinner className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-2">
              {activeInvitations.map((invitation) => {
                const RoleIcon = invitation.role
                  ? roleIcons[invitation.role as RoleType]
                  : User;
                const roleLabel = invitation.role
                  ? roleLabels[invitation.role as RoleType]
                  : 'Member';
                const roleColor = invitation.role
                  ? roleColors[invitation.role as RoleType]
                  : 'text-muted-foreground';

                const expiresAt = invitation.expiresAt
                  ? new Date(invitation.expiresAt)
                  : null;
                const isExpired = expiresAt && expiresAt < new Date();

                const handleInvitationClick = () => {
                  setSelectedInvitation({
                    code: invitation.code,
                    role: invitation.role as RoleType,
                  });
                  setShowInviteDialog(true);
                };

                return (
                  <button
                    className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/50 transition-colors cursor-pointer group w-full text-left"
                    key={invitation.id}
                    onClick={handleInvitationClick}
                    type="button"
                  >
                    <div className="size-10 rounded-full bg-secondary/20 flex items-center justify-center group-hover:bg-secondary/30 transition-colors">
                      <RoleIcon className={`size-5 ${roleColor}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{roleLabel} Invitation</p>
                        {isExpired && (
                          <span className="text-xs text-destructive flex items-center gap-1">
                            <AlertCircle className="size-3" />
                            Expired
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="size-3" />
                        <span>
                          {expiresAt
                            ? `Expires ${formatDistanceToNow(expiresAt, { addSuffix: true })}`
                            : 'No expiration'}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Click to share • Code: {invitation.code}
                      </p>
                    </div>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        setInvitationToRevoke({ id: invitation.id });
                      }}
                      size="sm"
                      variant="ghost"
                    >
                      <X className="size-4 mr-1" />
                      Revoke
                    </Button>
                  </button>
                );
              })}
            </div>
          )}
        </Card>
      )}

      {/* Used Invitations */}
      {usedInvitations && usedInvitations.length > 0 && (
        <Card className="p-6 space-y-4">
          <div>
            <h2 className="text-xl font-semibold">Used Invitations</h2>
            <p className="text-sm text-muted-foreground">
              Previously accepted invitations
            </p>
          </div>

          <div className="space-y-2">
            {usedInvitations.map((invitation) => {
              const RoleIcon = invitation.role
                ? roleIcons[invitation.role as RoleType]
                : User;
              const roleLabel = invitation.role
                ? roleLabels[invitation.role as RoleType]
                : 'Member';

              return (
                <div
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/30"
                  key={invitation.id}
                >
                  <div className="size-10 rounded-full bg-muted flex items-center justify-center">
                    <RoleIcon className="size-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-muted-foreground">
                      {roleLabel} Invitation
                    </p>
                    {invitation.usedBy && (
                      <p className="text-sm text-muted-foreground">
                        Used by{' '}
                        {invitation.usedBy.firstName || invitation.usedBy.email}
                      </p>
                    )}
                    {invitation.usedAt && (
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(invitation.usedAt), {
                          addSuffix: true,
                        })}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Invite Dialog */}
      <InviteDialog
        existingInvitation={selectedInvitation}
        isOpen={showInviteDialog}
        onClose={() => {
          setShowInviteDialog(false);
          setSelectedInvitation(null);
        }}
      />

      {/* Remove Member Confirmation */}
      <AlertDialog
        onOpenChange={(open) => !open && setMemberToRemove(null)}
        open={!!memberToRemove}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Family Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {memberToRemove?.name} from your
              family? They will lose access to all family data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleRemoveMember}
            >
              {removeMemberMutation.isPending ? (
                <>
                  <Icons.Spinner className="size-4 mr-2 animate-spin" />
                  Removing...
                </>
              ) : (
                'Remove'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Revoke Invitation Confirmation */}
      <AlertDialog
        onOpenChange={(open) => !open && setInvitationToRevoke(null)}
        open={!!invitationToRevoke}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke Invitation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to revoke this invitation? The invite link
              will no longer work.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRevokeInvitation}>
              {revokeInvitationMutation.isPending ? (
                <>
                  <Icons.Spinner className="size-4 mr-2 animate-spin" />
                  Revoking...
                </>
              ) : (
                'Revoke'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
