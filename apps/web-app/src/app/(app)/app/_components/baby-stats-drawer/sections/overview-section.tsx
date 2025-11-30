import { Card } from '@nugget/ui/card';
import { BarChart3 } from 'lucide-react';
import type { BabyStatsDrawerProps } from '../types';
import { formatAge, formatWeightDisplay } from '../utils';

interface OverviewSectionProps {
  ageDays: number | null;
  estimatedWeightOz: number | null;
  currentWeightOz: number | null;
  birthWeightOz: number | null;
  measurementUnit: BabyStatsDrawerProps['measurementUnit'];
}

export function OverviewSection({
  ageDays,
  estimatedWeightOz,
  currentWeightOz,
  birthWeightOz,
  measurementUnit = 'metric',
}: OverviewSectionProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <BarChart3 className="size-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold text-foreground">Overview</h3>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {ageDays !== null && (
          <Card className="p-4">
            <div className="text-xs text-muted-foreground mb-1">Age</div>
            <div className="text-2xl font-bold text-foreground">
              {formatAge(ageDays)}
            </div>
          </Card>
        )}
        {estimatedWeightOz !== null && (
          <Card className="p-4">
            <div className="text-xs text-muted-foreground mb-1">
              Estimated Weight
            </div>
            <div className="text-2xl font-bold text-foreground">
              {formatWeightDisplay(estimatedWeightOz, measurementUnit)}
            </div>
          </Card>
        )}
        {currentWeightOz && (
          <Card className="p-4">
            <div className="text-xs text-muted-foreground mb-1">
              Current Weight
            </div>
            <div className="text-2xl font-bold text-foreground">
              {formatWeightDisplay(currentWeightOz, measurementUnit)}
            </div>
          </Card>
        )}
        {birthWeightOz && (
          <Card className="p-4">
            <div className="text-xs text-muted-foreground mb-1">
              Birth Weight
            </div>
            <div className="text-2xl font-bold text-foreground">
              {formatWeightDisplay(birthWeightOz, measurementUnit)}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
