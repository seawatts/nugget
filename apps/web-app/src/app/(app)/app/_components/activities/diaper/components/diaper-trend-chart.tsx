'use client';

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@nugget/ui/chart';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts';
import { formatChartDate } from '../../shared/components/stats';
import type { AmountType, TrendData } from '../../shared/types';

type DiaperMetricType = 'total' | 'wet' | 'dirty' | 'both';

interface DiaperTrendChartProps {
  data: TrendData[];
  metricType: DiaperMetricType;
  amountType: AmountType;
}

export function DiaperTrendChart({
  data,
  metricType,
  amountType,
}: DiaperTrendChartProps) {
  const formattedData = data.map((item) => {
    const date = new Date(item.date);
    const displayDate = formatChartDate(date);

    if (metricType === 'total') {
      // Show stacked chart with all types
      const wet = item.wet || 0;
      const dirty = item.dirty || 0;
      const both = item.both || 0;
      const total = wet + dirty + both;

      if (amountType === 'average') {
        // Average per day doesn't make sense for daily data, but we'll keep it for consistency
        return {
          both: both > 0 ? Number((both / 1).toFixed(1)) : 0,
          dirty: dirty > 0 ? Number((dirty / 1).toFixed(1)) : 0,
          displayDate,
          total,
          wet: wet > 0 ? Number((wet / 1).toFixed(1)) : 0,
        };
      }

      return {
        both,
        dirty,
        displayDate,
        total,
        wet,
      };
    }

    // Show single metric
    let value = 0;
    if (metricType === 'wet') {
      value = item.wet || 0;
    } else if (metricType === 'dirty') {
      value = item.dirty || 0;
    } else if (metricType === 'both') {
      value = item.both || 0;
    }

    if (amountType === 'average') {
      value = value > 0 ? Number((value / 1).toFixed(1)) : 0;
    }

    return {
      displayDate,
      value,
    };
  });

  const getChartColor = () => {
    switch (metricType) {
      case 'wet':
        return 'var(--activity-diaper)';
      case 'dirty':
        return 'var(--activity-pumping)';
      case 'both':
        return 'var(--activity-feeding)';
      default:
        return 'var(--activity-diaper)';
    }
  };

  const getLabel = () => {
    if (metricType === 'total') {
      return amountType === 'average' ? 'Avg Changes' : 'Changes';
    }
    const typeLabel =
      metricType === 'wet' ? 'Pee' : metricType === 'dirty' ? 'Poop' : 'Both';
    return amountType === 'average' ? `Avg ${typeLabel}` : typeLabel;
  };

  if (metricType === 'total') {
    // Stacked chart for total view
    return (
      <ChartContainer
        className="h-[200px] w-full"
        config={{
          both: {
            color: 'var(--activity-feeding)',
            label: 'Both',
          },
          dirty: {
            color: 'var(--activity-pumping)',
            label: 'Poop',
          },
          wet: {
            color: 'var(--activity-diaper)',
            label: 'Pee',
          },
        }}
      >
        <ResponsiveContainer height="100%" width="100%">
          <BarChart
            data={formattedData}
            margin={{ bottom: 0, left: 0, right: 0, top: 0 }}
          >
            <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
            <XAxis
              dataKey="displayDate"
              fontSize={12}
              stroke="var(--muted-foreground)"
            />
            <YAxis fontSize={12} stroke="var(--muted-foreground)" width={20} />
            <ChartTooltip
              content={(props) => <ChartTooltipContent {...props} />}
            />
            <Bar
              dataKey="wet"
              fill="var(--activity-diaper)"
              radius={[8, 8, 0, 0]}
              stackId="a"
            />
            <Bar
              dataKey="dirty"
              fill="var(--activity-pumping)"
              radius={[8, 8, 0, 0]}
              stackId="a"
            />
            <Bar
              dataKey="both"
              fill="var(--activity-feeding)"
              radius={[8, 8, 0, 0]}
              stackId="a"
            />
          </BarChart>
        </ResponsiveContainer>
      </ChartContainer>
    );
  }

  // Single metric chart
  return (
    <ChartContainer
      className="h-[200px] w-full"
      config={{
        value: {
          color: getChartColor(),
          label: getLabel(),
        },
      }}
    >
      <ResponsiveContainer height="100%" width="100%">
        <BarChart
          data={formattedData}
          margin={{ bottom: 0, left: 0, right: 0, top: 0 }}
        >
          <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
          <XAxis
            dataKey="displayDate"
            fontSize={12}
            stroke="var(--muted-foreground)"
          />
          <YAxis fontSize={12} stroke="var(--muted-foreground)" width={20} />
          <ChartTooltip
            content={(props) => <ChartTooltipContent {...props} />}
          />
          <Bar dataKey="value" fill={getChartColor()} radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
