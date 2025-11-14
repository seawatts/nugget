'use client';

import { Button } from '@nugget/ui/button';
import { Calendar } from '@nugget/ui/calendar';
import { Icons } from '@nugget/ui/custom/icons';
import { Input } from '@nugget/ui/input';
import { Label } from '@nugget/ui/label';
import { cn } from '@nugget/ui/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@nugget/ui/popover';
import { format, parse } from 'date-fns';

interface BabyDetailsFormProps {
  fullName: string;
  birthDate: string;
  onFullNameChange: (name: string) => void;
  onBirthDateChange: (date: string) => void;
}

// Helper to parse YYYY-MM-DD string as local date (not UTC)
function parseLocalDate(dateString: string): Date | undefined {
  if (!dateString) return undefined;
  // Parse the date string as a local date to avoid timezone issues
  return parse(dateString, 'yyyy-MM-dd', new Date());
}

export function BabyDetailsForm({
  fullName,
  birthDate,
  onFullNameChange,
  onBirthDateChange,
}: BabyDetailsFormProps) {
  const selectedDate = parseLocalDate(birthDate);

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      // Format as YYYY-MM-DD for consistency with the existing state management
      const formattedDate = format(date, 'yyyy-MM-dd');
      onBirthDateChange(formattedDate);
    }
  };

  return (
    <div className="p-6 bg-card rounded-3xl border border-border space-y-4">
      <div className="space-y-2">
        <Label htmlFor="fullName">Baby&apos;s Name (optional)</Label>
        <Input
          className="text-base"
          id="fullName"
          onChange={(e) => onFullNameChange(e.target.value)}
          placeholder="e.g., Emma Grace Smith"
          type="text"
          value={fullName}
        />
        <p className="text-xs text-muted-foreground">
          Optional: Enter full name if you&apos;d like. We&apos;ll automatically
          split it into first, middle, and last names.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="birthDate">Birth Date</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              className={cn(
                'w-full justify-start text-left font-normal text-base',
                !birthDate && 'text-muted-foreground',
              )}
              id="birthDate"
              variant="outline"
            >
              <Icons.Calendar size="sm" variant="muted" />
              {birthDate && selectedDate ? (
                format(selectedDate, 'PPP')
              ) : (
                <span>Pick a date</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-auto p-0">
            <Calendar
              captionLayout="dropdown"
              defaultMonth={selectedDate}
              fromYear={new Date().getFullYear() - 2}
              mode="single"
              onSelect={handleDateSelect}
              selected={selectedDate}
              toDate={new Date()}
              toYear={new Date().getFullYear()}
            />
          </PopoverContent>
        </Popover>
        <p className="text-xs text-muted-foreground">
          We'll track age-appropriate milestones and provide personalized tips
        </p>
      </div>
    </div>
  );
}
