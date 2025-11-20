/**
 * Doctor Visit Orchestrator
 *
 * Generates AI-powered doctor visit prep:
 * - Summary of baby's patterns
 * - Questions to ask the doctor
 * - Flagged concerns based on patterns
 */

import { b } from './baml_client';
import type { DoctorQuestionsOutput } from './baml_client/types';

/**
 * Context required for generating doctor visit questions
 */
export interface DoctorVisitContext {
  // Baby basics
  babyName: string;
  babySex?: string | null;
  ageInDays: number;

  // Date range
  dayCount: number;

  // Feeding statistics
  totalFeedings: number;
  averageFeedingsPerDay: number;
  totalFeedingMl: number;
  averageMlPerFeeding: number;

  // Sleep statistics
  totalSleeps: number;
  totalSleepHours: number;
  averageSleepHoursPerDay: number;
  longestSleepHours: number;

  // Diaper statistics
  totalDiapers: number;
  averageDiapersPerDay: number;
  wetDiapers: number;
  dirtyDiapers: number;
  bothDiapers: number;
}

/**
 * Result from generating doctor visit questions
 */
export interface DoctorVisitResult {
  output: DoctorQuestionsOutput;
  executionTimeMs: number;
}

/**
 * Main orchestrator function for generating doctor visit prep content
 *
 * @param context - Baby activity statistics and context
 * @returns Generated summary, questions, and concerns
 */
export async function generateDoctorQuestions(
  context: DoctorVisitContext,
): Promise<DoctorVisitResult> {
  const startTime = Date.now();

  // Call BAML function to generate questions
  const output = await b.GenerateDoctorQuestions(
    context.babyName,
    context.babySex,
    context.ageInDays,
    context.dayCount,
    context.totalFeedings,
    context.averageFeedingsPerDay,
    context.totalFeedingMl,
    context.averageMlPerFeeding,
    context.totalSleeps,
    context.totalSleepHours,
    context.averageSleepHoursPerDay,
    context.longestSleepHours,
    context.totalDiapers,
    context.averageDiapersPerDay,
    context.wetDiapers,
    context.dirtyDiapers,
    context.bothDiapers,
  );

  const executionTimeMs = Date.now() - startTime;

  return {
    executionTimeMs,
    output,
  };
}

