'use client';

import { Button } from '@nugget/ui/button';
import { Milk, Minus, Plus } from 'lucide-react';
import { useState } from 'react';

export function BottleDrawerContent() {
  const [amount, setAmount] = useState(4);

  return (
    <div className="space-y-6">
      {/* Amount Selector */}
      <div className="bg-card rounded-2xl p-8">
        <div className="flex items-center justify-center gap-6">
          <Button
            className="h-14 w-14 rounded-full bg-transparent"
            onClick={() => setAmount(Math.max(0, amount - 0.5))}
            size="icon"
            variant="outline"
          >
            <Minus className="h-6 w-6" />
          </Button>
          <div className="text-center">
            <div className="text-6xl font-bold text-foreground">{amount}</div>
            <p className="text-muted-foreground mt-1">oz</p>
          </div>
          <Button
            className="h-14 w-14 rounded-full bg-transparent"
            onClick={() => setAmount(amount + 0.5)}
            size="icon"
            variant="outline"
          >
            <Plus className="h-6 w-6" />
          </Button>
        </div>
      </div>

      {/* Quick Amounts */}
      <div className="space-y-3">
        <p className="text-sm font-medium text-muted-foreground">
          Quick Select
        </p>
        <div className="grid grid-cols-4 gap-2">
          {[2, 4, 6, 8].map((oz) => (
            <Button
              className="h-12 bg-transparent"
              key={oz}
              onClick={() => setAmount(oz)}
              variant="outline"
            >
              {oz} oz
            </Button>
          ))}
        </div>
      </div>

      {/* Bottle Type */}
      <div className="space-y-3">
        <p className="text-sm font-medium text-muted-foreground">Type</p>
        <div className="grid grid-cols-2 gap-3">
          <Button className="h-12 bg-transparent" variant="outline">
            <Milk className="mr-2 h-4 w-4" />
            Breast Milk
          </Button>
          <Button className="h-12 bg-transparent" variant="outline">
            <Milk className="mr-2 h-4 w-4" />
            Formula
          </Button>
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-3">
        <p className="text-sm font-medium text-muted-foreground">
          Notes (optional)
        </p>
        <textarea
          className="w-full h-24 p-4 rounded-xl bg-card border border-border resize-none focus:outline-none focus:ring-2 focus:ring-ring"
          placeholder="Add any notes about this feeding..."
        />
      </div>
    </div>
  );
}
