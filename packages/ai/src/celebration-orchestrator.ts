// Celebration Orchestrator
// Coordinates AI calls for celebration card enhancements

import { b } from './baml_client';
import type {
  CelebrationQuestionsOutput,
  CelebrationStatistics,
  CelebrationSummaryOutput,
} from './baml_client/types';

export interface CelebrationContext {
  babyId: string;
  babyName: string;
  ageInDays: number;
  ageLabel: string;
  celebrationType: string;
  celebrationTitle: string;
  birthDate: string;
  gender?: string;
  currentWeightOz?: number;
  birthWeightOz?: number;
}

export interface CelebrationEnhancementContext extends CelebrationContext {
  statistics: CelebrationStatistics;
  activitySummary?: string;
  achievedMilestones?: string;
  medicalRecords?: string;
  parentWellness?: string;
  recentChatTopics?: string;
}

export interface CelebrationEnhancementResult {
  summary: CelebrationSummaryOutput;
  questions: CelebrationQuestionsOutput;
}

/**
 * Check if AI summary is too repetitive with the title
 */
function isRepetitiveSummary(
  summary: string,
  celebrationTitle: string,
): boolean {
  const summaryLower = summary.toLowerCase();
  const titleLower = celebrationTitle.toLowerCase();

  // Check for exact title repetition
  if (summaryLower.includes(titleLower)) {
    return true;
  }

  // Check for key repetitive phrases
  const repetitivePatterns = [
    /happy.*birthday/i,
    /celebrating.*milestone/i,
    /what a special (day|moment)/i,
    /congratulations/i,
    /\d+\s*(week|month).*old/i,
  ];

  return repetitivePatterns.some((pattern) => pattern.test(summaryLower));
}

/**
 * Generate a fallback summary based on age
 */
function generateFallbackSummary(
  babyName: string,
  ageInDays: number,
): string {
  if (ageInDays <= 14) {
    return `${babyName} is learning to focus on faces and voices. Soon they'll start cooing and making eye contact!`;
  } else if (ageInDays <= 30) {
    return `${babyName}'s alert time is growing each day. Watch for those first social smiles coming very soon!`;
  } else if (ageInDays <= 60) {
    return `${babyName} is developing stronger neck control. Tummy time is getting easier, and rolling is on the horizon!`;
  } else if (ageInDays <= 90) {
    return `${babyName} is reaching for objects and tracking movement. Hand-eye coordination is developing fast!`;
  } else {
    return `${babyName} is hitting new milestones every week. Their personality is really starting to shine through!`;
  }
}

/**
 * Generate celebration summary using AI
 */
export async function generateCelebrationSummary(
  context: CelebrationEnhancementContext,
): Promise<CelebrationSummaryOutput> {
  try {
    const summary = await b.GenerateCelebrationSummary(
      context.babyName,
      context.ageInDays,
      context.celebrationType,
      context.celebrationTitle,
      context.statistics,
      context.achievedMilestones,
      context.activitySummary,
      context.medicalRecords,
    );

    // Validate the AI didn't repeat the title
    if (isRepetitiveSummary(summary.summary, context.celebrationTitle)) {
      console.warn(
        'AI generated repetitive summary, using fallback:',
        summary.summary,
      );
      return {
        summary: generateFallbackSummary(context.babyName, context.ageInDays),
      };
    }

    return summary;
  } catch (error) {
    console.error('Error generating celebration summary:', error);
    // Use developmental fallback instead of generic message
    return {
      summary: generateFallbackSummary(context.babyName, context.ageInDays),
    };
  }
}

/**
 * Generate intelligent contextual questions for celebration
 */
export async function generateCelebrationQuestions(
  context: CelebrationEnhancementContext,
): Promise<CelebrationQuestionsOutput> {
  try {
    const questions = await b.PlanCelebrationQuestions(
      context.babyName,
      context.ageInDays,
      context.ageLabel,
      context.celebrationType,
      context.celebrationTitle,
      context.babyId,
      context.birthDate,
      context.gender,
      context.currentWeightOz,
      context.birthWeightOz,
      context.activitySummary,
      context.achievedMilestones,
      context.medicalRecords,
      context.parentWellness,
      context.recentChatTopics,
    );

    return questions;
  } catch (error) {
    console.error('Error generating celebration questions:', error);
    // Fallback to default questions
    return {
      milestone: {
        question: `Have you noticed ${context.babyName} showing new developmental behaviors?`,
        systemPrompt: `You are a pediatric development expert helping parents track their ${context.ageLabel} baby's milestones. Provide encouraging, evidence-based guidance about developmental expectations.`,
        buttonLabel: 'Track Development',
        icon: '📊',
      },
      memory: {
        question: `What's a special moment you want to remember about ${context.babyName} today?`,
        systemPrompt: `You are a warm, supportive AI helping parents capture precious memories of their baby. Help them reflect on and appreciate the special moments of parenting.`,
        buttonLabel: 'Share Memory',
        icon: '💝',
      },
      guidance: {
        question: `What can I expect as ${context.babyName} grows in the coming weeks?`,
        systemPrompt: `You are a knowledgeable parenting guide providing practical, evidence-based advice about what to expect in the ${context.ageLabel} stage. Provide actionable tips and reassurance.`,
        buttonLabel: 'Get Guidance',
        icon: '🧭',
      },
    };
  }
}

/**
 * Generate both summary and questions in parallel
 */
export async function enhanceCelebration(
  context: CelebrationEnhancementContext,
): Promise<CelebrationEnhancementResult> {
  const [summary, questions] = await Promise.all([
    generateCelebrationSummary(context),
    generateCelebrationQuestions(context),
  ]);

  return {
    summary,
    questions,
  };
}

