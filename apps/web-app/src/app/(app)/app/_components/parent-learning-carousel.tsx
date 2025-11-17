'use client';

import { Badge } from '@nugget/ui/badge';
import { Button } from '@nugget/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@nugget/ui/card';
import { Icons } from '@nugget/ui/custom/icons';
import { H2 } from '@nugget/ui/custom/typography';
import { AlertCircle, Sparkles } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import {
  getParentLearningContentAction,
  type LearningTip,
} from './parent-learning/actions';

export function ParentLearningCarousel() {
  const [tips, setTips] = useState<LearningTip[]>([]);
  const [_babyName, setBabyName] = useState<string>('');
  const [postpartumDay, setPostpartumDay] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadContent = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await getParentLearningContentAction();
      if (result?.data) {
        // Check for error in response
        if (result.data.error) {
          setError(result.data.error);
          setTips([]);
        } else {
          setTips((result.data.tips || []) as LearningTip[]);
          setBabyName(result.data.babyName || '');
          setPostpartumDay(result.data.postpartumDay || 0);
        }
      }
    } catch (error) {
      console.error('Failed to load parent learning content:', error);
      setError('Unable to load postpartum care tips. Please try again.');
      setTips([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadContent();
  }, [loadContent]);

  if (isLoading) {
    return (
      <div className="mb-6">
        <div className="mb-4 flex items-center gap-2">
          <Sparkles className="size-5 text-primary" />
          <H2 variant="primary">Postpartum Care</H2>
        </div>
        <div className="grid gap-4">
          <div className="bg-card rounded-lg border border-border p-4 animate-pulse">
            <div className="h-4 bg-muted rounded w-3/4 mb-2" />
            <div className="h-3 bg-muted rounded w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mb-6">
        <div className="mb-4 flex items-center gap-2">
          <Sparkles className="size-5 text-primary" />
          <H2 variant="primary">Postpartum Care</H2>
        </div>
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4 text-center">
              <AlertCircle className="size-12 text-destructive" />
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-foreground">
                  Unable to Load Content
                </h3>
                <p className="text-sm text-muted-foreground">{error}</p>
              </div>
              <Button
                className="w-full sm:w-auto"
                onClick={loadContent}
                variant="outline"
              >
                <Icons.Spinner className="size-4 mr-2" />
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (tips.length === 0) {
    return null;
  }

  return (
    <div className="mb-6">
      <div className="mb-4 flex items-center gap-2">
        <Sparkles className="size-5 text-primary" />
        <H2 variant="primary">Postpartum Day {postpartumDay}</H2>
      </div>
      <div className="grid gap-4">
        {tips.map((tip, index) => (
          <Card key={`${tip.category}-${index}`}>
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-lg">
                  {tip.subtitle || tip.summary}
                </CardTitle>
                <Badge variant="secondary">{tip.category}</Badge>
              </div>
              <CardDescription>{tip.summary}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {tip.bulletPoints && tip.bulletPoints.length > 0 && (
                <ul className="space-y-2">
                  {tip.bulletPoints.map((point) => (
                    <li className="flex gap-2 text-sm" key={point}>
                      <span className="text-primary">•</span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              )}
              {tip.followUpQuestion && (
                <div className="pt-2 border-t">
                  <p className="text-sm text-muted-foreground italic">
                    💭 {tip.followUpQuestion}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
