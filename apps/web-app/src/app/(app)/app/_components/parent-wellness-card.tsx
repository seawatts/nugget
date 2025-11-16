'use client';

import { Button } from '@nugget/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@nugget/ui/card';
import { AlertTriangle, Heart } from 'lucide-react';

interface ParentWellnessCardProps {
  userId: string;
  onStartAssessment?: () => void;
}

export function ParentWellnessCard({
  userId: _userId,
  onStartAssessment,
}: ParentWellnessCardProps) {
  return (
    <Card className="border-primary/20">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Heart className="size-5 text-primary" />
          <CardTitle>Wellness Check-In</CardTitle>
        </div>
        <CardDescription>
          It's time for your regular wellness assessment
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-primary/10 p-3 rounded-lg">
          <p className="text-sm">
            Regular wellness check-ins help us support your mental and emotional
            health during this important time.
          </p>
        </div>

        <Button className="w-full" onClick={onStartAssessment}>
          Start Wellness Assessment
        </Button>

        <div className="flex items-start gap-2 text-xs text-muted-foreground">
          <AlertTriangle className="size-4 shrink-0 mt-0.5" />
          <p>
            This assessment is confidential and helps identify if you might
            benefit from additional support.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
