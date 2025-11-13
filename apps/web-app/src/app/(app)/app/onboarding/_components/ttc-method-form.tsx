'use client';

import { cn } from '@nugget/ui/lib/utils';
import type { TTCMethod } from './types';

interface TTCMethodFormProps {
  selectedMethod: TTCMethod | null;
  onSelect: (method: TTCMethod) => void;
}

export function TTCMethodForm({
  selectedMethod,
  onSelect,
}: TTCMethodFormProps) {
  return (
    <div className="space-y-3">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-balance">
          Your Conception Journey
        </h1>
        <p className="text-muted-foreground">How are you trying to conceive?</p>
      </div>

      <button
        className={cn(
          'w-full p-5 rounded-2xl border-2 transition-all text-left',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
          selectedMethod === 'natural'
            ? 'border-primary bg-primary/10'
            : 'border-border bg-card hover:border-primary/50',
        )}
        onClick={() => onSelect('natural')}
        type="button"
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">Natural Conception</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Tracking cycles and ovulation
            </p>
          </div>
        </div>
      </button>

      <button
        className={cn(
          'w-full p-5 rounded-2xl border-2 transition-all text-left',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
          selectedMethod === 'ivf'
            ? 'border-primary bg-primary/10'
            : 'border-border bg-card hover:border-primary/50',
        )}
        onClick={() => onSelect('ivf')}
        type="button"
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">IVF / Fertility Treatment</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Assisted reproductive technology
            </p>
          </div>
        </div>
      </button>

      <button
        className={cn(
          'w-full p-5 rounded-2xl border-2 transition-all text-left',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
          selectedMethod === 'other'
            ? 'border-primary bg-primary/10'
            : 'border-border bg-card hover:border-primary/50',
        )}
        onClick={() => onSelect('other')}
        type="button"
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">Other Method</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Adoption, surrogacy, or other
            </p>
          </div>
        </div>
      </button>
    </div>
  );
}
