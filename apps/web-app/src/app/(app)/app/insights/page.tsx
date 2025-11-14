'use client';

import { Badge } from '@nugget/ui/badge';
import { Button } from '@nugget/ui/button';
import { Card } from '@nugget/ui/card';
import {
  AlertCircle,
  ArrowRight,
  Baby,
  CheckCircle2,
  Clock,
  Heart,
  Moon,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';

export default function InsightsPage() {
  return (
    <main className="px-4 pt-6 pb-8">
      {/* Page Title */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground mb-2">Insights</h1>
        <p className="text-muted-foreground">
          Personalized patterns and recommendations for your baby
        </p>
      </div>

      {/* AI Summary Card */}
      <Card className="p-6 mb-6 bg-gradient-to-br from-primary/20 to-accent/20 border-primary/30">
        <div className="flex items-start gap-3 mb-4">
          <div className="p-2 rounded-full bg-primary/20">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-foreground mb-1">
              Today's Summary
            </h2>
            <Badge className="text-xs" variant="secondary">
              AI-Powered
            </Badge>
          </div>
        </div>
        <p className="text-foreground/90 leading-relaxed mb-4">
          Riley had a great day! Sleep patterns are improving with 3 solid naps
          totaling 4.5 hours. Feeding is consistent every 2-3 hours. Consider
          moving bedtime 15 minutes earlier based on recent wake-up times.
        </p>
        <Button className="w-full bg-transparent" size="sm" variant="outline">
          View Detailed Analysis
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </Card>

      {/* Key Insights Grid */}
      <div className="space-y-4 mb-6">
        <h3 className="text-xl font-semibold text-foreground">Key Insights</h3>

        {/* Sleep Quality Insight */}
        <Card className="p-5 border-l-4 border-l-sleep">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-sleep/20">
                <Moon className="h-5 w-5 text-sleep" />
              </div>
              <div>
                <h4 className="font-semibold text-foreground">
                  Sleep Quality Improving
                </h4>
                <p className="text-sm text-muted-foreground">Last 7 days</p>
              </div>
            </div>
            <TrendingUp className="h-5 w-5 text-green-500" />
          </div>
          <p className="text-sm text-foreground/80 mb-3">
            Average sleep duration increased by 45 minutes. Night wakings
            decreased from 3 to 1.5 per night.
          </p>
          <div className="flex gap-2">
            <Badge className="text-xs" variant="secondary">
              +12% better
            </Badge>
            <Badge className="text-xs" variant="outline">
              Consistent bedtime
            </Badge>
          </div>
        </Card>

        {/* Feeding Pattern Insight */}
        <Card className="p-5 border-l-4 border-l-feeding">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-feeding/20">
                <Baby className="h-5 w-5 text-feeding" />
              </div>
              <div>
                <h4 className="font-semibold text-foreground">
                  Feeding Pattern Detected
                </h4>
                <p className="text-sm text-muted-foreground">
                  Consistent schedule
                </p>
              </div>
            </div>
            <CheckCircle2 className="h-5 w-5 text-green-500" />
          </div>
          <p className="text-sm text-foreground/80 mb-3">
            Riley feeds every 2.5-3 hours on average. This is perfectly normal
            for their age. Peak feeding times are 7am, 10am, 1pm, 4pm, and 7pm.
          </p>
          <div className="flex gap-2">
            <Badge className="text-xs" variant="secondary">
              On track
            </Badge>
            <Badge className="text-xs" variant="outline">
              5 feeds/day
            </Badge>
          </div>
        </Card>

        {/* Growth Milestone */}
        <Card className="p-5 border-l-4 border-l-accent">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent/20">
                <Heart className="h-5 w-5 text-accent" />
              </div>
              <div>
                <h4 className="font-semibold text-foreground">
                  Growth Milestone Approaching
                </h4>
                <p className="text-sm text-muted-foreground">
                  4-month checkup due
                </p>
              </div>
            </div>
            <AlertCircle className="h-5 w-5 text-accent" />
          </div>
          <p className="text-sm text-foreground/80 mb-3">
            Riley is approaching the 4-month mark. Expect potential sleep
            regression and increased appetite. Consider scheduling pediatrician
            visit.
          </p>
          <div className="flex gap-2">
            <Badge className="text-xs" variant="secondary">
              In 5 days
            </Badge>
            <Badge className="text-xs" variant="outline">
              Normal development
            </Badge>
          </div>
        </Card>

        {/* Wake Window Optimization */}
        <Card className="p-5 border-l-4 border-l-diaper">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-diaper/20">
                <Clock className="h-5 w-5 text-diaper" />
              </div>
              <div>
                <h4 className="font-semibold text-foreground">
                  Optimal Wake Windows
                </h4>
                <p className="text-sm text-muted-foreground">
                  Timing recommendation
                </p>
              </div>
            </div>
            <TrendingDown className="h-5 w-5 text-orange-500" />
          </div>
          <p className="text-sm text-foreground/80 mb-3">
            Current wake windows are slightly long (2.5 hours). Try reducing to
            2 hours between naps to prevent overtiredness and improve nap
            quality.
          </p>
          <div className="flex gap-2">
            <Badge className="text-xs" variant="secondary">
              Action needed
            </Badge>
            <Badge className="text-xs" variant="outline">
              Easy fix
            </Badge>
          </div>
        </Card>
      </div>

      {/* Recommendations Section */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-foreground">
          Personalized Recommendations
        </h3>

        <Card className="p-5 bg-muted/50">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/20 mt-1">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-foreground mb-2">
                Try a Dream Feed
              </h4>
              <p className="text-sm text-muted-foreground mb-3">
                Based on Riley's sleep patterns, adding a dream feed around
                10-11pm might help extend the first stretch of nighttime sleep.
              </p>
              <Button size="sm" variant="outline">
                Learn More
              </Button>
            </div>
          </div>
        </Card>

        <Card className="p-5 bg-muted/50">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/20 mt-1">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-foreground mb-2">
                Establish a Bedtime Routine
              </h4>
              <p className="text-sm text-muted-foreground mb-3">
                Creating a consistent 20-30 minute bedtime routine can signal to
                Riley that it's time to sleep and improve sleep quality.
              </p>
              <Button size="sm" variant="outline">
                View Routine Ideas
              </Button>
            </div>
          </div>
        </Card>

        <Card className="p-5 bg-muted/50">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/20 mt-1">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-foreground mb-2">
                Track Tummy Time
              </h4>
              <p className="text-sm text-muted-foreground mb-3">
                At Riley's age, aim for 15-20 minutes of tummy time per day to
                support motor development. Spread it across multiple sessions.
              </p>
              <Button size="sm" variant="outline">
                Set Reminder
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </main>
  );
}
