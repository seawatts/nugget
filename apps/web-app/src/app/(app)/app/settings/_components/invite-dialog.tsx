'use client';

import { api } from '@nugget/api/react';
import { Button } from '@nugget/ui/button';
import { Icons } from '@nugget/ui/custom/icons';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@nugget/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@nugget/ui/drawer';
import { useIsDesktop } from '@nugget/ui/hooks/use-media-query';
import { Label } from '@nugget/ui/label';
import { RadioGroup, RadioGroupItem } from '@nugget/ui/radio-group';
import {
  Check,
  Copy,
  Crown,
  Heart,
  QrCode,
  Share2,
  Shield,
} from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { useEffect, useRef, useState } from 'react';

interface InviteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  existingInvitation?: {
    code: string;
    role: RoleType;
  } | null;
}

type RoleType = 'primary' | 'partner' | 'caregiver';

const roleOptions: Array<{
  value: RoleType;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  {
    description: 'Full access to all family data and settings',
    icon: Crown,
    label: 'Primary',
    value: 'primary',
  },
  {
    description: 'Can add and edit entries, view all data',
    icon: Heart,
    label: 'Partner',
    value: 'partner',
  },
  {
    description: 'Limited access for caregivers and babysitters',
    icon: Shield,
    label: 'Caregiver',
    value: 'caregiver',
  },
];

type CopyState = 'idle' | 'copying' | 'copied';

export function InviteDialog({
  isOpen,
  onClose,
  existingInvitation,
}: InviteDialogProps) {
  const isDesktop = useIsDesktop();
  const [selectedRole, setSelectedRole] = useState<RoleType>('partner');
  const [inviteUrl, setInviteUrl] = useState<string>('');
  const [copyState, setCopyState] = useState<CopyState>('idle');
  const [shared, setShared] = useState(false);
  const qrCodeRef = useRef<HTMLCanvasElement>(null);

  const createInvitationMutation = api.invitations.create.useMutation({
    onSuccess: (data) => {
      const url = `${window.location.origin}/invite/accept/${data.code}`;
      setInviteUrl(url);
    },
  });

  const handleGenerateInvite = () => {
    createInvitationMutation.mutate({ role: selectedRole });
  };

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

  // Set up existing invitation when dialog opens
  useEffect(() => {
    if (isOpen && existingInvitation) {
      const url = `${window.location.origin}/invite/accept/${existingInvitation.code}`;
      setInviteUrl(url);
      setSelectedRole(existingInvitation.role);
    }
  }, [isOpen, existingInvitation]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setInviteUrl('');
      setSelectedRole('partner');
      setCopyState('idle');
      setShared(false);
    }
  }, [isOpen]);

  const content = (
    <div className="space-y-6">
      {!inviteUrl ? (
        <>
          {/* Role Selection */}
          <div className="space-y-3">
            <Label>Select Role</Label>
            <RadioGroup
              onValueChange={(value) => setSelectedRole(value as RoleType)}
              value={selectedRole}
            >
              <div className="space-y-2">
                {roleOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                    <div
                      className="flex items-start gap-3 p-3 rounded-lg border border-border hover:border-primary/50 transition-colors cursor-pointer"
                      key={option.value}
                      onClick={() => setSelectedRole(option.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setSelectedRole(option.value);
                        }
                      }}
                    >
                      <RadioGroupItem id={option.value} value={option.value} />
                      <div className="flex items-start gap-3 flex-1">
                        <div className="size-10 rounded-full bg-primary/20 flex items-center justify-center">
                          <Icon className="size-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <Label
                            className="font-semibold cursor-pointer"
                            htmlFor={option.value}
                          >
                            {option.label}
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            {option.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </RadioGroup>
          </div>

          {/* Generate Button */}
          <Button
            className="w-full"
            disabled={createInvitationMutation.isPending}
            onClick={handleGenerateInvite}
            size="lg"
          >
            {createInvitationMutation.isPending ? (
              <>
                <Icons.Spinner className="size-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <QrCode className="size-4 mr-2" />
                Generate Invitation
              </>
            )}
          </Button>
        </>
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
    </div>
  );

  const dialogTitle = existingInvitation
    ? 'Share Invitation'
    : 'Invite Family Member';

  if (isDesktop) {
    return (
      <Dialog onOpenChange={onClose} open={isOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{dialogTitle}</DialogTitle>
          </DialogHeader>
          {content}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer onOpenChange={onClose} open={isOpen}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{dialogTitle}</DrawerTitle>
        </DrawerHeader>
        <div className="px-4 pb-8">{content}</div>
      </DrawerContent>
    </Drawer>
  );
}
