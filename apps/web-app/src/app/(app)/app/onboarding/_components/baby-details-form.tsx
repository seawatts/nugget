import { Input } from '@nugget/ui/input';
import { Label } from '@nugget/ui/label';

interface BabyDetailsFormProps {
  babyName: string;
  birthDate: string;
  onBabyNameChange: (name: string) => void;
  onBirthDateChange: (date: string) => void;
}

export function BabyDetailsForm({
  babyName,
  birthDate,
  onBabyNameChange,
  onBirthDateChange,
}: BabyDetailsFormProps) {
  return (
    <div className="p-6 bg-card rounded-3xl border border-border space-y-4">
      <div className="space-y-2">
        <Label htmlFor="babyName">Baby's Name (optional)</Label>
        <Input
          className="text-base"
          id="babyName"
          onChange={(e) => onBabyNameChange(e.target.value)}
          placeholder="Enter baby's name"
          type="text"
          value={babyName}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="birthDate">Birth Date</Label>
        <Input
          className="text-base"
          id="birthDate"
          onChange={(e) => onBirthDateChange(e.target.value)}
          type="date"
          value={birthDate}
        />
        <p className="text-xs text-muted-foreground">
          We'll track age-appropriate milestones and provide personalized tips
        </p>
      </div>
    </div>
  );
}
