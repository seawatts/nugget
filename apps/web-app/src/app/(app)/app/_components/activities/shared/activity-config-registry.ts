/**
 * Activity configuration registry
 * Central registry for all simple activity configurations
 * Makes it easy to add new activities by just adding a config entry
 */

import { getBathLearningContent } from '../bath/learning-content';
import { getNailTrimmingLearningContent } from '../nail-trimming/learning-content';
import { getVitaminDLearningContent } from '../vitamin-d/learning-content';
import { ACTIVITY_GOALS } from './activity-goals-registry';
import { ACTIVITY_THEMES, type ActivityType } from './activity-theme-config';
import { getContrastTimeLearningContent } from './learning-content/contrast-time-learning-content';
import { getStrollerWalkLearningContent } from './learning-content/stroller-walk-learning-content';
import { getTummyTimeLearningContent } from './learning-content/tummy-time-learning-content';

export interface LearningContent {
  message: string;
  tips: string[];
}

export interface OptionalFieldOption {
  label: string;
  value: string;
}

export interface OptionalField {
  key: string;
  label: string;
  options: OptionalFieldOption[];
}

export interface QuickDurationOption {
  label: string;
  seconds: number;
}

export interface SimpleActivityConfig {
  /** Activity type identifier (must match database enum) */
  type: ActivityType;
  /** Display title */
  title: string;
  /** Theme configuration (colors, icon, etc.) */
  theme: (typeof ACTIVITY_THEMES)[ActivityType];
  /** Goal configuration (weekly goals, progress tracker) */
  goals: (typeof ACTIVITY_GOALS)[string];
  /** Function to get age-appropriate learning content */
  getLearningContent?: (ageDays: number) => LearningContent;
  /** Optional fields for the dialog (e.g., method, location, etc.) */
  optionalFields?: OptionalField[];
  /** Quick duration options for "how long" buttons (in seconds) */
  quickDurationOptions?: QuickDurationOption[];
}

/**
 * Registry of all simple activity configurations
 * To add a new activity, just add an entry here with the required fields
 */
export const SIMPLE_ACTIVITY_CONFIGS: Record<string, SimpleActivityConfig> = {
  bath: {
    getLearningContent: getBathLearningContent,
    goals: ACTIVITY_GOALS.bath!,
    optionalFields: [
      {
        key: 'waterTemp',
        label: 'Water Temperature',
        options: [
          { label: 'Warm', value: 'warm' },
          { label: 'Lukewarm', value: 'lukewarm' },
          { label: 'Cool', value: 'cool' },
        ],
      },
    ],
    quickDurationOptions: [
      { label: '5 min', seconds: 5 * 60 },
      { label: '10 min', seconds: 10 * 60 },
      { label: '15 min', seconds: 15 * 60 },
      { label: '20 min', seconds: 20 * 60 },
    ],
    theme: ACTIVITY_THEMES.bath,
    title: 'Bath',
    type: 'bath',
  },
  contrast_time: {
    getLearningContent: getContrastTimeLearningContent,
    goals: ACTIVITY_GOALS.contrast_time!,
    quickDurationOptions: [
      { label: '5 min', seconds: 5 * 60 },
      { label: '10 min', seconds: 10 * 60 },
      { label: '15 min', seconds: 15 * 60 },
      { label: '20 min', seconds: 20 * 60 },
    ],
    theme: ACTIVITY_THEMES.contrast_time,
    title: 'Contrast Time',
    type: 'contrast_time',
    // No optional fields for now
  },
  nail_trimming: {
    getLearningContent: getNailTrimmingLearningContent,
    goals: ACTIVITY_GOALS.nail_trimming!,
    optionalFields: [
      {
        key: 'location',
        label: 'Location',
        options: [
          { label: 'Hands', value: 'hands' },
          { label: 'Feet', value: 'feet' },
          { label: 'Both', value: 'both' },
        ],
      },
    ],
    theme: ACTIVITY_THEMES.nail_trimming,
    title: 'Nail Trimming',
    type: 'nail_trimming',
  },
  stroller_walk: {
    getLearningContent: getStrollerWalkLearningContent,
    goals: ACTIVITY_GOALS.stroller_walk!,
    quickDurationOptions: [
      { label: '10 min', seconds: 10 * 60 },
      { label: '15 min', seconds: 15 * 60 },
      { label: '30 min', seconds: 30 * 60 },
      { label: '1 hour', seconds: 60 * 60 },
    ],
    theme: ACTIVITY_THEMES.stroller_walk,
    title: 'Stroller Walk',
    type: 'stroller_walk',
    // No optional fields for now, but can be added later (e.g., distance, location)
  },
  tummy_time: {
    getLearningContent: getTummyTimeLearningContent,
    goals: ACTIVITY_GOALS.tummy_time!,
    quickDurationOptions: [
      { label: '1 min', seconds: 1 * 60 },
      { label: '2 min', seconds: 2 * 60 },
      { label: '5 min', seconds: 5 * 60 },
      { label: '10 min', seconds: 10 * 60 },
    ],
    theme: ACTIVITY_THEMES.tummy_time,
    title: 'Tummy Time',
    type: 'tummy_time',
    // No optional fields for now
  },
  vitamin_d: {
    getLearningContent: getVitaminDLearningContent,
    goals: ACTIVITY_GOALS.vitamin_d!,
    optionalFields: [
      {
        key: 'method',
        label: 'Method',
        options: [
          { label: 'Drops', value: 'drops' },
          { label: 'Spray', value: 'spray' },
        ],
      },
    ],
    theme: ACTIVITY_THEMES.vitamin_d,
    title: 'Vitamin D',
    type: 'vitamin_d',
  },
};

/**
 * Get configuration for a simple activity type
 */
export function getSimpleActivityConfig(
  activityType: string,
): SimpleActivityConfig | undefined {
  return SIMPLE_ACTIVITY_CONFIGS[activityType];
}

/**
 * Get all registered simple activity types
 */
export function getSimpleActivityTypes(): string[] {
  return Object.keys(SIMPLE_ACTIVITY_CONFIGS);
}
