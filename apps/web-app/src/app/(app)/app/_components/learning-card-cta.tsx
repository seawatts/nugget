'use client';

import { Button } from '@nugget/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@nugget/ui/card';
import { H3, P } from '@nugget/ui/custom/typography';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface LearningCardCTAProps {
  headline: string;
  subtext?: string;
  deeplink: string;
  ageLabel?: string;
}

export function LearningCardCTA({
  headline,
  subtext,
  deeplink,
  ageLabel,
}: LearningCardCTAProps) {
  return (
    <Card className="min-w-[280px] snap-start border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
      <CardHeader className="pb-3">
        {ageLabel && (
          <div className="mb-2 inline-block w-fit rounded-full bg-primary/20 px-3 py-1">
            <P className="text-xs font-medium text-primary">{ageLabel}</P>
          </div>
        )}
        <H3 className="text-lg">{headline}</H3>
      </CardHeader>
      {subtext && (
        <CardContent className="pb-3">
          {subtext === '[AI_PENDING]' ? (
            <div className="space-y-2">
              <div className="h-3 bg-muted/50 rounded animate-pulse" />
              <div className="h-3 bg-muted/50 rounded animate-pulse w-3/4" />
            </div>
          ) : (
            <P className="text-sm text-muted-foreground">{subtext}</P>
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
