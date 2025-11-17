'use client';

import { api } from '@nugget/api/react';
import { Avatar, AvatarFallback, AvatarImage } from '@nugget/ui/avatar';
import { Button } from '@nugget/ui/button';
import { Checkbox } from '@nugget/ui/checkbox';
import { Icons } from '@nugget/ui/custom/icons';
import { Text } from '@nugget/ui/custom/typography';
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
import { Check, Copy } from 'lucide-react';
import { useAction } from 'next-safe-action/hooks';
import { useState } from 'react';
import { shareCelebrationAction } from './celebration-card.actions';

interface CelebrationShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  babyId: string;
  babyName: string;
  celebrationType: string;
  celebrationTitle: string;
}

export function CelebrationShareDialog({
  open,
  onOpenChange,
  babyId,
  babyName,
  celebrationType,
  celebrationTitle,
}: CelebrationShareDialogProps) {
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const isDesktop = useMediaQuery({ query: '(min-width: 768px)' });

  // Get family members
  const { data: familyMembers = [] } = api.familyMembers.all.useQuery();

  const { execute: share, isExecuting } = useAction(shareCelebrationAction, {
    onSuccess: () => {
      setSelectedUserIds([]);
      onOpenChange(false);
    },
  });

  const handleShare = () => {
    if (selectedUserIds.length === 0) return;

    share({
      babyId,
      celebrationType,
      userIds: selectedUserIds,
    });
  };

  const handleCopyLink = () => {
    const shareText = `${celebrationTitle}\n\n${babyName} just reached an amazing milestone! 🎉`;
    navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleUser = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId],
    );
  };

  const content = (
    <div className="gap-4 grid py-4">
      {/* Copy Link Section */}
      <div className="gap-2 grid">
        <Label>Share Link</Label>
        <div className="flex items-center gap-2">
          <Button
            className="flex-1 justify-start"
            onClick={handleCopyLink}
            variant="outline"
          >
            {copied ? (
              <>
                <Check className="size-4 text-green-600" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="size-4" />
                Copy celebration message
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Family Members Section */}
      {familyMembers.length > 0 && (
        <div className="gap-2 grid">
          <Label>Share with Family</Label>
          <div className="gap-2 grid max-h-[300px] overflow-y-auto">
            {familyMembers.map((member) => (
              <button
                className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer text-left"
                key={member.userId}
                onClick={() => toggleUser(member.userId)}
                type="button"
              >
                <Checkbox
                  checked={selectedUserIds.includes(member.userId)}
                  onCheckedChange={() => toggleUser(member.userId)}
                />
                <Avatar className="size-8">
                  <AvatarImage src={member.user?.avatarUrl || ''} />
                  <AvatarFallback>
                    {member.user?.firstName?.[0]}
                    {member.user?.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <Text className="font-medium" size="sm">
                    {member.user?.firstName} {member.user?.lastName}
                  </Text>
                  <Text size="xs" variant="muted">
                    {member.role}
                  </Text>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {familyMembers.length === 0 && (
        <div className="text-center py-8">
          <Text variant="muted">
            No family members to share with yet. Invite family members to share
            this special moment!
          </Text>
        </div>
      )}
    </div>
  );

  const footer = (
    <>
      <Button onClick={() => onOpenChange(false)} variant="outline">
        Cancel
      </Button>
      <Button
        disabled={selectedUserIds.length === 0 || isExecuting}
        onClick={handleShare}
      >
        {isExecuting ? (
          <>
            <Icons.Spinner className="animate-spin" size="sm" />
            Sharing...
          </>
        ) : (
          `Share with ${selectedUserIds.length} ${
            selectedUserIds.length === 1 ? 'person' : 'people'
          }`
        )}
      </Button>
    </>
  );

  if (isDesktop) {
    return (
      <Dialog onOpenChange={onOpenChange} open={open}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Share Celebration</DialogTitle>
            <DialogDescription>
              Share {babyName}&apos;s special milestone with family and friends.
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
          <DrawerTitle>Share Celebration</DrawerTitle>
          <DrawerDescription>
            Share {babyName}&apos;s special milestone with family and friends.
          </DrawerDescription>
        </DrawerHeader>
        <div className="px-4">{content}</div>
        <DrawerFooter className="pt-2">{footer}</DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
