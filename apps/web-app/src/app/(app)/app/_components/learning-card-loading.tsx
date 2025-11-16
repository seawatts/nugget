'use client';

import { AIGeneratingCard } from '~/components';
import type { GeneratingMessage } from '~/components/ai-generating-card.types';

interface LearningCardLoadingProps {
  babyName: string;
  ageInDays: number;
}

/**
 * Learning-specific loading messages for AI content generation
 */
const learningLoadingMessages: GeneratingMessage[] = [
  (name: string, age: number) =>
    `Generating insights for ${name}'s ${age} ${age === 1 ? 'day' : 'days'} old`,
  (name: string) => `Analyzing ${name}'s feeding patterns`,
  (name: string) => `Reviewing ${name}'s sleep data`,
  (name: string) => `Studying ${name}'s development`,
  (name: string) => `Creating personalized tips for ${name}`,
  (_name: string, age: number) => `Tailoring advice for day ${age}`,
  (name: string) => `Learning about ${name}'s routine`,
  () => 'Consulting latest research',
  () => 'Crafting actionable insights',
];

/**
 * Loading card for learning tips generation
 * Uses the generic AIGeneratingCard with learning-specific messages
 */
export function LearningCardLoading({
  babyName,
  ageInDays,
}: LearningCardLoadingProps) {
  return (
    <AIGeneratingCard
      ageInDays={ageInDays}
      babyName={babyName}
      messages={learningLoadingMessages}
      variant="primary"
    />
  );
}
