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
  calculationDetails?: {
    ageBasedInterval: number;
    recentAverageInterval: number | null;
    lastInterval: number | null;
    weights: {
      ageBased: number;
      recentAverage: number;
      lastInterval: number;
    };
    dataPoints: number;
  } | null;
  activityName?: string;
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
  calculationDetails,
  activityName,
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
          >
            {/* Calculation Details Section - Inside the card */}
            {calculationDetails && calculationDetails.dataPoints > 0 && (
              <div className="space-y-3 mt-4 pt-4 border-t border-border/50">
                <p className="text-sm font-medium text-foreground">
                  Your Current Stats
                </p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm bg-muted/20 rounded px-3 py-2">
                    <span className="text-muted-foreground">
                      Age-based baseline
                    </span>
                    <span className="text-foreground/70">
                      {calculationDetails.ageBasedInterval.toFixed(1)}h (
                      {(calculationDetails.weights.ageBased * 100).toFixed(0)}%)
                    </span>
                  </div>
                  {calculationDetails.recentAverageInterval !== null && (
                    <div className="flex items-center justify-between text-sm bg-muted/20 rounded px-3 py-2">
                      <span className="text-muted-foreground">
                        Recent average
                      </span>
                      <span className="text-foreground/70">
                        {calculationDetails.recentAverageInterval.toFixed(1)}h (
                        {(
                          calculationDetails.weights.recentAverage * 100
                        ).toFixed(0)}
                        %)
                      </span>
                    </div>
                  )}
                  {calculationDetails.lastInterval !== null && (
                    <div className="flex items-center justify-between text-sm bg-muted/20 rounded px-3 py-2">
                      <span className="text-muted-foreground">
                        Last interval
                      </span>
                      <span className="text-foreground/70">
                        {calculationDetails.lastInterval.toFixed(1)}h (
                        {(
                          calculationDetails.weights.lastInterval * 100
                        ).toFixed(0)}
                        %)
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-sm bg-primary/10 rounded px-3 py-2 border border-primary/20">
                    <span className="text-foreground font-medium">
                      Predicted interval
                    </span>
                    <span className="text-foreground font-semibold">
                      {(
                        calculationDetails.ageBasedInterval *
                          calculationDetails.weights.ageBased +
                        (calculationDetails.recentAverageInterval ||
                          calculationDetails.ageBasedInterval) *
                          calculationDetails.weights.recentAverage +
                        (calculationDetails.lastInterval ||
                          calculationDetails.ageBasedInterval) *
                          calculationDetails.weights.lastInterval
                      ).toFixed(1)}
                      h
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Based on {calculationDetails.dataPoints} recent{' '}
                    {activityName || 'activity'}
                    {calculationDetails.dataPoints !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            )}
          </LearningSection>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
