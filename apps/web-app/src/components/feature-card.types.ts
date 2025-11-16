import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

export type FeatureCardVariant =
  | 'default'
  | 'primary'
  | 'success'
  | 'info'
  | 'warning'
  | 'danger'
  | 'custom';

export interface ColorConfig {
  card: string;
  border: string;
  text: string;
  icon?: string;
  badge?: string;
}

export interface FeatureCardRootProps {
  children: ReactNode;
  variant?: FeatureCardVariant;
  className?: string;
  colorConfig?: ColorConfig;
}

export interface FeatureCardHeaderProps {
  children: ReactNode;
  className?: string;
  colorConfig?: ColorConfig;
}

export interface FeatureCardIconProps {
  icon: LucideIcon;
  className?: string;
  colorConfig?: ColorConfig;
}

export interface FeatureCardBadgeProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'secondary' | 'custom';
  colorConfig?: ColorConfig;
}

export interface FeatureCardContentProps {
  children: ReactNode;
  className?: string;
  scrollable?: boolean;
}

export interface FeatureCardFooterProps {
  children: ReactNode;
  className?: string;
  colorConfig?: ColorConfig;
}

export interface FeatureCardOverlayProps {
  children: ReactNode;
  show?: boolean;
  className?: string;
}
