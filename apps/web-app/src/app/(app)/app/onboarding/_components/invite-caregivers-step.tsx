'use client';

import { api } from '@nugget/api/react';
import { Button } from '@nugget/ui/button';
import { Card } from '@nugget/ui/card';
import { Icons } from '@nugget/ui/custom/icons';
import { Label } from '@nugget/ui/label';
import {
  Check,
  Copy,
  Crown,
  Heart,
  Share2,
  Shield,
  User,
  Users,
} from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { useEffect, useRef, useState } from 'react';

type RoleType = 'primary' | 'partner' | 'caregiver';
type CopyState = 'idle' | 'copying' | 'copied';

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

export function InviteCaregiversStep() {
  const [inviteUrl, setInviteUrl] = useState<string>('');
  const [copyState, setCopyState] = useState<CopyState>('idle');
  const [shared, setShared] = useState(false);
  const qrCodeRef = useRef<HTMLCanvasElement>(null);

  const { data: members, isLoading: membersLoading } =
    api.familyMembers.all.useQuery();

  const createInvitationMutation = api.invitations.create.useMutation({
    onSuccess: (data) => {
      const url = `${window.location.origin}/app/invite/accept/${data.code}`;
      setInviteUrl(url);
    },
  });

  // Automatically generate invitation on mount
  useEffect(() => {
    if (!inviteUrl && !createInvitationMutation.isPending) {
      createInvitationMutation.mutate({ role: 'partner' });
    }
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createInvitationMutation, inviteUrl]);

  const handleCopy = async () => {
    if (!inviteUrl) return;

    setCopyState('copying');

    // Check if clipboard API is available
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(inviteUrl);
        setCopyState('copied');
        setTimeout(() => setCopyState('idle'), 2000);
        return;
      } catch (error) {
        console.error('Failed to copy with clipboard API:', error);
        // Fall through to fallback method
      }
    }

    // Fallback for older browsers or insecure contexts
    try {
      const textArea = document.createElement('textarea');
      textArea.value = inviteUrl;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);

      if (successful) {
        setCopyState('copied');
        setTimeout(() => setCopyState('idle'), 2000);
      } else {
        setCopyState('idle');
      }
    } catch (error) {
      console.error('Failed to copy with fallback:', error);
      setCopyState('idle');
    }
  };

  const handleShare = async () => {
    if (!inviteUrl) {
      console.error('No invite URL to share');
      return;
    }

    if (navigator.share) {
      try {
        const shareData = {
          text: 'Join my family on Nugget!',
          title: 'Family Invitation',
          url: inviteUrl,
        };

        await navigator.share(shareData);
        setShared(true);
        setTimeout(() => setShared(false), 2000);
      } catch (error) {
        // User canceled share - don't show error for AbortError
        if (error instanceof Error && error.name !== 'AbortError') {
          console.error('Failed to share:', error);
        }
      }
    } else {
      // Fallback to copy on desktop or unsupported browsers
      await handleCopy();
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-balance">Invite Family</h1>
        <p className="text-muted-foreground text-balance">
          Share your baby's journey with others (optional)
        </p>
      </div>

      {/* Family Members List */}
      <Card className="p-6 space-y-4">
        <div>
          <h2 className="text-xl font-semibold">Family Members</h2>
          <p className="text-sm text-muted-foreground">
            People who have access to your family
          </p>
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
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
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

      {/* Invite Section */}
      <Card className="p-6 space-y-6">
        <div>
          <h2 className="text-xl font-semibold">Invite Link</h2>
          <p className="text-sm text-muted-foreground">
            Share this link or QR code to invite family members
          </p>
        </div>

        {!inviteUrl || createInvitationMutation.isPending ? (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <Icons.Spinner className="size-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              Generating invitation...
            </p>
          </div>
        ) : (
          <>
            {/* QR Code */}
            <div className="flex flex-col items-center space-y-4">
              <div className="bg-white rounded-2xl shadow-lg p-4">
                <QRCodeCanvas
                  imageSettings={{
                    excavate: true,
                    height: 48,
                    src: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHJ4PSIxMiIgZmlsbD0id2hpdGUiLz4KICA8dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1zaXplPSI0MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSI+8J+QozwvdGV4dD4KPC9zdmc+',
                    width: 48,
                  }}
                  includeMargin={false}
                  level="H"
                  ref={qrCodeRef}
                  size={256}
                  value={inviteUrl}
                />
              </div>
              <p className="text-sm text-center text-muted-foreground">
                Scan this QR code to accept the invitation
              </p>
            </div>

            {/* Invitation Link */}
            <div className="space-y-2">
              <Label>Invitation Link</Label>
              <div className="flex gap-2">
                <input
                  className="flex-1 px-3 py-2 text-sm bg-muted rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                  readOnly
                  value={inviteUrl}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Button
                className="w-full"
                disabled={copyState !== 'idle'}
                onClick={handleCopy}
                variant="outline"
              >
                {copyState === 'copying' ? (
                  <>
                    <Icons.Spinner className="size-4 mr-2 animate-spin" />
                    Copying...
                  </>
                ) : copyState === 'copied' ? (
                  <>
                    <Check className="size-4 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="size-4 mr-2" />
                    Copy Link
                  </>
                )}
              </Button>
              <Button
                className="w-full"
                disabled={shared}
                onClick={handleShare}
                variant="outline"
              >
                {shared ? (
                  <>
                    <Check className="size-4 mr-2" />
                    Shared!
                  </>
                ) : (
                  <>
                    <Share2 className="size-4 mr-2" />
                    Share
                  </>
                )}
              </Button>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
