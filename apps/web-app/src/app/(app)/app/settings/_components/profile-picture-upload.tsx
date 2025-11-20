'use client';

import { api } from '@nugget/api/react';
import { useClient } from '@nugget/db/supabase/client';
import { Button } from '@nugget/ui/button';
import {
  type ImageCrop,
  ImageCropEditor,
} from '@nugget/ui/custom/image-crop-editor';
import { NuggetAvatar } from '@nugget/ui/custom/nugget-avatar';
import { Camera, Check, Loader2, Trash2 } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';
import { toast } from 'sonner';
import { RemovePhotoDialog } from './remove-photo-dialog';

interface ProfilePictureUploadProps {
  babyId: string;
  babyName: string;
  currentPhotoUrl?: string | null;
  currentBackgroundColor?: string | null;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];

// Predefined background colors for avatar
const AVATAR_COLORS = [
  { bg: '#FBBF24', name: 'Amber', text: '#78350F' },
  { bg: '#FB7185', name: 'Rose', text: '#881337' },
  { bg: '#38BDF8', name: 'Sky', text: '#0C4A6E' },
  { bg: '#34D399', name: 'Emerald', text: '#064E3B' },
  { bg: '#A78BFA', name: 'Violet', text: '#4C1D95' },
  { bg: '#FB923C', name: 'Orange', text: '#7C2D12' },
  { bg: '#F472B6', name: 'Pink', text: '#831843' },
  { bg: '#22D3EE', name: 'Cyan', text: '#164E63' },
];

