'use client';

import { Button } from '@nugget/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@nugget/ui/card';
import { H3, P } from '@nugget/ui/custom/typography';
import { CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

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
    <Card className="min-w-[280px] h-[440px] snap-start border-green-500/20 bg-gradient-to-br from-green-500/5 to-emerald-500/10 flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2 mb-2">
          <CheckCircle2 className="size-5 text-green-600 dark:text-green-400" />
          {ageLabel && (
            <div className="inline-block w-fit rounded-full bg-green-500/20 px-3 py-1">
              <P className="text-xs font-medium text-green-600 dark:text-green-400">
                {ageLabel}
              </P>
            </div>
          )}
        </div>
        <H3 className="text-lg">{title}</H3>
      </CardHeader>
      <CardContent className="pb-3 flex-1 overflow-y-auto">
        <P className="text-sm text-foreground/80 leading-relaxed">{body}</P>
      </CardContent>
      {deeplink && (
        <CardFooter>
          <Button asChild className="w-full" size="sm" variant="outline">
            <Link href={deeplink}>View Details</Link>
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
