'use client';

import { AIGeneratingCard } from '~/components';
import type { GeneratingMessage } from '~/components/ai-generating-card.types';

interface MilestoneCardLoadingProps {
  babyName: string;
  ageInDays: number;
}

/**
 * Milestone-specific loading messages for AI content generation
 */
const milestoneLoadingMessages: GeneratingMessage[] = [
  (name: string, age: number) =>
    `Analyzing ${name}'s development at ${age} ${age === 1 ? 'day' : 'days'}`,
  (name: string) => `Reviewing ${name}'s progress`,
  (name: string) => `Creating personalized milestones for ${name}`,
  (name: string) => `Studying ${name}'s growth patterns`,
  (_name: string, age: number) => `Tailoring suggestions for day ${age}`,
  () => 'Consulting developmental research',
  () => 'Analyzing age-appropriate milestones',
  (name: string) => `Crafting insights for ${name}`,
  () => 'This may take a moment...',
];

/**
 * Loading card for milestone suggestions generation
 * Uses the generic AIGeneratingCard with milestone-specific messages
 */
export function MilestoneCardLoading({
  babyName,
  ageInDays,
}: MilestoneCardLoadingProps) {
  return (
    <AIGeneratingCard
      ageInDays={ageInDays}
      babyName={babyName}
      messages={milestoneLoadingMessages}
      variant="primary"
    />
  );
}
