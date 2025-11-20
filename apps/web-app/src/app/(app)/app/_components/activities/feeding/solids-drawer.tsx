'use client';

import { Button } from '@nugget/ui/button';
import { Apple, Beef, Carrot, UtensilsCrossed } from 'lucide-react';
import { useState } from 'react';

export function SolidsDrawerContent() {
  const [selectedFoods, setSelectedFoods] = useState<string[]>([]);
  const [selectedAmount, setSelectedAmount] = useState<string | null>(null);
  const [selectedMeal, setSelectedMeal] = useState<string | null>(null);

  const foods = [
    { icon: Apple, id: 'fruits', label: 'Fruits' },
    { icon: Carrot, id: 'vegetables', label: 'Vegetables' },
    { icon: Beef, id: 'protein', label: 'Protein' },
    { icon: UtensilsCrossed, id: 'grains', label: 'Grains' },
  ];

  const toggleFood = (id: string) => {
    setSelectedFoods((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id],
    );
  };

  return (
    <div className="space-y-6">
      {/* Food Categories */}
      <div className="space-y-3">
        <p className="text-sm font-medium text-muted-foreground">Food Type</p>
        <div className="grid grid-cols-2 gap-3">
          {foods.map((food) => {
            const Icon = food.icon;
            const isSelected = selectedFoods.includes(food.id);
            return (
              <Button
                className={`h-16 ${isSelected ? 'border-activity-solids bg-activity-solids/10' : ''}`}
                key={food.id}
                onClick={() => toggleFood(food.id)}
                variant="outline"
              >
                <Icon className="mr-2 h-5 w-5" />
                {food.label}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Amount */}
      <div className="space-y-3">
        <p className="text-sm font-medium text-muted-foreground">
          Amount Eaten
        </p>
        <div className="grid grid-cols-4 gap-2">
          {['None', 'Some', 'Most', 'All'].map((amount) => (
            <Button
              className={`h-12 ${
                selectedAmount === amount
                  ? 'border-activity-solids bg-activity-solids/10'
                  : 'bg-transparent'
              }`}
              key={amount}
              onClick={() => setSelectedAmount(amount)}
              variant="outline"
            >
              {amount}
            </Button>
          ))}
        </div>
      </div>

      {/* Meal Type */}
      <div className="space-y-3">
        <p className="text-sm font-medium text-muted-foreground">Meal</p>
        <div className="grid grid-cols-3 gap-2">
          {['Breakfast', 'Lunch', 'Dinner', 'Snack'].map((meal) => (
            <Button
              className={`h-12 ${
                selectedMeal === meal
                  ? 'border-activity-solids bg-activity-solids/10'
                  : 'bg-transparent'
              }`}
              key={meal}
              onClick={() => setSelectedMeal(meal)}
              variant="outline"
            >
              {meal}
            </Button>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-3">
        <p className="text-sm font-medium text-muted-foreground">
          What did they eat?
        </p>
        <textarea
          className="w-full h-24 p-4 rounded-xl bg-card border border-border resize-none focus:outline-none focus:ring-2 focus:ring-ring"
          placeholder="e.g., mashed sweet potato, banana slices..."
        />
      </div>
    </div>
  );
}
