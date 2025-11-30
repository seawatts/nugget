import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@nugget/ui/accordion';
import { Button } from '@nugget/ui/button';
import { Card } from '@nugget/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@nugget/ui/dropdown-menu';
import { BarChart3, ChevronDown } from 'lucide-react';
import { GenericTrendChart } from '../../activities/shared/components/generic-trend-chart';
import {
  FrequencyHeatmap,
  TimeBlockChart,
} from '../../activities/shared/components/stats';
import type {
  FrequencyHeatmapData,
  TimeBlockData,
  TrendData,
} from '../../activities/shared/types';

interface VisualizationsSectionProps {
  activityDistribution: Array<{ type: string; count: number; label: string }>;
  heatmapData: FrequencyHeatmapData[];
  timeBlockData: TimeBlockData[];
  trendData: TrendData[];
  trendTimeRange: '24h' | '7d' | '2w' | '1m' | '3m' | '6m';
  onTrendTimeRangeChange: (
    range: '24h' | '7d' | '2w' | '1m' | '3m' | '6m',
  ) => void;
}

export function VisualizationsSection({
  activityDistribution,
  heatmapData,
  timeBlockData,
  trendData,
  trendTimeRange,
  onTrendTimeRangeChange,
}: VisualizationsSectionProps) {
  return (
    <>
      {/* Visualizations Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <BarChart3 className="size-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold text-foreground">
            Visualizations
          </h3>
        </div>

        {/* Trend Chart */}
        <Accordion collapsible defaultValue="trend" type="single">
          <AccordionItem value="trend">
            <AccordionTrigger>
              <div className="flex items-center justify-between w-full pr-4">
                <div>
                  <h4 className="text-xs font-medium text-foreground">
                    Activity Trend
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Total activities over time
                  </p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-end">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" variant="outline">
                        {trendTimeRange === '24h'
                          ? '24 Hours'
                          : trendTimeRange === '7d'
                            ? '7 Days'
                            : trendTimeRange === '2w'
                              ? '2 Weeks'
                              : trendTimeRange === '1m'
                                ? '1 Month'
                                : trendTimeRange === '3m'
                                  ? '3 Months'
                                  : '6 Months'}
                        <ChevronDown className="ml-1 size-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => onTrendTimeRangeChange('24h')}
                      >
                        24 Hours
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onTrendTimeRangeChange('7d')}
                      >
                        7 Days
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onTrendTimeRangeChange('2w')}
                      >
                        2 Weeks
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onTrendTimeRangeChange('1m')}
                      >
                        1 Month
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onTrendTimeRangeChange('3m')}
                      >
                        3 Months
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onTrendTimeRangeChange('6m')}
                      >
                        6 Months
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <Card className="p-4">
                  <GenericTrendChart
                    data={trendData}
                    timeRange={trendTimeRange}
                  />
                </Card>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      {/* Activity Distribution Section - Collapsible */}
      {activityDistribution.length > 0 && (
        <Accordion collapsible type="single">
          <AccordionItem value="distribution">
            <AccordionTrigger>
              <h4 className="text-xs font-medium text-foreground">
                Activity Distribution (Last 7 Days)
              </h4>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3 pt-2">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {activityDistribution.slice(0, 9).map((item) => (
                    <Card className="p-3" key={item.type}>
                      <div className="text-xs text-muted-foreground mb-1">
                        {item.label}
                      </div>
                      <div className="text-lg font-bold text-foreground">
                        {item.count}
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}

      {/* Frequency Heatmap Section */}
      {heatmapData.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-xs font-medium text-muted-foreground">
            Activity Frequency (Last 30 Days)
          </h4>
          <Card className="p-4">
            <FrequencyHeatmap
              colorVar="var(--activity-feeding)"
              data={heatmapData}
              metric="count"
            />
          </Card>
        </div>
      )}

      {/* Time Block Chart Section - Collapsible */}
      {timeBlockData.length > 0 && (
        <Accordion collapsible type="single">
          <AccordionItem value="timeline">
            <AccordionTrigger>
              <h4 className="text-xs font-medium text-foreground">
                Activity Timeline (Last 7 Days)
              </h4>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3 pt-2">
                <Card className="p-4">
                  <TimeBlockChart
                    colorVar="var(--activity-feeding)"
                    data={timeBlockData}
                  />
                </Card>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}
    </>
  );
}
