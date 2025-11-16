'use client';

import { Badge } from '@nugget/ui/badge';
import { Button } from '@nugget/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@nugget/ui/card';
import { H3, H4, P } from '@nugget/ui/custom/typography';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface LearningTip {
  title: string;
  description: string;
}

interface LearningCardCTAProps {
  headline: string;
  subtext?: string | LearningTip[];
  deeplink: string;
  ageLabel?: string;
}

export function LearningCardCTA({
  headline,
  subtext,
  deeplink,
  ageLabel,
}: LearningCardCTAProps) {
  // Handle both legacy string format and new array format
  const tips = subtext && typeof subtext !== 'string' ? subtext : null;
  const legacySubtext = typeof subtext === 'string' ? subtext : null;

  return (
    <Card className="min-w-[280px] h-[440px] snap-start border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 flex flex-col">
      <CardHeader className="pb-3">
        {ageLabel && (
          <div className="mb-2 inline-block w-fit rounded-full bg-primary/20 px-3 py-1">
            <P className="text-xs font-medium text-primary">{ageLabel}</P>
          </div>
        )}
        <H3 className="text-lg">{headline}</H3>
      </CardHeader>
      {subtext && (
        <CardContent className="pb-3 flex-1 overflow-y-auto">
          {legacySubtext === '[AI_PENDING]' || (tips && tips.length === 0) ? (
            <div className="space-y-2">
              <div className="h-3 bg-muted/50 rounded animate-pulse" />
              <div className="h-3 bg-muted/50 rounded animate-pulse w-3/4" />
            </div>
          ) : tips ? (
            <div className="space-y-2">
              {/* Show first tip prominently */}
              <div className="space-y-1">
                <H4 className="text-sm font-semibold text-primary">
                  {tips[0]?.title}
                </H4>
                <P className="text-sm text-muted-foreground">
                  {tips[0]?.description}
                </P>
              </div>
              {/* Show badge if there are more tips */}
              {tips.length > 1 && (
                <Badge className="text-xs" variant="secondary">
                  + {tips.length - 1} more tip{tips.length - 1 > 1 ? 's' : ''}
                </Badge>
              )}
            </div>
          ) : (
            <P className="text-sm text-muted-foreground">{legacySubtext}</P>
          )}
        </CardContent>
      )}
      <CardFooter>
        <Button asChild className="w-full group" size="sm">
          <Link href={deeplink}>
            Learn More
            <ArrowRight className="ml-2 size-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
