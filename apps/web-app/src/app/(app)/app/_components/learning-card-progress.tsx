'use client';

import { Button } from '@nugget/ui/button';
import { Card, CardContent, CardFooter } from '@nugget/ui/card';
import { H3, P } from '@nugget/ui/custom/typography';
import { Progress } from '@nugget/ui/progress';
import { useRouter } from 'next/navigation';

interface LearningCardProgressProps {
  label: string;
  current: number;
  total: number;
  deeplink?: string;
  ageLabel?: string;
}

export function LearningCardProgress({
  label,
  current,
  total,
  deeplink,
  ageLabel,
}: LearningCardProgressProps) {
  const router = useRouter();
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;

  const handleClick = () => {
    if (deeplink) {
      router.push(deeplink);
    }
  };

  return (
    <Card className="min-w-[300px] max-w-[300px] snap-start">
      <CardContent className="gap-4 grid p-6">
        {ageLabel && (
          <P className="text-xs text-muted-foreground uppercase tracking-wide">
            {ageLabel}
          </P>
        )}

        <div className="gap-2 grid">
          <H3 className="text-lg">{label}</H3>

          <div className="gap-2 grid">
            <Progress className="h-2" value={percentage} />
            <P className="text-sm text-muted-foreground">
              {current} of {total} completed ({percentage}%)
            </P>
          </div>
        </div>
      </CardContent>

      {deeplink && (
        <CardFooter className="p-6 pt-0">
          <Button
            className="w-full"
            onClick={handleClick}
            size="sm"
            variant="outline"
          >
            Continue
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