export function ProfilePictureUpload({
  babyId,
  babyName,
  currentPhotoUrl,
  currentBackgroundColor,
}: ProfilePictureUploadProps) {
  const utils = api.useUtils();
  const supabase = useClient(); // This already handles Clerk authentication
  const updateBaby = api.babies.update.useMutation();

  const [isUploading, setIsUploading] = useState(false);
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [showCropEditor, setShowCropEditor] = useState(false);
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Determine if we're showing the photo or a color
  const isShowingPhoto = !currentBackgroundColor && currentPhotoUrl;
  const selectedColor = currentBackgroundColor
    ? AVATAR_COLORS.find(
        (c) =>
          c.bg === currentBackgroundColor || c.text === currentBackgroundColor,
      )
    : null;

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

  const handleColorSelect = useCallback(
    async (color: { bg: string; text: string }) => {
      try {
        setIsUploading(true);
        await updateBaby.mutateAsync({
          avatarBackgroundColor: color.bg,
          id: babyId,
        });

        await utils.babies.getById.invalidate({ id: babyId });
        await utils.babies.list.invalidate();

        toast.success('Avatar color updated!');
      } catch (error) {
        console.error('Error updating avatar color:', error);
        toast.error('Failed to update color');
      } finally {
        setIsUploading(false);
      }
    },
    [babyId, updateBaby, utils],
  );

  const handlePhotoSelect = useCallback(async () => {
    if (!currentPhotoUrl) {
      // No photo to show, let them upload one
      handleUploadClick();
      return;
    }

    try {
      setIsUploading(true);
      await updateBaby.mutateAsync({
        avatarBackgroundColor: null,
        id: babyId,
      });

      await utils.babies.getById.invalidate({ id: babyId });
      await utils.babies.list.invalidate();

      toast.success('Now showing profile picture!');
    } catch (error) {
      console.error('Error showing photo:', error);
      toast.error('Failed to update avatar');
    } finally {
      setIsUploading(false);
    }
  }, [babyId, currentPhotoUrl, handleUploadClick, updateBaby, utils]);

  const handleRemovePhoto = useCallback(async () => {
    try {
      setIsRemoving(true);
      await updateBaby.mutateAsync({
        avatarBackgroundColor: AVATAR_COLORS[0]?.bg ?? '#FBBF24', // Default to first color
        id: babyId,
        photoUrl: null,
      });

      await utils.babies.getById.invalidate({ id: babyId });
      await utils.babies.list.invalidate();

      toast.success('Profile picture removed!', {
        description: 'You can restore it by selecting the photo option',
      });
      setShowRemoveDialog(false);
    } catch (error) {
      console.error('Error removing photo:', error);
      toast.error('Failed to remove photo');
    } finally {
      setIsRemoving(false);
    }
  }, [babyId, updateBaby, utils]);

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Avatar Display */}
      <div className="relative">
        <div className="relative flex items-center justify-center size-32 rounded-full bg-linear-to-br from-primary to-primary/80 p-[3px] shadow-xl shadow-primary/30">
          <div className="size-full rounded-full bg-card flex items-center justify-center p-1">
            <NuggetAvatar
              backgroundColor={selectedColor?.bg}
              image={isShowingPhoto ? currentPhotoUrl || undefined : undefined}
              name={babyName}
              size="xl"
              textColor={selectedColor?.text}
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

      {/* Color Selection Row */}
      <div className="flex flex-col items-center gap-2 w-full">
        <p className="text-xs text-muted-foreground">Avatar Style</p>
        <div className="flex items-center gap-2 flex-wrap justify-center">
          {/* Photo Option */}
          <button
            className="relative size-12 rounded-full border-2 transition-all hover:scale-110 disabled:opacity-50 disabled:hover:scale-100"
            disabled={isUploading}
            onClick={handlePhotoSelect}
            style={{
              borderColor: isShowingPhoto ? '#FBBF24' : '#E5E7EB',
            }}
            title="Show photo"
            type="button"
          >
            <div className="size-full rounded-full overflow-hidden bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
              {currentPhotoUrl ? (
                <img
                  alt="Baby"
                  className="size-full object-cover"
                  src={currentPhotoUrl}
                />
              ) : (
                <Camera className="size-5 text-gray-500" />
              )}
            </div>
            {isShowingPhoto && (
              <div className="absolute -top-1 -right-1 size-5 rounded-full bg-amber-400 flex items-center justify-center">
                <Check className="size-3 text-amber-900" />
              </div>
            )}
          </button>

          {/* Color Options */}
          {AVATAR_COLORS.map((color) => {
            const isSelected =
              !isShowingPhoto && selectedColor?.bg === color.bg;
            return (
              <button
                className="relative size-12 rounded-full border-2 transition-all hover:scale-110 disabled:opacity-50 disabled:hover:scale-100"
                disabled={isUploading}
                key={color.name}
                onClick={() => handleColorSelect(color)}
                style={{
                  backgroundColor: color.bg,
                  borderColor: isSelected ? '#FBBF24' : 'transparent',
                }}
                title={color.name}
                type="button"
              >
                <div className="size-full rounded-full flex items-center justify-center">
                  <span
                    className="text-lg font-bold"
                    style={{ color: color.text }}
                  >
                    {babyName.charAt(0).toUpperCase()}
                  </span>
                </div>
                {isSelected && (
                  <div className="absolute -top-1 -right-1 size-5 rounded-full bg-amber-400 flex items-center justify-center">
                    <Check className="size-3 text-amber-900" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Hidden File Input */}
      <input
        accept="image/png,image/jpeg,image/jpg,image/webp"
        className="hidden"
        onChange={handleFileSelect}
        ref={fileInputRef}
        type="file"
      />

      {/* Action Buttons */}
      <div className="flex flex-col gap-2 w-full max-w-xs">
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

        {currentPhotoUrl && (
          <Button
            disabled={isUploading || isRemoving}
            onClick={() => setShowRemoveDialog(true)}
            size="sm"
            type="button"
            variant="destructive"
          >
            <Trash2 className="size-4 mr-2" />
            Remove Photo
          </Button>
        )}
      </div>

      {/* Crop Editor Dialog/Drawer */}
      {imageDataUrl && (
        <ImageCropEditor
          imageDataUrl={imageDataUrl}
          onOpenChange={setShowCropEditor}
          onSave={handleCropSave}
          open={showCropEditor}
        />
      )}

      {/* Remove Photo Confirmation Dialog */}
      <RemovePhotoDialog
        babyName={babyName}
        isOpen={showRemoveDialog}
        isPending={isRemoving}
        onClose={() => setShowRemoveDialog(false)}
        onConfirm={handleRemovePhoto}
      />
    </div>
  );
}
