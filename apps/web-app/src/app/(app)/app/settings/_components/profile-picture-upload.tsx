'use client';

import { api } from '@nugget/api/react';
import { useClient } from '@nugget/db/supabase/client';
import { Button } from '@nugget/ui/button';
import {
  type ImageCrop,
  ImageCropEditor,
} from '@nugget/ui/custom/image-crop-editor';
import { NuggetAvatar } from '@nugget/ui/custom/nugget-avatar';
import { Camera, Loader2 } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';
import { toast } from 'sonner';

interface ProfilePictureUploadProps {
  babyId: string;
  babyName: string;
  currentPhotoUrl?: string | null;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];

export function ProfilePictureUpload({
  babyId,
  babyName,
  currentPhotoUrl,
}: ProfilePictureUploadProps) {
  const utils = api.useUtils();
  const supabase = useClient(); // This already handles Clerk authentication
  const updateBaby = api.babies.update.useMutation();

  const [isUploading, setIsUploading] = useState(false);
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [showCropEditor, setShowCropEditor] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        toast.error('File too large', {
          description: 'Please select an image smaller than 5MB',
        });
        return;
      }

      // Validate file type
      if (!ALLOWED_TYPES.includes(file.type)) {
        toast.error('Invalid file type', {
          description: 'Please select a PNG, JPEG, or WebP image',
        });
        return;
      }

      // Read file as data URL
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        setImageDataUrl(dataUrl);
        setShowCropEditor(true);
      };
      reader.readAsDataURL(file);

      // Reset input value so same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [],
  );

  const handleCropSave = useCallback(
    async (crop: ImageCrop) => {
      if (!imageDataUrl) return;

      setIsUploading(true);
      setShowCropEditor(false);

      try {
        // Note: Authentication is handled automatically by the supabase client
        // via the useClient() hook which uses Clerk's session token

        // Create canvas to crop image
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          throw new Error('Failed to get canvas context');
        }

        // Set canvas size (circular crop)
        const size = 400;
        canvas.width = size;
        canvas.height = size;

        // Load image
        const img = new Image();
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = imageDataUrl;
        });

        // Apply circular clip
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();

        // Calculate dimensions with crop
        // The crop editor displays images at container width (300px mobile, 400px desktop)
        // and applies scale on top of that. We need to match that coordinate system.
        const editorContainerSize = window.innerWidth >= 768 ? 400 : 300;

        // Calculate the base display dimensions (what the image would be at scale 1.0 in the editor)
        const imageAspectRatio = img.naturalHeight / img.naturalWidth;
        const baseDisplayWidth = editorContainerSize;
        const baseDisplayHeight = baseDisplayWidth * imageAspectRatio;

        // Apply the crop scale to get actual displayed dimensions in the editor
        const displayedWidth = baseDisplayWidth * crop.scale;
        const displayedHeight = baseDisplayHeight * crop.scale;

        // Calculate the ratio to map from editor coordinates to canvas coordinates
        const canvasToEditorRatio = size / editorContainerSize;

        // Scale dimensions and offsets to canvas size
        const canvasWidth = displayedWidth * canvasToEditorRatio;
        const canvasHeight = displayedHeight * canvasToEditorRatio;
        const canvasOffsetX = crop.x * canvasToEditorRatio;
        const canvasOffsetY = crop.y * canvasToEditorRatio;

        // Draw image with crop settings, centered with offsets applied
        ctx.drawImage(
          img,
          size / 2 - canvasWidth / 2 + canvasOffsetX,
          size / 2 - canvasHeight / 2 + canvasOffsetY,
          canvasWidth,
          canvasHeight,
        );

        // Convert canvas to blob
        const blob = await new Promise<Blob>((resolve, reject) => {
          canvas.toBlob(
            (b) => {
              if (b) resolve(b);
              else reject(new Error('Failed to create blob'));
            },
            'image/jpeg',
            0.9,
          );
        });

        // Generate unique filename
        const timestamp = Date.now();
        const filename = `${babyId}/${timestamp}.jpg`;

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('baby-avatars')
          .upload(filename, blob, {
            cacheControl: '3600',
            contentType: 'image/jpeg',
            upsert: false,
          });

        if (uploadError) {
          throw uploadError;
        }

        // Get public URL
        const {
          data: { publicUrl },
        } = supabase.storage.from('baby-avatars').getPublicUrl(uploadData.path);

        // Update baby record with new photo URL
        await updateBaby.mutateAsync({
          id: babyId,
          photoUrl: publicUrl,
        });

        // Invalidate queries to refresh data
        await utils.babies.getById.invalidate({ id: babyId });
        await utils.babies.list.invalidate();

        toast.success('Profile picture updated!', {
          description:
            "Your baby's profile picture has been updated successfully",
        });
      } catch (error) {
        console.error('Error uploading profile picture:', error);
        toast.error('Upload failed', {
          description:
            error instanceof Error
              ? error.message
              : 'Failed to upload profile picture. Please try again.',
        });
      } finally {
        setIsUploading(false);
        setImageDataUrl(null);
      }
    },
    [babyId, imageDataUrl, supabase, updateBaby, utils],
  );

  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Avatar Display */}
      <div className="relative">
        <div className="relative flex items-center justify-center size-32 rounded-full bg-linear-to-br from-primary to-primary/80 p-[3px] shadow-xl shadow-primary/30">
          <div className="size-full rounded-full bg-card flex items-center justify-center p-1">
            <NuggetAvatar
              image={currentPhotoUrl || undefined}
              name={babyName}
              size="xl"
            />
          </div>
        </div>

        {/* Camera Icon Button Overlay */}
        <Button
          className="absolute bottom-0 right-0 size-10 rounded-full shadow-lg"
          disabled={isUploading}
          onClick={handleUploadClick}
          size="icon"
          type="button"
          variant="default"
        >
          {isUploading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Camera className="size-4" />
          )}
        </Button>
      </div>

      {/* Hidden File Input */}
      <input
        accept="image/png,image/jpeg,image/jpg,image/webp"
        className="hidden"
        onChange={handleFileSelect}
        ref={fileInputRef}
        type="file"
      />

      {/* Upload Button (alternative to camera icon) */}
      <Button
        disabled={isUploading}
        onClick={handleUploadClick}
        size="sm"
        type="button"
        variant="outline"
      >
        {isUploading ? (
          <>
            <Loader2 className="size-4 mr-2 animate-spin" />
            Uploading...
          </>
        ) : (
          <>
            <Camera className="size-4 mr-2" />
            Change Photo
          </>
        )}
      </Button>

      {/* Crop Editor Dialog/Drawer */}
      {imageDataUrl && (
        <ImageCropEditor
          imageDataUrl={imageDataUrl}
          onOpenChange={setShowCropEditor}
          onSave={handleCropSave}
          open={showCropEditor}
        />
      )}
    </div>
  );
}
