'use client';

import { Button } from '@nugget/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@nugget/ui/card';
import { H3, H4, P } from '@nugget/ui/custom/typography';
import { Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

interface LearningTip {
  title: string;
  description: string;
}

interface LearningCardSummaryProps {
  title: string;
  body: string | LearningTip[];
  ageLabel?: string;
  onGetAIAdvice?: () => void;
}

export function LearningCardSummary({
  title,
  body,
  ageLabel,
  onGetAIAdvice,
}: LearningCardSummaryProps) {
  const [showAll, setShowAll] = useState(false);

  // Handle both legacy string format and new array format
  const tips = typeof body === 'string' ? null : body;
  const legacyBody = typeof body === 'string' ? body : null;

  return (
    <Card className="min-w-[280px] h-[440px] snap-start border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-indigo-500/10 flex flex-col">
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
      <CardContent className="pb-3 flex-1 overflow-y-auto">
        {legacyBody === '[AI_PENDING]' || (tips && tips.length === 0) ? (
          <div className="space-y-2">
            <div className="h-4 bg-muted/50 rounded animate-pulse" />
            <div className="h-4 bg-muted/50 rounded animate-pulse w-5/6" />
            <div className="h-4 bg-muted/50 rounded animate-pulse w-4/6" />
          </div>
        ) : tips ? (
          <div className="space-y-3">
            {tips.slice(0, showAll ? tips.length : 2).map((tip) => (
              <div className="space-y-1" key={tip.title}>
                <H4 className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                  {tip.title}
                </H4>
                <P className="text-sm text-foreground/80 leading-relaxed">
                  {tip.description}
                </P>
              </div>
            ))}
            {tips.length > 2 && !showAll && (
              <Button
                className="text-xs text-blue-600 dark:text-blue-400 p-0 h-auto"
                onClick={() => setShowAll(true)}
                size="sm"
                variant="ghost"
              >
                + {tips.length - 2} more tip{tips.length - 2 > 1 ? 's' : ''}
              </Button>
            )}
          </div>
        ) : (
          <P className="text-sm text-foreground/80 leading-relaxed">
            {legacyBody}
          </P>
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
