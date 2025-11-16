import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

interface InfoCardProps {
  icon: LucideIcon;
  title: string;
  babyAgeDays?: number | null;
  color: string;
  bgColor: string;
  borderColor: string;
  children: ReactNode;
  actions?: ReactNode;
}

export function InfoCard({
  icon: Icon,
  title,
  babyAgeDays,
  color,
  bgColor,
  borderColor,
  children,
  actions,
}: InfoCardProps) {
  return (
    <div
      className={`mb-6 rounded-lg border ${borderColor} ${bgColor} overflow-hidden`}
    >
      <div className={`flex items-center gap-3 p-4 ${color}`}>
        <Icon className="size-6" />
        <div>
          <h3 className="font-semibold">{title}</h3>
          {babyAgeDays !== null && babyAgeDays !== undefined && (
            <p className="text-xs text-muted-foreground">
              At {babyAgeDays} {babyAgeDays === 1 ? 'day' : 'days'} old
            </p>
          )}
        </div>
      </div>
      <div className="p-4 space-y-3">
        {children}
        {actions && <div className="pt-2">{actions}</div>}
      </div>
    </div>
  );
}
