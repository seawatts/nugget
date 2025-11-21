'use client';

import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@nugget/ui/components/drawer';
import type { LucideIcon } from 'lucide-react';
import { LearningSection } from '../../../_components/learning/learning-section';

interface QuickLogInfoDrawerProps {
  bgColor: string;
  borderColor: string;
  color: string;
  educationalContent: string;
  icon: LucideIcon;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  tips: string[];
  title: string;
}

export function QuickLogInfoDrawer({
  open,
  onOpenChange,
  title,
  icon,
  color,
  bgColor,
  borderColor,
  educationalContent,
  tips,
}: QuickLogInfoDrawerProps) {
  return (
    <Drawer onOpenChange={onOpenChange} open={open}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader>
          <DrawerTitle>{title}</DrawerTitle>
        </DrawerHeader>
        <div className="px-4 pb-6 space-y-4 overflow-y-auto">
          <LearningSection
            babyAgeDays={null}
            bgColor={bgColor}
            borderColor={borderColor}
            color={color}
            educationalContent={educationalContent}
            icon={icon}
            tips={tips}
            title="How This Works"
          />
        </div>
      </DrawerContent>
    </Drawer>
  );
}
