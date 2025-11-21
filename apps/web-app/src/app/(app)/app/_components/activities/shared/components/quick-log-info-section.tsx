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
}

export function QuickLogInfoSection({
  activityType,
  enabledSettings,
  isQuickLogEnabled,
  color,
  bgColor,
  borderColor,
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
    </InfoCard>
  );
}
