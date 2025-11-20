'use client';

/**
 * Reusable notes textarea component
 * Used across all activity drawers for consistent styling
 */

interface NotesFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  disabled?: boolean;
}

export function NotesField({
  value,
  onChange,
  placeholder = 'Add any notes...',
  label = 'Notes (optional)',
  disabled = false,
}: NotesFieldProps) {
  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <textarea
        className="w-full h-24 p-4 rounded-xl bg-card border border-border resize-none focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        value={value}
      />
    </div>
  );
}
