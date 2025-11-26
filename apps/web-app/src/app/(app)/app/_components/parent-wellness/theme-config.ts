import type { LucideIcon } from 'lucide-react';
import { Heart } from 'lucide-react';

export interface ParentWellnessTheme {
  color: string;
  textColor: string;
  icon: LucideIcon;
  label: string;
}

export const parentWellnessTheme: ParentWellnessTheme = {
  color: 'bg-gradient-to-br from-pink-500/20 to-purple-500/20',
  icon: Heart,
  label: 'Daily Check-In',
  textColor: 'text-foreground',
};
