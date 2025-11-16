'use client';

import { Button } from '@nugget/ui/button';
import { H3, P } from '@nugget/ui/custom/typography';
import { CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { FeatureCard } from '~/components/feature-card';

interface LearningCardSuccessProps {
  title: string;
  body: string;
  deeplink?: string;
  ageLabel?: string;
}

export function LearningCardSuccess({
  title,
  body,
  deeplink,
  ageLabel,
}: LearningCardSuccessProps) {
  return (
    <FeatureCard variant="success">
      <FeatureCard.Header className="pt-6 px-6">
        <div className="flex items-center gap-2 mb-2">
          <CheckCircle2 className="size-5 text-green-600 dark:text-green-400" />
          {ageLabel && (
            <FeatureCard.Badge
              colorConfig={{
                badge: 'bg-green-500/20',
                border: '',
                card: '',
                text: '',
              }}
              variant="custom"
            >
              <P className="text-xs font-medium text-green-600 dark:text-green-400">
                {ageLabel}
              </P>
            </FeatureCard.Badge>
          )}
        </div>
        <H3 className="text-lg">{title}</H3>
      </FeatureCard.Header>
      <FeatureCard.Content className="px-6">
        <P className="text-sm text-foreground/80 leading-relaxed">{body}</P>
      </FeatureCard.Content>
      {deeplink && (
        <FeatureCard.Footer className="px-6 pb-6">
          <Button asChild className="w-full" size="sm" variant="outline">
            <Link href={deeplink}>View Details</Link>
          </Button>
        </FeatureCard.Footer>
      )}
    </FeatureCard>
  );
}
