'use client';

import { Button } from '@nugget/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@nugget/ui/card';
import { H3, P } from '@nugget/ui/custom/typography';
import { Sparkles } from 'lucide-react';
import Link from 'next/link';

interface LearningCardSummaryProps {
  title: string;
  body: string;
  ageLabel?: string;
  onGetAIAdvice?: () => void;
}

export function LearningCardSummary({
  title,
  body,
  ageLabel,
  onGetAIAdvice,
}: LearningCardSummaryProps) {
  return (
    <Card className="min-w-[280px] snap-start border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-indigo-500/10">
      <CardHeader className="pb-3">
        {ageLabel && (
          <div className="mb-2 inline-block w-fit rounded-full bg-blue-500/20 px-3 py-1">
            <P className="text-xs font-medium text-blue-600 dark:text-blue-400">
              {ageLabel}
            </P>
          </div>
        )}
        <H3 className="text-lg">{title}</H3>
      </CardHeader>
      <CardContent className="pb-3">
        {body === '[AI_PENDING]' ? (
          <div className="space-y-2">
            <div className="h-4 bg-muted/50 rounded animate-pulse" />
            <div className="h-4 bg-muted/50 rounded animate-pulse w-5/6" />
            <div className="h-4 bg-muted/50 rounded animate-pulse w-4/6" />
          </div>
        ) : (
          <P className="text-sm text-foreground/80 leading-relaxed">{body}</P>
        )}
      </CardContent>
      <CardFooter className="grid gap-2 grid-cols-2">
        <Button asChild size="sm" variant="outline">
          <Link href="/app/learning">Learn More</Link>
        </Button>
        {onGetAIAdvice && (
          <Button onClick={onGetAIAdvice} size="sm" variant="secondary">
            <Sparkles className="mr-2 size-3" />
            AI Advice
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
