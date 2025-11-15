'use client';

import { useCallback, useRef, useState } from 'react';
import { Button } from '../components/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../components/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '../components/drawer';
import { Label } from '../components/label';
import { Slider } from '../components/slider';
import { useMediaQuery } from '../hooks/use-media-query';

export interface ImageCrop {
  scale: number;
  x: number;
  y: number;
}

interface ImageCropEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageDataUrl: string;
  initialCrop?: ImageCrop;
  onSave: (crop: ImageCrop) => void;
}

const DEFAULT_CROP: ImageCrop = {
  scale: 1,
  x: 0,
  y: 0,
};

function CropEditorContent({
  imageDataUrl,
  initialCrop = DEFAULT_CROP,
  onSave,
  onCancel,
}: Pick<ImageCropEditorProps, 'imageDataUrl' | 'initialCrop' | 'onSave'> & {
  onCancel: () => void;
}) {
  const [crop, setCrop] = useState<ImageCrop>(initialCrop);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Touch gesture state
  const touchStartDistance = useRef<number>(0);
  const touchStartScale = useRef<number>(1);
  const isPinching = useRef<boolean>(false);

  // Mouse/touch drag handlers
  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      // Don't start dragging if we're pinching
      if (isPinching.current) return;

      e.preventDefault();
      setIsDragging(true);
      setDragStart({ x: e.clientX - crop.x, y: e.clientY - crop.y });
    },
    [crop.x, crop.y],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      // Don't drag while pinching
      if (isPinching.current || !isDragging) return;

      e.preventDefault();
      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;

      setCrop((prev) => ({
        ...prev,
        x: newX,
        y: newY,
      }));
    },
    [isDragging, dragStart],
  );

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Touch pinch-to-zoom
  const handleTouchStart = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      if (e.touches.length === 2) {
        isPinching.current = true;
        setIsDragging(false); // Cancel any ongoing drag

        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        if (!touch1 || !touch2) return;

        const distance = Math.hypot(
          touch2.clientX - touch1.clientX,
          touch2.clientY - touch1.clientY,
        );

        touchStartDistance.current = distance;
        touchStartScale.current = crop.scale;
      } else {
        isPinching.current = false;
      }
    },
    [crop.scale],
  );

  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      e.stopPropagation();

      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      if (!touch1 || !touch2) return;

      const distance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY,
      );

      const scale = Math.max(
        0.5,
        Math.min(
          5,
          touchStartScale.current * (distance / touchStartDistance.current),
        ),
      );

      setCrop((prev) => ({
        ...prev,
        scale,
      }));
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    isPinching.current = false;
  }, []);

  const handleScaleChange = useCallback((values: number[]) => {
    setCrop((prev) => ({
      ...prev,
      scale: values[0] ?? prev.scale,
    }));
  }, []);

  const handleReset = useCallback(() => {
    setCrop(DEFAULT_CROP);
  }, []);

  const handleSave = useCallback(() => {
    onSave(crop);
  }, [crop, onSave]);

  return (
    <div className="grid gap-6 py-4">
      <div className="grid gap-4">
        {/* Preview Container */}
        <div
          className="relative mx-auto size-[300px] md:size-[400px] overflow-hidden touch-none"
          ref={containerRef}
        >
          {/* Circular mask overlay */}
          <div className="absolute inset-0 pointer-events-none z-10">
            <svg className="size-full" role="img" viewBox="0 0 300 300">
              <title>Circular crop overlay</title>
              <defs>
                <mask id="circleMask">
                  <rect fill="white" height="300" width="300" />
                  <circle cx="150" cy="150" fill="black" r="150" />
                </mask>
              </defs>
              <rect
                fill="rgba(0,0,0,0.5)"
                height="300"
                mask="url(#circleMask)"
                width="300"
              />
              <circle
                cx="150"
                cy="150"
                fill="none"
                r="150"
                stroke="white"
                strokeWidth="2"
              />
            </svg>
          </div>

          {/* Draggable Image */}
          <div
            className="absolute inset-0 cursor-move"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onTouchEnd={handleTouchEnd}
            onTouchMove={handleTouchMove}
            onTouchStart={handleTouchStart}
          >
            <img
              alt="Crop preview"
              className="absolute top-1/2 left-1/2 select-none"
              draggable={false}
              ref={imageRef}
              src={imageDataUrl}
              style={{
                height: 'auto',
                maxWidth: 'none',
                transform: `translate(calc(-50% + ${crop.x}px), calc(-50% + ${crop.y}px)) scale(${crop.scale})`,
                transformOrigin: 'center',
                width: '100%',
              }}
            />
          </div>
        </div>

        {/* Zoom Slider */}
        <div className="grid gap-2 px-4">
          <Label htmlFor="zoom-slider">
            Zoom: {Math.round(crop.scale * 100)}%
          </Label>
          <Slider
            defaultValue={[crop.scale]}
            id="zoom-slider"
            max={5}
            min={0.5}
            onValueChange={handleScaleChange}
            step={0.1}
            value={[crop.scale]}
          />
        </div>

        <div className="text-xs text-muted-foreground text-center px-4">
          Drag to reposition • Pinch or use slider to zoom
        </div>
      </div>

      <div className="grid gap-2 grid-cols-3 pt-4">
        <Button onClick={handleReset} size="sm" type="button" variant="outline">
          Reset
        </Button>
        <Button onClick={onCancel} size="sm" type="button" variant="outline">
          Cancel
        </Button>
        <Button onClick={handleSave} size="sm" type="button">
          Save
        </Button>
      </div>
    </div>
  );
}

export function ImageCropEditor({
  open,
  onOpenChange,
  imageDataUrl,
  initialCrop,
  onSave,
}: ImageCropEditorProps) {
  const isDesktop = useMediaQuery({ query: '(min-width: 768px)' });

  const handleSave = useCallback(
    (crop: ImageCrop) => {
      onSave(crop);
      onOpenChange(false);
    },
    [onSave, onOpenChange],
  );

  const handleCancel = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  if (isDesktop) {
    return (
      <Dialog onOpenChange={onOpenChange} open={open}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Adjust Image</DialogTitle>
            <DialogDescription>
              Drag to reposition and zoom to fit your image perfectly
            </DialogDescription>
          </DialogHeader>
          <CropEditorContent
            imageDataUrl={imageDataUrl}
            initialCrop={initialCrop}
            onCancel={handleCancel}
            onSave={handleSave}
          />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer
      // dismissible={false}
      handleOnly
      onOpenChange={onOpenChange}
      open={open}
    >
      <DrawerContent>
        <DrawerHeader className="text-left">
          <DrawerTitle>Adjust Image</DrawerTitle>
          <DrawerDescription>
            Drag to reposition and zoom to fit your image perfectly
          </DrawerDescription>
        </DrawerHeader>
        <div className="px-4 pb-4">
          <CropEditorContent
            imageDataUrl={imageDataUrl}
            initialCrop={initialCrop}
            onCancel={handleCancel}
            onSave={handleSave}
          />
        </div>
      </DrawerContent>
    </Drawer>
  );
}
