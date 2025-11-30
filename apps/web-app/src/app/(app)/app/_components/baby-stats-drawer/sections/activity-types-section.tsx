import { Button } from '@nugget/ui/button';
import { Card } from '@nugget/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@nugget/ui/dropdown-menu';
import { format } from 'date-fns';
import { BarChart3, ChevronDown } from 'lucide-react';

interface ActivityTypesSectionProps {
  activityPeriod: 'week' | 'month';
  activityTypeStats: {
    bath: number;
    contrastTime: number;
    doctorVisit: number;
    lastBath: Date | null;
    lastContrastTime: Date | null;
    lastDoctorVisit: Date | null;
    lastNailTrimming: Date | null;
    lastSolids: Date | null;
    lastVitaminD: Date | null;
    lastWalk: Date | null;
    nailTrimming: number;
    periodDays: number;
    pumping: number;
    solids: number;
    vitaminD: number;
    walk: number;
  };
  onPeriodChange: (period: 'week' | 'month') => void;
}

export function ActivityTypesSection({
  activityPeriod,
  activityTypeStats,
  onPeriodChange,
}: ActivityTypesSectionProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="size-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold text-foreground">
            Activity Types (
            {activityPeriod === 'week' ? 'This Week' : 'Last 30 Days'})
          </h3>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="outline">
              {activityPeriod === 'week' ? 'This Week' : 'Last 30 Days'}
              <ChevronDown className="ml-1 size-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onPeriodChange('week')}>
              This Week
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onPeriodChange('month')}>
              Last 30 Days
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {activityTypeStats.bath > 0 && (
          <Card className="p-4">
            <div className="text-xs text-muted-foreground mb-1">Bath</div>
            <div className="text-xl font-bold text-foreground">
              {activityTypeStats.bath}
            </div>
            {activityTypeStats.lastBath && (
              <div className="text-xs text-muted-foreground mt-1">
                {format(activityTypeStats.lastBath, 'MMM d')}
              </div>
            )}
          </Card>
        )}
        {activityTypeStats.vitaminD > 0 && (
          <Card className="p-4">
            <div className="text-xs text-muted-foreground mb-1">Vitamin D</div>
            <div className="text-xl font-bold text-foreground">
              {activityTypeStats.vitaminD}
            </div>
            {activityTypeStats.lastVitaminD && (
              <div className="text-xs text-muted-foreground mt-1">
                {format(activityTypeStats.lastVitaminD, 'MMM d')}
              </div>
            )}
          </Card>
        )}
        {activityTypeStats.nailTrimming > 0 && (
          <Card className="p-4">
            <div className="text-xs text-muted-foreground mb-1">
              Nail Trimming
            </div>
            <div className="text-xl font-bold text-foreground">
              {activityTypeStats.nailTrimming}
            </div>
            {activityTypeStats.lastNailTrimming && (
              <div className="text-xs text-muted-foreground mt-1">
                {format(activityTypeStats.lastNailTrimming, 'MMM d')}
              </div>
            )}
          </Card>
        )}
        {activityTypeStats.solids > 0 && (
          <Card className="p-4">
            <div className="text-xs text-muted-foreground mb-1">Solids</div>
            <div className="text-xl font-bold text-foreground">
              {activityTypeStats.solids}
            </div>
            {activityTypeStats.lastSolids && (
              <div className="text-xs text-muted-foreground mt-1">
                {format(activityTypeStats.lastSolids, 'MMM d')}
              </div>
            )}
          </Card>
        )}
        {activityTypeStats.pumping > 0 && (
          <Card className="p-4">
            <div className="text-xs text-muted-foreground mb-1">Pumping</div>
            <div className="text-xl font-bold text-foreground">
              {activityTypeStats.pumping}
            </div>
          </Card>
        )}
        {activityTypeStats.doctorVisit > 0 && (
          <Card className="p-4">
            <div className="text-xs text-muted-foreground mb-1">
              Doctor Visit
            </div>
            <div className="text-xl font-bold text-foreground">
              {activityTypeStats.doctorVisit}
            </div>
            {activityTypeStats.lastDoctorVisit && (
              <div className="text-xs text-muted-foreground mt-1">
                {format(activityTypeStats.lastDoctorVisit, 'MMM d')}
              </div>
            )}
          </Card>
        )}
        {activityTypeStats.walk > 0 && (
          <Card className="p-4">
            <div className="text-xs text-muted-foreground mb-1">Walk</div>
            <div className="text-xl font-bold text-foreground">
              {activityTypeStats.walk}
            </div>
            {activityTypeStats.lastWalk && (
              <div className="text-xs text-muted-foreground mt-1">
                {format(activityTypeStats.lastWalk, 'MMM d')}
              </div>
            )}
          </Card>
        )}
        {activityTypeStats.contrastTime > 0 && (
          <Card className="p-4">
            <div className="text-xs text-muted-foreground mb-1">
              Contrast Time
            </div>
            <div className="text-xl font-bold text-foreground">
              {activityTypeStats.contrastTime}
            </div>
            {activityTypeStats.lastContrastTime && (
              <div className="text-xs text-muted-foreground mt-1">
                {format(activityTypeStats.lastContrastTime, 'MMM d')}
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}
