'use client';

import { Badge } from '@nugget/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@nugget/ui/card';
import { H2 } from '@nugget/ui/custom/typography';
import { Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  getParentLearningContentAction,
  type LearningTip,
} from './parent-learning/actions';

export function ParentLearningCarousel() {
  const [tips, setTips] = useState<LearningTip[]>([]);
  const [_babyName, setBabyName] = useState<string>('');
  const [postpartumDay, setPostpartumDay] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadContent() {
      try {
        setIsLoading(true);
        const result = await getParentLearningContentAction();
        if (result?.data) {
          setTips((result.data.tips || []) as LearningTip[]);
          setBabyName(result.data.babyName || '');
          setPostpartumDay(result.data.postpartumDay || 0);
        }
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to load parent learning content:', error);
        setTips([]);
        setIsLoading(false);
      }
    }

    loadContent();
  }, []);

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
