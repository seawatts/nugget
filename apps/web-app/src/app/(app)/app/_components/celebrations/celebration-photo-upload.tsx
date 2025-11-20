'use client';

import { useClient } from '@nugget/db/supabase/client';
import { Button } from '@nugget/ui/button';
import { Icons } from '@nugget/ui/custom/icons';
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
import { Camera, Upload, X } from 'lucide-react';
import { useAction } from 'next-safe-action/hooks';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { addCelebrationPhotoAction } from './celebration-card.actions';

interface CelebrationPhotoUploadProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  babyId: string;
  babyName: string;
  celebrationType: string;
  existingPhotos: string[];
}

export function CelebrationPhotoUpload({
  open,
  onOpenChange,
  babyId,
  babyName,
  celebrationType,
  existingPhotos,
}: CelebrationPhotoUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isDesktop = useMediaQuery({ query: '(min-width: 768px)' });
  const supabase = useClient();

  const { execute: addPhoto } = useAction(addCelebrationPhotoAction, {
    onError: ({ error }) => {
      toast.error('Failed to save photo', {
        description: error.serverError || 'Please try again.',
      });
    },
    onSuccess: () => {
      toast.success('Photo added!', {
        description: 'Your celebration photo has been saved successfully.',
      });
      setSelectedFile(null);
      setPreviewUrl(null);
      onOpenChange(false);
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    try {
      // Convert file to blob
      const blob = await selectedFile
        .arrayBuffer()
        .then((ab) => new Blob([ab], { type: selectedFile.type }));

      // Generate unique filename
      const timestamp = Date.now();
      const filename = `${babyId}/celebrations/${celebrationType}/${timestamp}.jpg`;

      // Upload to Supabase Storage (using baby-avatars bucket for now)
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('baby-avatars')
        .upload(filename, blob, {
          cacheControl: '3600',
          contentType: selectedFile.type,
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from('baby-avatars').getPublicUrl(uploadData.path);

      // Save photo reference to database
      await addPhoto({
        babyId,
        celebrationType,
        photoUrl: publicUrl,
      });
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast.error('Upload failed', {
        description:
          error instanceof Error
            ? error.message
            : 'Failed to upload photo. Please try again.',
      });
      setIsUploading(false);
    }
  };

  const handleClear = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const content = (
    <div className="gap-4 grid py-4">
      {existingPhotos.length > 0 && (
        <div className="gap-2 grid">
          <Label>Existing Photos</Label>
          <div className="grid grid-cols-3 gap-2">
            {existingPhotos.map((url) => (
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
        </div>
      )}

      <div className="gap-2 grid">
        <Label>Add New Photo</Label>
        <input
          accept="image/*"
          capture="environment"
          className="hidden"
          id="photo-upload"
          onChange={handleFileSelect}
          ref={fileInputRef}
          type="file"
        />

        {!previewUrl ? (
          <label
            className="flex flex-col items-center justify-center gap-2 p-8 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
            htmlFor="photo-upload"
          >
            <Camera className="size-8 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Take or upload a photo
            </span>
          </label>
        ) : (
          <div className="relative aspect-video rounded-lg overflow-hidden border border-border">
            <img
              alt="Preview"
              className="object-cover size-full"
              src={previewUrl}
            />
            <Button
              className="absolute top-2 right-2"
              onClick={handleClear}
              size="icon"
              variant="destructive"
            >
              <X className="size-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );

  const footer = (
    <>
      <Button onClick={() => onOpenChange(false)} variant="outline">
        Cancel
      </Button>
      <Button disabled={!selectedFile || isUploading} onClick={handleUpload}>
        {isUploading ? (
          <>
            <Icons.Spinner className="animate-spin" size="sm" />
            Uploading...
          </>
        ) : (
          <>
            <Upload className="size-4" />
            Upload Photo
          </>
        )}
      </Button>
    </>
  );

  if (isDesktop) {
    return (
      <Dialog onOpenChange={onOpenChange} open={open}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Add Celebration Photo</DialogTitle>
            <DialogDescription>
              Capture this special moment with {babyName} to remember this
              milestone forever.
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
          <DrawerTitle>Add Celebration Photo</DrawerTitle>
          <DrawerDescription>
            Capture this special moment with {babyName} to remember this
            milestone forever.
          </DrawerDescription>
        </DrawerHeader>
        <div className="px-4">{content}</div>
        <DrawerFooter className="pt-2">{footer}</DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
