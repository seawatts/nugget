import { Button } from '@nugget/ui/button';
import { Zap } from 'lucide-react';
import Link from 'next/link';
import { InfoCard } from '../../../shared/info-card';

interface QuickLogInfoSectionProps {
  activityType: 'feeding' | 'diaper' | 'sleep' | 'pumping';
  enabledSettings: string[];
  isQuickLogEnabled: boolean;
  color: string;
  bgColor: string;
  borderColor: string;
  calculationDetails?: {
    ageBasedInterval: number;
    recentAverageInterval: number | null;
    lastInterval: number | null;
    weights: {
      ageBased: number;
      recentAverage: number;
      lastInterval: number;
    };
    dataPoints: number;
  };
}

export function QuickLogInfoSection({
  activityType,
  enabledSettings,
  isQuickLogEnabled,
  color,
  bgColor,
  borderColor,
  calculationDetails,
}: QuickLogInfoSectionProps) {
  if (!isQuickLogEnabled) {
    return null;
  }

  const activityName =
    activityType.charAt(0).toUpperCase() + activityType.slice(1);

  return (
    <InfoCard
      actions={
        <Button asChild className="w-full" size="sm" variant="outline">
          <Link href="/app/settings/preferences">Edit Settings</Link>
        </Button>
      }
      bgColor={bgColor}
      borderColor={borderColor}
      color={color}
      icon={Zap}
      title="Auto Quick Log"
    >
      <p className="text-sm text-foreground/90">
        The quick log button uses smart defaults to log{' '}
        {activityName.toLowerCase()} activities instantly with one tap, using
        your preferred settings.
      </p>
      {enabledSettings.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground/80">
            Currently enabled:
          </p>
          <ul className="text-sm text-foreground/80 space-y-1.5">
            {enabledSettings.map((setting) => (
              <li className="flex gap-2" key={setting}>
                <span className="text-muted-foreground">•</span>
                <span>{setting}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {enabledSettings.length === 0 && (
        <p className="text-sm text-muted-foreground italic">
          No automatic settings are currently enabled for{' '}
          {activityName.toLowerCase()}.
        </p>
      )}

      {/* Calculation Details - How It Works */}
      {calculationDetails && calculationDetails.dataPoints > 0 && (
        <div className="space-y-3 mt-4 pt-4 border-t border-border/50">
          <p className="text-sm font-medium text-foreground">How It Works</p>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm bg-muted/20 rounded px-3 py-2">
              <span className="text-muted-foreground">Age-based baseline</span>
              <span className="text-foreground/70">
                {calculationDetails.ageBasedInterval.toFixed(1)}h (
                {(calculationDetails.weights.ageBased * 100).toFixed(0)}%)
              </span>
            </div>
            {calculationDetails.recentAverageInterval !== null && (
              <div className="flex items-center justify-between text-sm bg-muted/20 rounded px-3 py-2">
                <span className="text-muted-foreground">Recent average</span>
                <span className="text-foreground/70">
                  {calculationDetails.recentAverageInterval.toFixed(1)}h (
                  {(calculationDetails.weights.recentAverage * 100).toFixed(0)}
                  %)
                </span>
              </div>
            )}
            {calculationDetails.lastInterval !== null && (
              <div className="flex items-center justify-between text-sm bg-muted/20 rounded px-3 py-2">
                <span className="text-muted-foreground">Last interval</span>
                <span className="text-foreground/70">
                  {calculationDetails.lastInterval.toFixed(1)}h (
                  {(calculationDetails.weights.lastInterval * 100).toFixed(0)}%)
                </span>
              </div>
            )}
            <div className="flex items-center justify-between text-sm bg-primary/10 rounded px-3 py-2 border border-primary/20">
              <span className="text-foreground font-medium">
                Predicted interval
              </span>
              <span className="text-foreground font-semibold">
                {(
                  calculationDetails.ageBasedInterval *
                    calculationDetails.weights.ageBased +
                  (calculationDetails.recentAverageInterval ||
                    calculationDetails.ageBasedInterval) *
                    calculationDetails.weights.recentAverage +
                  (calculationDetails.lastInterval ||
                    calculationDetails.ageBasedInterval) *
                    calculationDetails.weights.lastInterval
                ).toFixed(1)}
                h
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Based on {calculationDetails.dataPoints} recent{' '}
              {activityName.toLowerCase()}
              {calculationDetails.dataPoints !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      )}
    </InfoCard>
  );
}
