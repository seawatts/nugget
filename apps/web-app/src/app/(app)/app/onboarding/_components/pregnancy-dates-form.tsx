import { Input } from '@nugget/ui/input';
import { Label } from '@nugget/ui/label';
import { Calculator } from 'lucide-react';

interface PregnancyDatesFormProps {
  lastPeriodDate: string;
  dueDate: string;
  dueDateManuallySet: boolean;
  onLastPeriodChange: (date: string) => void;
  onDueDateChange: (date: string) => void;
}

export function PregnancyDatesForm({
  lastPeriodDate,
  dueDate,
  dueDateManuallySet,
  onLastPeriodChange,
  onDueDateChange,
}: PregnancyDatesFormProps) {
  return (
    <div className="p-6 bg-card rounded-3xl border border-border space-y-6">
      <div className="space-y-2">
        <Label className="flex items-center gap-2" htmlFor="lastPeriod">
          <Calculator className="h-4 w-4" />
          First Day of Last Period
        </Label>
        <Input
          className="text-base"
          id="lastPeriod"
          onChange={(e) => onLastPeriodChange(e.target.value)}
          type="date"
          value={lastPeriodDate}
        />
        <p className="text-xs text-muted-foreground">
          We'll automatically calculate your due date (40 weeks from this date)
        </p>
      </div>

      {lastPeriodDate && (
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">or</span>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label className="flex items-center gap-2" htmlFor="dueDate">
          Expected Due Date
          {!dueDateManuallySet && dueDate && (
            <span className="text-xs text-primary font-normal">
              (Auto-calculated)
            </span>
          )}
        </Label>
        <Input
          className="text-base"
          id="dueDate"
          onChange={(e) => onDueDateChange(e.target.value)}
          type="date"
          value={dueDate}
        />
        <p className="text-xs text-muted-foreground">
          {dueDateManuallySet
            ? 'You can adjust this date if your doctor provided a different due date'
            : 'Enter your due date directly if you already know it'}
        </p>
      </div>
    </div>
  );
}
