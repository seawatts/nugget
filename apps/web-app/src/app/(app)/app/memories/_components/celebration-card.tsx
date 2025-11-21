'use client';

import { Button } from '@nugget/ui/button';
import { Card } from '@nugget/ui/card';
import { Icons } from '@nugget/ui/custom/icons';
import { H2, Text } from '@nugget/ui/custom/typography';
import { Camera, Share2 } from 'lucide-react';
import { useState } from 'react';
import type { CelebrationCardData } from './celebration-card.actions';
import { CelebrationPhotoUpload } from './celebration-photo-upload';
import { CelebrationShareDialog } from './celebration-share-dialog';

interface CelebrationCardProps {
  celebration: CelebrationCardData;
  babyId: string;
  babyName: string;
}

export function CelebrationCard({
  celebration,
  babyId,
  babyName,
}: CelebrationCardProps) {
  const [photoUploadOpen, setPhotoUploadOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);

  const handleActionClick = (actionType: string) => {
    switch (actionType) {
      case 'take_photo':
        setPhotoUploadOpen(true);
        break;
      case 'share':
        setShareDialogOpen(true);
        break;
    }
  };

  return (
    <>
      <Card className="relative overflow-hidden border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        {/* Confetti-like decorative elements */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-4 left-4 size-3 rounded-full bg-primary/20 animate-pulse" />
          <div className="absolute top-8 right-8 size-2 rounded-full bg-secondary/30 animate-pulse delay-100" />
          <div className="absolute bottom-6 left-12 size-2.5 rounded-full bg-accent/20 animate-pulse delay-200" />
          <div className="absolute top-12 right-16 size-1.5 rounded-full bg-primary/30 animate-pulse delay-300" />
          <div className="absolute bottom-12 right-6 size-2 rounded-full bg-secondary/20 animate-pulse delay-150" />
        </div>

        <div className="relative p-6 gap-6 grid">
          {/* Header with celebration title */}
          <div className="text-center gap-2 grid">
            <H2 className="text-3xl font-bold text-primary">
              {celebration.title}
            </H2>
            <Text className="font-medium" size="lg" variant="muted">
              {babyName} is {celebration.ageLabel.toLowerCase()}
            </Text>
          </div>

          {/* Statistics Section */}
          <div className="grid grid-cols-3 gap-4 p-4 rounded-lg bg-background/50 border border-border/50">
            <div className="text-center gap-1 grid">
              <Icons.Milk className="mx-auto text-primary" size="lg" />
              <Text size="sm" variant="muted">
                Feedings
              </Text>
              <Text className="font-bold" size="lg">
                {celebration.statistics.feedingCount || 0}
              </Text>
            </div>
            <div className="text-center gap-1 grid">
              <Icons.Moon className="mx-auto text-primary" size="lg" />
              <Text size="sm" variant="muted">
                Sleep Hours
              </Text>
              <Text className="font-bold" size="lg">
                {celebration.statistics.sleepHours?.toFixed(1) || 0}
              </Text>
            </div>
            <div className="text-center gap-1 grid">
              <Icons.Baby className="mx-auto text-primary" size="lg" />
              <Text size="sm" variant="muted">
                Diapers
              </Text>
              <Text className="font-bold" size="lg">
                {celebration.statistics.diaperCount || 0}
              </Text>
            </div>
          </div>

          {/* Photos if exist */}
          {celebration.memory?.photoUrls &&
            celebration.memory.photoUrls.length > 0 && (
              <div className="grid grid-cols-2 gap-2">
                {celebration.memory.photoUrls.map((url) => (
                  <div
                    className="relative aspect-square rounded-lg overflow-hidden border border-border"
                    key={url}
                  >
                    <img
                      alt={'Celebration memory'}
                      className="object-cover size-full"
                      src={url}
                    />
                  </div>
                ))}
              </div>
            )}

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            {celebration.actions
              .filter((action) => action.type !== 'save_memory')
              .map((action) => (
                <Button
                  className="gap-2 flex-col h-auto py-3"
                  key={action.type}
                  onClick={() => handleActionClick(action.type)}
                  size="sm"
                  variant="outline"
                >
                  {action.type === 'take_photo' && (
                    <Camera className="size-4" />
                  )}
                  {action.type === 'share' && <Share2 className="size-4" />}
                  <span className="text-xs">{action.label}</span>
                </Button>
              ))}
          </div>

          {/* Shared status */}
          {celebration.memory?.sharedWith &&
            celebration.memory.sharedWith.length > 0 && (
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <Share2 className="size-4" />
                <Text size="sm" variant="muted">
                  Shared with {celebration.memory.sharedWith.length}{' '}
                  {celebration.memory.sharedWith.length === 1
                    ? 'person'
                    : 'people'}
                </Text>
              </div>
            )}
        </div>
      </Card>

      {/* Dialogs */}
      <CelebrationPhotoUpload
        babyId={babyId}
        babyName={babyName}
        celebrationType={celebration.celebrationType}
        existingPhotos={celebration.memory?.photoUrls || []}
        onOpenChange={setPhotoUploadOpen}
        open={photoUploadOpen}
      />

      <CelebrationShareDialog
        babyId={babyId}
        babyName={babyName}
        celebrationMemoryId={celebration.id}
        celebrationTitle={celebration.title}
        celebrationType={celebration.celebrationType}
        onOpenChange={setShareDialogOpen}
        open={shareDialogOpen}
      />
    </>
  );
}
