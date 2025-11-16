'use client';

import { Badge } from '@nugget/ui/badge';
import { Button } from '@nugget/ui/button';
import { H3, H4, P } from '@nugget/ui/custom/typography';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { FeatureCard } from '~/components/feature-card';

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
    <FeatureCard variant="primary">
      <FeatureCard.Header className="pt-6 px-6">
        {ageLabel && (
          <FeatureCard.Badge className="mb-2">
            <P className="text-xs font-medium text-primary">{ageLabel}</P>
          </FeatureCard.Badge>
        )}
        <H3 className="text-lg">{headline}</H3>
      </FeatureCard.Header>
      {subtext && (
        <FeatureCard.Content className="px-6">
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
        </FeatureCard.Content>
      )}
      <FeatureCard.Footer className="px-6 pb-6">
        <Button asChild className="w-full group" size="sm">
          <Link href={deeplink}>
            Learn More
            <ArrowRight className="ml-2 size-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </Button>
      </FeatureCard.Footer>
    </FeatureCard>
  );
}
