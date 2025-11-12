'use client';

import { Button } from '@nugget/ui/button';
import { Textarea } from '@nugget/ui/textarea';
import { useState } from 'react';

export function BathDrawer() {
  const [products, setProducts] = useState<string[]>([]);
  const [notes, setNotes] = useState('');

  const productOptions = ['Shampoo', 'Body Wash', 'Lotion', 'Oil', 'Powder'];

  const toggleProduct = (product: string) => {
    setProducts((prev) =>
      prev.includes(product)
        ? prev.filter((p) => p !== product)
        : [...prev, product],
    );
  };

  const handleSave = () => {
    console.log('[v0] Saving bath:', {
      notes,
      products,
      timestamp: new Date(),
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="mb-3 block text-sm font-medium text-muted-foreground">
          Products Used
        </p>
        <div className="grid grid-cols-2 gap-2">
          {productOptions.map((product) => (
            <Button
              className="text-sm"
              key={product}
              onClick={() => toggleProduct(product)}
              variant={products.includes(product) ? 'default' : 'outline'}
            >
              {product}
            </Button>
          ))}
        </div>
      </div>

      <div>
        <label
          className="mb-2 block text-sm font-medium text-muted-foreground"
          htmlFor="bath-notes"
        >
          Notes
        </label>
        <Textarea
          className="min-h-[100px]"
          id="bath-notes"
          onChange={(e) => setNotes(e.target.value)}
          placeholder="How was bath time?"
          value={notes}
        />
      </div>

      <Button className="w-full" onClick={handleSave} size="lg">
        Save Bath
      </Button>
    </div>
  );
}
