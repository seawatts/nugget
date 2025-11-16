'use client';

import { Card, CardContent } from '@nugget/ui/card';
import { Icons } from '@nugget/ui/custom/icons';
import { Lightbulb } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  getRoleSpecificTipsAction,
  type ParentTip,
} from './parent-tips/actions';

interface ParentTipsWidgetProps {
  userId: string;
  topic?:
    | 'sleep_deprivation'
    | 'postpartum_recovery'
    | 'partner_support'
    | 'mental_health_support'
    | 'feeding_support'
    | 'general';
}

export function ParentTipsWidget({
  userId,
  topic = 'general',
}: ParentTipsWidgetProps) {
  const [tips, setTips] = useState<ParentTip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTipIndex, setCurrentTipIndex] = useState(0);

  useEffect(() => {
    async function loadTips() {
      setIsLoading(true);
      const result = await getRoleSpecificTipsAction({ topic, userId });
      if (result.data) {
        setTips(result.data.tips);
      }
      setIsLoading(false);
    }
    loadTips();
  }, [userId, topic]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <Icons.Spinner className="size-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (tips.length === 0) {
    return null;
  }

  const currentTip = tips[currentTipIndex];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Lightbulb className="size-5 text-primary" />
          <h3 className="font-semibold">Quick Tips</h3>
        </div>
        {tips.length > 1 && (
          <div className="flex gap-1">
            {tips.map((tip, idx) => (
              <button
                className={`size-2 rounded-full transition-colors ${
                  idx === currentTipIndex ? 'bg-primary' : 'bg-muted'
                }`}
                key={tip.title}
                onClick={() => setCurrentTipIndex(idx)}
                type="button"
              />
            ))}
          </div>
        )}
      </div>

      <Card>
        <CardContent className="pt-6 space-y-3">
          <div>
            <h4 className="font-semibold text-lg mb-2">{currentTip?.title}</h4>
            <p className="text-sm text-muted-foreground">
              {currentTip?.content}
            </p>
          </div>

          {currentTip?.actionItems && currentTip.actionItems.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Action Items:</p>
              <ul className="space-y-1">
                {currentTip.actionItems.map((item) => (
                  <li className="text-sm flex items-start gap-2" key={item}>
                    <span className="text-primary">→</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {currentTip?.relevantToRole && (
            <div className="pt-2 border-t">
              <p className="text-xs italic text-muted-foreground">
                {currentTip.relevantToRole}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {tips.length > 1 && (
        <div className="flex gap-2">
          <button
            className="flex-1 py-2 text-sm border rounded-lg hover:bg-accent transition-colors"
            disabled={currentTipIndex === 0}
            onClick={() => setCurrentTipIndex((prev) => Math.max(0, prev - 1))}
            type="button"
          >
            Previous
          </button>
          <button
            className="flex-1 py-2 text-sm border rounded-lg hover:bg-accent transition-colors"
            disabled={currentTipIndex === tips.length - 1}
            onClick={() =>
              setCurrentTipIndex((prev) => Math.min(tips.length - 1, prev + 1))
            }
            type="button"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
