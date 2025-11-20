import type { LucideIcon } from 'lucide-react';
import { Baby, Droplet, Heart, Milk, Moon, TrendingUp } from 'lucide-react';

export type CategoryType =
  | 'feeding'
  | 'sleep'
  | 'diaper'
  | 'development'
  | 'health'
  | 'postpartum';

export interface CategoryConfig {
  icon: LucideIcon;
  color: string;
  bgColor: string;
  borderColor: string;
  label: string;
}

export const CATEGORY_CONFIG: Record<CategoryType, CategoryConfig> = {
  development: {
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/20',
    color: 'text-purple-700 dark:text-purple-300',
    icon: TrendingUp,
    label: 'Development',
  },
  diaper: {
    bgColor: 'bg-cyan-500/10',
    borderColor: 'border-cyan-500/20',
    color: 'text-cyan-700 dark:text-cyan-300',
    icon: Droplet,
    label: 'Diaper',
  },
  feeding: {
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/20',
    color: 'text-orange-700 dark:text-orange-300',
    icon: Milk,
    label: 'Feeding',
  },
  health: {
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/20',
    color: 'text-red-700 dark:text-red-300',
    icon: Heart,
    label: 'Health',
  },
  postpartum: {
    bgColor: 'bg-pink-500/10',
    borderColor: 'border-pink-500/20',
    color: 'text-pink-700 dark:text-pink-300',
    icon: Baby,
    label: 'Postpartum',
  },
  sleep: {
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/20',
    color: 'text-blue-700 dark:text-blue-300',
    icon: Moon,
    label: 'Sleep',
  },
};

/**
 * Get category configuration with fallback to default
 */
export function getCategoryConfig(category: string): CategoryConfig {
  const normalizedCategory = category.toLowerCase() as CategoryType;
  return (
    CATEGORY_CONFIG[normalizedCategory] || CATEGORY_CONFIG.development // default fallback
  );
}
