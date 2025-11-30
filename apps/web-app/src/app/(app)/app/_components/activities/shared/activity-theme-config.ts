/**
 * Activity theme configuration
 * Centralized colors, icons, and styling for all activity types
 */

import type { LucideIcon } from 'lucide-react';
import {
  Baby,
  Bath,
  Droplet,
  Droplets,
  Eye,
  Footprints,
  Milk,
  Moon,
  Pill,
  Scissors,
  Stethoscope,
  Thermometer,
} from 'lucide-react';

export type ActivityType =
  | 'feeding'
  | 'bottle'
  | 'nursing'
  | 'solids'
  | 'diaper'
  | 'sleep'
  | 'pumping'
  | 'bath'
  | 'medicine'
  | 'temperature'
  | 'tummy_time'
  | 'growth'
  | 'potty'
  | 'doctor_visit'
  | 'vitamin_d'
  | 'nail_trimming'
  | 'walk'
  | 'contrast_time';

// Activity types that support quick logging
export type QuickLogActivityType =
  | 'feeding'
  | 'diaper'
  | 'sleep'
  | 'pumping'
  | 'vitamin_d';

export interface ActivityTheme {
  /** OKLCH color value for the activity */
  color: string;
  /** Text color (usually white or a darker shade) */
  textColor: string;
  /** Lucide icon component */
  icon: LucideIcon;
  /** Display label */
  label: string;
  /** Optional description */
  description?: string;
}

/**
 * Activity theme configurations
 * Using OKLCH color space for better color consistency
 */
export const ACTIVITY_THEMES: Record<ActivityType, ActivityTheme> = {
  bath: {
    color: 'activity-bath',
    description: 'Bath time',
    icon: Bath,
    label: 'Bath',
    textColor: 'text-activity-bath-foreground',
  },
  bottle: {
    color: 'activity-feeding',
    description: 'Breast milk or formula',
    icon: Milk,
    label: 'Bottle',
    textColor: 'text-activity-feeding-foreground',
  },
  contrast_time: {
    color: 'activity-contrast-time',
    description: 'Visual stimulation with contrast cards or books',
    icon: Eye,
    label: 'Contrast Time',
    textColor: 'text-activity-contrast-time-foreground',
  },
  diaper: {
    color: 'activity-diaper',
    description: 'Diaper changes',
    icon: Baby,
    label: 'Diaper',
    textColor: 'text-activity-diaper-foreground',
  },
  doctor_visit: {
    color: 'activity-doctor-visit',
    description: 'Well-baby checkups and doctor visits',
    icon: Stethoscope,
    label: 'Doctor Visit',
    textColor: 'text-activity-doctor-visit-foreground',
  },
  feeding: {
    color: 'activity-feeding',
    description: 'Track all feeding activities',
    icon: Milk,
    label: 'Feeding',
    textColor: 'text-activity-feeding-foreground',
  },
  growth: {
    color: 'activity-growth',
    description: 'Growth measurements',
    icon: Baby,
    label: 'Growth',
    textColor: 'text-activity-growth-foreground',
  },
  medicine: {
    color: 'activity-medicine',
    description: 'Medication',
    icon: Milk,
    label: 'Medicine',
    textColor: 'text-activity-medicine-foreground',
  },
  nail_trimming: {
    color: 'activity-nail-trimming',
    description: 'Nail trimming',
    icon: Scissors,
    label: 'Nail Trimming',
    textColor: 'text-activity-nail-trimming-foreground',
  },
  nursing: {
    color: 'activity-feeding',
    description: 'Breastfeeding session',
    icon: Droplet,
    label: 'Nursing',
    textColor: 'text-activity-feeding-foreground',
  },
  potty: {
    color: 'activity-potty',
    description: 'Potty training',
    icon: Baby,
    label: 'Potty',
    textColor: 'text-activity-potty-foreground',
  },
  pumping: {
    color: 'activity-pumping',
    description: 'Breast milk pumping',
    icon: Droplets,
    label: 'Pumping',
    textColor: 'text-activity-pumping-foreground',
  },
  sleep: {
    color: 'activity-sleep',
    description: 'Naps and night sleep',
    icon: Moon,
    label: 'Sleep',
    textColor: 'text-activity-sleep-foreground',
  },
  solids: {
    color: 'activity-solids',
    description: 'Food and meals',
    icon: Milk,
    label: 'Solids',
    textColor: 'text-activity-solids-foreground',
  },
  temperature: {
    color: 'activity-temperature',
    description: 'Temperature check',
    icon: Thermometer,
    label: 'Temperature',
    textColor: 'text-activity-temperature-foreground',
  },
  tummy_time: {
    color: 'activity-tummy-time',
    description: 'Tummy time',
    icon: Baby,
    label: 'Tummy Time',
    textColor: 'text-activity-tummy-time-foreground',
  },
  vitamin_d: {
    color: 'activity-vitamin-d',
    description: 'Daily vitamin D supplement',
    icon: Pill,
    label: 'Vitamin D',
    textColor: 'text-activity-vitamin-d-foreground',
  },
  walk: {
    color: 'activity-walk',
    description: 'Go for a walk',
    icon: Footprints,
    label: 'Walk',
    textColor: 'text-activity-walk-foreground',
  },
};

/**
 * Get theme for an activity type
 */
export function getActivityTheme(activityType: ActivityType): ActivityTheme {
  return ACTIVITY_THEMES[activityType];
}

/**
 * Get background color class for an activity type
 */
export function getActivityBgClass(activityType: ActivityType): string {
  return `bg-${ACTIVITY_THEMES[activityType].color}`;
}

/**
 * Get text color class for an activity type
 */
export function getActivityTextClass(activityType: ActivityType): string {
  return ACTIVITY_THEMES[activityType].textColor;
}

/**
 * Get hover background color class for an activity type (slightly more opaque)
 */
export function getActivityHoverBgClass(activityType: ActivityType): string {
  return `hover:bg-${ACTIVITY_THEMES[activityType].color}/90`;
}
