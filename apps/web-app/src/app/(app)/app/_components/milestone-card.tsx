import { Badge } from '@nugget/ui/badge';
import { Button } from '@nugget/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@nugget/ui/card';
import { H3, H4, P } from '@nugget/ui/custom/typography';
import { Check, Sparkles } from 'lucide-react';

interface MilestoneCardProps {
  title: string;
  description: string;
  type: 'physical' | 'cognitive' | 'social' | 'language' | 'self_care';
  ageLabel: string;
  isCompleted?: boolean;
  onMarkComplete: () => void;
}

const typeColors = {
  cognitive: {
    badge:
      'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
    icon: 'text-purple-500',
  },
  language: {
    badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    icon: 'text-blue-500',
  },
  physical: {
    badge: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    icon: 'text-green-500',
  },
  self_care: {
    badge: 'bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300',
    icon: 'text-pink-500',
  },
  social: {
    badge:
      'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
    icon: 'text-orange-500',
  },
};

const typeLabels = {
  cognitive: 'Cognitive',
  language: 'Language',
  physical: 'Physical',
  self_care: 'Self Care',
  social: 'Social',
};

export function MilestoneCard({
  title,
  description,
  type,
  ageLabel,
  isCompleted = false,
  onMarkComplete,
}: MilestoneCardProps) {
  const colors = typeColors[type];

  return (
    <Card className="min-w-[280px] h-[440px] snap-start border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 flex flex-col relative overflow-hidden">
      {/* Completed overlay */}
      {isCompleted && (
        <div className="absolute inset-0 bg-background/60 backdrop-blur-sm z-10 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-flex items-center justify-center size-16 rounded-full bg-green-100 dark:bg-green-900 mb-3">
              <Check className="size-8 text-green-600 dark:text-green-400" />
            </div>
            <H4 className="text-green-700 dark:text-green-300">Completed!</H4>
          </div>
        </div>
      )}

      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2 mb-2">
          <Badge className={colors.badge} variant="secondary">
            {typeLabels[type]}
          </Badge>
          {ageLabel && (
            <div className="inline-block w-fit rounded-full bg-primary/20 px-3 py-1">
              <P className="text-xs font-medium text-primary">{ageLabel}</P>
            </div>
          )}
        </div>
        <H3 className="text-lg leading-tight">{title}</H3>
      </CardHeader>

      <CardContent className="pb-3 flex-1 overflow-y-auto">
        <P className="text-sm text-muted-foreground leading-relaxed">
          {description}
        </P>
      </CardContent>

      <CardFooter className="flex-col gap-2">
        {!isCompleted && (
          <Button
            className="w-full group"
            onClick={onMarkComplete}
            size="sm"
            variant="default"
          >
            <Sparkles className="size-4 mr-2" />
            Learn More & Mark Complete
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
