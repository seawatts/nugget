# FeatureCard Component

A flexible, composable carousel card component following Shadcn design patterns. This component serves as the base primitive for all carousel cards (learning cards, milestone cards, etc.) while allowing each implementation to maintain its specific features.

## Component Structure

The `FeatureCard` uses a compound component pattern with the following subcomponents:

- `FeatureCard` (Root) - Base card wrapper with height/width constraints
- `FeatureCard.Header` - Header section with icon/badge support
- `FeatureCard.Icon` - Icon slot with color variants
- `FeatureCard.Badge` - Badge/label display (e.g., age labels, type labels)
- `FeatureCard.Content` - Main scrollable content area
- `FeatureCard.Footer` - Footer with button slots
- `FeatureCard.Overlay` - Overlay for states (completed, loading, etc.)

## Variants

### Pre-defined Variants

- `default` - Standard card styling
- `primary` - Primary brand color gradient
- `success` - Green gradient for success states
- `info` - Blue styling for informational cards
- `warning` - Yellow/orange for warnings
- `danger` - Red for errors or critical states
- `custom` - Use with `colorConfig` prop for custom colors

### Custom Colors

Use the `custom` variant with `colorConfig` prop for complete control over colors:

```typescript
const colorConfig: ColorConfig = {
  border: 'border-purple-500/20',
  card: 'bg-purple-500/5',
  icon: 'text-purple-600',
  text: 'text-purple-700',
  badge: 'bg-purple-500/20',
};
```

## Usage Examples

### Basic Card with Primary Variant

```tsx
import { FeatureCard } from '~/components/feature-card';

function MyCard() {
  return (
    <FeatureCard variant="primary">
      <FeatureCard.Header>
        <FeatureCard.Badge>
          <P className="text-xs font-medium">Week 2</P>
        </FeatureCard.Badge>
        <H3>Card Title</H3>
      </FeatureCard.Header>

      <FeatureCard.Content>
        <P>Your card content goes here</P>
      </FeatureCard.Content>

      <FeatureCard.Footer>
        <Button className="w-full">Action</Button>
      </FeatureCard.Footer>
    </FeatureCard>
  );
}
```

### Card with Icon and Custom Colors

```tsx
import { Heart } from 'lucide-react';
import { FeatureCard } from '~/components/feature-card';

function IconCard() {
  const colorConfig = {
    border: 'border-pink-500/20',
    card: 'bg-pink-500/5',
    icon: 'text-pink-600',
    text: 'text-pink-700',
  };

  return (
    <FeatureCard variant="custom" colorConfig={colorConfig}>
      <FeatureCard.Header className="flex items-center gap-3">
        <FeatureCard.Icon icon={Heart} />
        <div>
          <H3>Health Tip</H3>
          <P className="text-xs">Category</P>
        </div>
      </FeatureCard.Header>

      <FeatureCard.Content>
        <P>Content here</P>
      </FeatureCard.Content>
    </FeatureCard>
  );
}
```

### Card with Overlay (Completion State)

```tsx
import { Check } from 'lucide-react';
import { FeatureCard } from '~/components/feature-card';

function CompletableCard({ isCompleted }: { isCompleted: boolean }) {
  return (
    <FeatureCard variant="primary">
      <FeatureCard.Overlay show={isCompleted}>
        <div className="text-center">
          <div className="inline-flex items-center justify-center size-16 rounded-full bg-green-100 dark:bg-green-900 mb-3">
            <Check className="size-8 text-green-600 dark:text-green-400" />
          </div>
          <H4 className="text-green-700 dark:text-green-300">Completed!</H4>
        </div>
      </FeatureCard.Overlay>

      <FeatureCard.Header>
        <H3>Milestone</H3>
      </FeatureCard.Header>

      <FeatureCard.Content>
        <P>Milestone description</P>
      </FeatureCard.Content>

      <FeatureCard.Footer>
        {!isCompleted && (
          <Button onClick={handleComplete}>Mark Complete</Button>
        )}
      </FeatureCard.Footer>
    </FeatureCard>
  );
}
```

### Loading State

```tsx
function LoadingCard() {
  const loadingColorConfig = {
    border: 'border-blue-500/20',
    card: 'bg-blue-500/5',
    icon: 'text-blue-700 dark:text-blue-300',
    text: 'text-blue-700 dark:text-blue-300',
  };

  return (
    <FeatureCard variant="custom" colorConfig={loadingColorConfig}>
      <FeatureCard.Header className="flex items-center gap-3 bg-blue-500/10">
        <div className="size-6 bg-muted/50 rounded animate-pulse shrink-0" />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="h-4 bg-muted/50 rounded animate-pulse w-32" />
          <div className="h-3 bg-muted/50 rounded animate-pulse w-16" />
        </div>
      </FeatureCard.Header>

      <FeatureCard.Content className="space-y-3">
        <div className="h-4 bg-muted/50 rounded animate-pulse" />
        <div className="h-4 bg-muted/50 rounded animate-pulse w-5/6" />
        <div className="h-4 bg-muted/50 rounded animate-pulse w-4/6" />
      </FeatureCard.Content>
    </FeatureCard>
  );
}
```

## Props Reference

### FeatureCard (Root)

```typescript
interface FeatureCardRootProps {
  children: ReactNode;
  variant?: FeatureCardVariant;
  className?: string;
  colorConfig?: ColorConfig;
}
```

### FeatureCard.Header

```typescript
interface FeatureCardHeaderProps {
  children: ReactNode;
  className?: string;
  colorConfig?: ColorConfig;
}
```

### FeatureCard.Icon

```typescript
interface FeatureCardIconProps {
  icon: LucideIcon;
  className?: string;
  colorConfig?: ColorConfig;
}
```

### FeatureCard.Badge

```typescript
interface FeatureCardBadgeProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'secondary' | 'custom';
  colorConfig?: ColorConfig;
}
```

### FeatureCard.Content

```typescript
interface FeatureCardContentProps {
  children: ReactNode;
  className?: string;
  scrollable?: boolean; // default: true
}
```

### FeatureCard.Footer

```typescript
interface FeatureCardFooterProps {
  children: ReactNode;
  className?: string;
  colorConfig?: ColorConfig;
}
```

### FeatureCard.Overlay

```typescript
interface FeatureCardOverlayProps {
  children: ReactNode;
  show?: boolean; // default: true
  className?: string;
}
```

## Design Principles

1. **Composition over Configuration** - Use compound components for maximum flexibility
2. **DRY** - Shared styling, dimensions, and behavior in base component
3. **Extensible** - Easy to add new card variants without modifying base
4. **Type-safe** - Full TypeScript support with proper interfaces
5. **Consistent** - Follows Shadcn UI patterns and codebase conventions

## Standard Dimensions

All FeatureCards use consistent dimensions:
- Width: `min-w-[280px]`
- Height: `h-[440px]`
- Snap alignment: `snap-start` (for carousel usage)

## Migrated Components

The following components have been refactored to use FeatureCard:

- ✅ `LearningCardCTA` - Uses `primary` variant
- ✅ `LearningCardSuccess` - Uses `success` variant
- ✅ `LearningCardInfo` - Uses `custom` variant with category-based colors
- ✅ `MilestoneCard` - Uses `primary` variant with overlay support

