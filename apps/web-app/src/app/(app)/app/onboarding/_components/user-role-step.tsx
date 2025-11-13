'use client';

import { cn } from '@nugget/ui/lib/utils';
import { Baby, Users } from 'lucide-react';
import type { UserRole } from './types';

interface UserRoleStepProps {
  selectedRole: UserRole | null;
  onSelect: (role: UserRole) => void;
}

export function UserRoleStep({ selectedRole, onSelect }: UserRoleStepProps) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-balance">One More Thing</h1>
        <p className="text-muted-foreground">
          What's your role in this journey?
        </p>
      </div>

      <div className="space-y-3">
        <button
          className={cn(
            'w-full p-6 rounded-3xl border-2 transition-all text-left',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
            selectedRole === 'primary'
              ? 'border-primary bg-primary/10'
              : 'border-border bg-card hover:border-primary/50',
          )}
          onClick={() => onSelect('primary')}
          type="button"
        >
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center flex-shrink-0">
              <Baby className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg">Primary Caregiver</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Mom, birthing parent, or primary caregiver
              </p>
            </div>
          </div>
        </button>

        <button
          className={cn(
            'w-full p-6 rounded-3xl border-2 transition-all text-left',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
            selectedRole === 'partner'
              ? 'border-primary bg-primary/10'
              : 'border-border bg-card hover:border-primary/50',
          )}
          onClick={() => onSelect('partner')}
          type="button"
        >
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-secondary to-secondary/60 flex items-center justify-center flex-shrink-0">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg">
                Partner / Support Person
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Dad, partner, or support person helping with care
              </p>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}
