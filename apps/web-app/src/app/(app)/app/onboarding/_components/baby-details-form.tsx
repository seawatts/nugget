'use client';

import { Button } from '@nugget/ui/button';
import { DateTimePicker } from '@nugget/ui/custom/date-time-picker';
import { Input } from '@nugget/ui/input';
import { Label } from '@nugget/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@nugget/ui/select';
import { parse } from 'date-fns';
import { Minus, Plus } from 'lucide-react';

interface BabyDetailsFormProps {
  fullName: string;
  birthDate: string;
  birthWeightLbs: string;
  birthWeightOz: string;
  gender: string;
  onFullNameChange: (name: string) => void;
  onBirthDateChange: (date: string) => void;
  onBirthWeightLbsChange: (lbs: string) => void;
  onBirthWeightOzChange: (oz: string) => void;
  onGenderChange: (gender: string) => void;
}

// Helper to parse date string (supports both YYYY-MM-DD and ISO format)
function parseLocalDate(dateString: string): Date | undefined {
  if (!dateString) return undefined;

  // Try parsing as ISO string first (includes time)
  const isoDate = new Date(dateString);
  if (!Number.isNaN(isoDate.getTime())) {
    return isoDate;
  }

  // Fall back to parsing YYYY-MM-DD format
  return parse(dateString, 'yyyy-MM-dd', new Date());
}

export function BabyDetailsForm({
  fullName,
  birthDate,
  birthWeightLbs,
  birthWeightOz,
  gender,
  onFullNameChange,
  onBirthDateChange,
  onBirthWeightLbsChange,
  onBirthWeightOzChange,
  onGenderChange,
}: BabyDetailsFormProps) {
  const selectedDate = parseLocalDate(birthDate);

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      // Store the full date with time as ISO string
      onBirthDateChange(date.toISOString());
    }
  };

  const handleWeightAdjust = (type: 'lbs' | 'oz', adjustment: number) => {
    if (type === 'lbs') {
      const currentLbs = Number.parseInt(birthWeightLbs || '0', 10);
      const newLbs = Math.max(0, currentLbs + adjustment);
      onBirthWeightLbsChange(newLbs.toString());
    } else {
      const currentOz = Number.parseInt(birthWeightOz || '0', 10);
      const newOz = Math.max(0, Math.min(15, currentOz + adjustment));
      onBirthWeightOzChange(newOz.toString());
    }
  };

  const setQuickWeight = (totalOz: number) => {
    const lbs = Math.floor(totalOz / 16);
    const oz = totalOz % 16;
    onBirthWeightLbsChange(lbs.toString());
    onBirthWeightOzChange(oz.toString());
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
        <Label htmlFor="gender">Gender (optional)</Label>
        <Select onValueChange={onGenderChange} value={gender}>
          <SelectTrigger className="w-full" id="gender">
            <SelectValue placeholder="Select gender" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="male">Male</SelectItem>
            <SelectItem value="female">Female</SelectItem>
            <SelectItem value="other">Other</SelectItem>
            <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="birthDate">Birth Date & Time</Label>
        <DateTimePicker
          date={selectedDate}
          placeholder="Pick a date and time"
          setDate={handleDateChange}
        />
        <p className="text-xs text-muted-foreground">
          We'll track age-appropriate milestones and provide personalized tips
        </p>
      </div>

      <div className="space-y-3">
        <Label>Birth Weight (optional)</Label>

        <div className="grid grid-cols-2 gap-3">
          {/* Pounds */}
          <div className="space-y-2">
            <Label
              className="text-xs text-muted-foreground"
              htmlFor="birthWeightLbs"
            >
              Pounds
            </Label>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => handleWeightAdjust('lbs', -1)}
                size="icon"
                type="button"
                variant="outline"
              >
                <Minus className="size-4" />
              </Button>
              <Input
                className="text-center"
                id="birthWeightLbs"
                min="0"
                onChange={(e) => onBirthWeightLbsChange(e.target.value)}
                placeholder="0"
                type="number"
                value={birthWeightLbs}
              />
              <Button
                onClick={() => handleWeightAdjust('lbs', 1)}
                size="icon"
                type="button"
                variant="outline"
              >
                <Plus className="size-4" />
              </Button>
            </div>
          </div>

          {/* Ounces */}
          <div className="space-y-2">
            <Label
              className="text-xs text-muted-foreground"
              htmlFor="birthWeightOz"
            >
              Ounces
            </Label>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => handleWeightAdjust('oz', -1)}
                size="icon"
                type="button"
                variant="outline"
              >
                <Minus className="size-4" />
              </Button>
              <Input
                className="text-center"
                id="birthWeightOz"
                max="15"
                min="0"
                onChange={(e) => onBirthWeightOzChange(e.target.value)}
                placeholder="0"
                type="number"
                value={birthWeightOz}
              />
              <Button
                onClick={() => handleWeightAdjust('oz', 1)}
                size="icon"
                type="button"
                variant="outline"
              >
                <Plus className="size-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Quick Select Buttons */}
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Quick Select</Label>
          <div className="grid grid-cols-4 gap-2">
            <Button
              className="text-xs"
              onClick={() => setQuickWeight(96)}
              size="sm"
              type="button"
              variant="outline"
            >
              6lb 0oz
            </Button>
            <Button
              className="text-xs"
              onClick={() => setQuickWeight(112)}
              size="sm"
              type="button"
              variant="outline"
            >
              7lb 0oz
            </Button>
            <Button
              className="text-xs"
              onClick={() => setQuickWeight(128)}
              size="sm"
              type="button"
              variant="outline"
            >
              8lb 0oz
            </Button>
            <Button
              className="text-xs"
              onClick={() => setQuickWeight(144)}
              size="sm"
              type="button"
              variant="outline"
            >
              9lb 0oz
            </Button>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          Optional: We&apos;ll help you track your baby&apos;s growth
        </p>
      </div>
    </div>
  );
}
