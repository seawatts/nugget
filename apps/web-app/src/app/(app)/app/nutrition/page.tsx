'use client';

import { Button } from '@nugget/ui/button';
import {
  AlertCircle,
  Apple,
  Baby,
  BookOpen,
  ChefHat,
  ClipboardList,
  FileText,
  Heart,
  Milk,
  Utensils,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

type JourneyStage = 'ttc' | 'pregnant' | 'born';

interface JourneyData {
  birthDate?: string;
  dueDate?: string;
  journeyStage?: JourneyStage;
}

type AllergenTracker = Record<string, boolean>;

interface MilkInventoryItem {
  amount: number;
  date: string;
  id: number;
  location: string;
  type: string;
  unit: string;
}

type ReactionSeverity = 'mild' | 'moderate' | 'severe';

interface FoodReaction {
  date: string;
  food: string;
  id: number;
  reaction: string;
  severity: ReactionSeverity;
}

function getUserJourneyData(): JourneyData | null {
  if (typeof window === 'undefined') return null;
  const data = localStorage.getItem('onboardingData');
  if (!data) return null;
  try {
    return JSON.parse(data) as JourneyData;
  } catch {
    return null;
  }
}

function calculateWeeksPregnant(dueDate: string) {
  const due = new Date(dueDate);
  const today = new Date();
  const diffTime = due.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const weeksPregnant = 40 - Math.floor(diffDays / 7);
  return Math.max(0, Math.min(40, weeksPregnant));
}

function calculateBabyAgeMonths(birthDate: string) {
  const birth = new Date(birthDate);
  const today = new Date();
  const diffMonths =
    (today.getFullYear() - birth.getFullYear()) * 12 +
    (today.getMonth() - birth.getMonth());
  return Math.max(0, diffMonths);
}

export default function NutritionPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [journeyData, setJourneyData] = useState<JourneyData | null>(null);
  const [weeksPregnant, setWeeksPregnant] = useState(0);
  const [babyAgeMonths, setBabyAgeMonths] = useState(0);

  const [milkInventory, setMilkInventory] = useState<MilkInventoryItem[]>([]);
  const [allergenTracker, setAllergenTracker] = useState<AllergenTracker>({});
  const [foodReactions, setFoodReactions] = useState<FoodReaction[]>([]);

  useEffect(() => {
    const data = getUserJourneyData();
    setJourneyData(data);

    if (data?.journeyStage === 'pregnant' && data?.dueDate) {
      setWeeksPregnant(calculateWeeksPregnant(data.dueDate));
    }

    if (data?.journeyStage === 'born' && data?.birthDate) {
      setBabyAgeMonths(calculateBabyAgeMonths(data.birthDate));
    }

    if (typeof window !== 'undefined') {
      const savedInventory = localStorage.getItem('milkInventory');
      if (savedInventory)
        setMilkInventory(JSON.parse(savedInventory) as MilkInventoryItem[]);

      const savedAllergens = localStorage.getItem('allergenTracker');
      if (savedAllergens)
        setAllergenTracker(JSON.parse(savedAllergens) as AllergenTracker);

      const savedReactions = localStorage.getItem('foodReactions');
      if (savedReactions)
        setFoodReactions(JSON.parse(savedReactions) as FoodReaction[]);
    }
  }, []);

  const getTrimester = (weeks: number) => {
    if (weeks <= 13) return 1;
    if (weeks <= 27) return 2;
    return 3;
  };

  const renderTTCContent = () => (
    <div className="space-y-6">
      {/* Fertility Nutrition */}
      <div className="bg-gradient-to-br from-accent/20 to-accent/5 rounded-3xl p-6 border border-accent/20">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-accent/20 flex items-center justify-center">
            <Heart className="h-6 w-6 text-accent" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Fertility Nutrition</h2>
            <p className="text-sm text-muted-foreground">
              Foods to boost conception
            </p>
          </div>
        </div>
        <div className="space-y-3">
          <div className="bg-card rounded-2xl p-4">
            <h3 className="font-semibold mb-2">Foods to Include</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-accent">•</span>
                <span>Leafy greens (folate for egg quality)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent">•</span>
                <span>Fatty fish (omega-3s for hormone production)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent">•</span>
                <span>Whole grains (complex carbs for ovulation)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent">•</span>
                <span>Berries (antioxidants for egg and sperm health)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent">•</span>
                <span>Nuts and seeds (vitamin E and zinc)</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Supplements */}
      <div className="bg-card rounded-3xl p-6 border border-border">
        <h3 className="font-semibold text-lg mb-4">
          Preconception Supplements
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-xl">
            <div>
              <p className="font-medium">Folic Acid</p>
              <p className="text-sm text-muted-foreground">400-800 mcg daily</p>
            </div>
            <span className="text-xs bg-accent/20 text-accent px-3 py-1 rounded-full">
              Essential
            </span>
          </div>
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-xl">
            <div>
              <p className="font-medium">Vitamin D</p>
              <p className="text-sm text-muted-foreground">
                1000-2000 IU daily
              </p>
            </div>
            <span className="text-xs bg-primary/20 text-primary px-3 py-1 rounded-full">
              Important
            </span>
          </div>
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-xl">
            <div>
              <p className="font-medium">Omega-3 (DHA)</p>
              <p className="text-sm text-muted-foreground">200-300 mg daily</p>
            </div>
            <span className="text-xs bg-primary/20 text-primary px-3 py-1 rounded-full">
              Important
            </span>
          </div>
        </div>
      </div>

      {/* Foods to Limit */}
      <div className="bg-card rounded-3xl p-6 border border-border">
        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-destructive" />
          Foods to Limit
        </h3>
        <ul className="space-y-2 text-sm">
          <li className="flex items-start gap-2">
            <span className="text-destructive">•</span>
            <span>Caffeine (limit to 200mg/day)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-destructive">•</span>
            <span>Alcohol (avoid completely when trying to conceive)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-destructive">•</span>
            <span>Trans fats and processed foods</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-destructive">•</span>
            <span>High-mercury fish (swordfish, king mackerel)</span>
          </li>
        </ul>
      </div>
    </div>
  );

  const renderPregnantContent = () => {
    const trimester = getTrimester(weeksPregnant);

    return (
      <div className="space-y-6">
        {/* Current Trimester Overview */}
        <div className="bg-gradient-to-br from-primary/20 to-primary/5 rounded-3xl p-6 border border-primary/20">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center">
              <Apple className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold">
                Trimester {trimester} Nutrition
              </h2>
              <p className="text-sm text-muted-foreground">
                Week {weeksPregnant} of pregnancy
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-card rounded-2xl p-4">
              <p className="text-2xl font-bold text-primary">
                +{trimester === 1 ? '0' : trimester === 2 ? '340' : '450'}
              </p>
              <p className="text-sm text-muted-foreground">
                Extra calories/day
              </p>
            </div>
            <div className="bg-card rounded-2xl p-4">
              <p className="text-2xl font-bold text-primary">
                {trimester === 1 ? '60' : trimester === 2 ? '70' : '85'}g
              </p>
              <p className="text-sm text-muted-foreground">Protein needed</p>
            </div>
          </div>
        </div>

        {/* Trimester-Specific Nutrition */}
        <div className="bg-card rounded-3xl p-6 border border-border">
          <h3 className="font-semibold text-lg mb-4">
            Key Nutrients This Trimester
          </h3>
          <div className="space-y-3">
            {trimester === 1 && (
              <>
                <div className="p-3 bg-muted/50 rounded-xl">
                  <p className="font-medium">Folic Acid</p>
                  <p className="text-sm text-muted-foreground">
                    Critical for neural tube development. 600-800 mcg daily.
                  </p>
                </div>
                <div className="p-3 bg-muted/50 rounded-xl">
                  <p className="font-medium">Vitamin B6</p>
                  <p className="text-sm text-muted-foreground">
                    Helps with morning sickness. Found in bananas, chickpeas.
                  </p>
                </div>
                <div className="p-3 bg-muted/50 rounded-xl">
                  <p className="font-medium">Ginger</p>
                  <p className="text-sm text-muted-foreground">
                    Natural remedy for nausea. Try ginger tea or candied ginger.
                  </p>
                </div>
              </>
            )}
            {trimester === 2 && (
              <>
                <div className="p-3 bg-muted/50 rounded-xl">
                  <p className="font-medium">Calcium</p>
                  <p className="text-sm text-muted-foreground">
                    For baby's bone development. 1000mg daily from dairy, leafy
                    greens.
                  </p>
                </div>
                <div className="p-3 bg-muted/50 rounded-xl">
                  <p className="font-medium">Iron</p>
                  <p className="text-sm text-muted-foreground">
                    Prevents anemia. 27mg daily from lean meat, beans, fortified
                    cereals.
                  </p>
                </div>
                <div className="p-3 bg-muted/50 rounded-xl">
                  <p className="font-medium">DHA (Omega-3)</p>
                  <p className="text-sm text-muted-foreground">
                    For brain development. 200-300mg from fatty fish or
                    supplements.
                  </p>
                </div>
              </>
            )}
            {trimester === 3 && (
              <>
                <div className="p-3 bg-muted/50 rounded-xl">
                  <p className="font-medium">Fiber</p>
                  <p className="text-sm text-muted-foreground">
                    Prevents constipation. 25-30g daily from whole grains,
                    fruits, veggies.
                  </p>
                </div>
                <div className="p-3 bg-muted/50 rounded-xl">
                  <p className="font-medium">Vitamin K</p>
                  <p className="text-sm text-muted-foreground">
                    For blood clotting. Found in leafy greens, broccoli.
                  </p>
                </div>
                <div className="p-3 bg-muted/50 rounded-xl">
                  <p className="font-medium">Protein</p>
                  <p className="text-sm text-muted-foreground">
                    For rapid baby growth. 85g daily from lean meats, eggs,
                    legumes.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Foods to Avoid */}
        <div className="bg-card rounded-3xl p-6 border border-border">
          <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            Foods to Avoid During Pregnancy
          </h3>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-destructive">•</span>
              <span>Raw or undercooked meat, eggs, and seafood</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-destructive">•</span>
              <span>High-mercury fish (tuna, swordfish, shark)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-destructive">•</span>
              <span>Unpasteurized dairy and soft cheeses</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-destructive">•</span>
              <span>Deli meats and hot dogs (unless heated)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-destructive">•</span>
              <span>Alcohol and limit caffeine to 200mg/day</span>
            </li>
          </ul>
        </div>

        {/* Meal Ideas */}
        <div className="bg-card rounded-3xl p-6 border border-border">
          <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <ChefHat className="h-5 w-5 text-secondary" />
            Meal Ideas for Trimester {trimester}
          </h3>
          <div className="space-y-3">
            {trimester === 1 && (
              <>
                <div className="p-3 bg-secondary/10 rounded-xl">
                  <p className="font-medium">Breakfast: Ginger smoothie</p>
                  <p className="text-sm text-muted-foreground">
                    Banana, ginger, yogurt, honey - helps with nausea
                  </p>
                </div>
                <div className="p-3 bg-secondary/10 rounded-xl">
                  <p className="font-medium">Snack: Crackers with cheese</p>
                  <p className="text-sm text-muted-foreground">
                    Easy on the stomach, provides protein
                  </p>
                </div>
              </>
            )}
            {trimester === 2 && (
              <>
                <div className="p-3 bg-secondary/10 rounded-xl">
                  <p className="font-medium">Lunch: Salmon with quinoa</p>
                  <p className="text-sm text-muted-foreground">
                    Rich in DHA and protein for baby's brain
                  </p>
                </div>
                <div className="p-3 bg-secondary/10 rounded-xl">
                  <p className="font-medium">
                    Snack: Greek yogurt with berries
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Calcium and antioxidants
                  </p>
                </div>
              </>
            )}
            {trimester === 3 && (
              <>
                <div className="p-3 bg-secondary/10 rounded-xl">
                  <p className="font-medium">
                    Dinner: Chicken with sweet potato
                  </p>
                  <p className="text-sm text-muted-foreground">
                    High protein and fiber to keep you full
                  </p>
                </div>
                <div className="p-3 bg-secondary/10 rounded-xl">
                  <p className="font-medium">Snack: Dates with almond butter</p>
                  <p className="text-sm text-muted-foreground">
                    Natural energy and may help with labor
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderBabyContent = () => {
    return (
      <div className="space-y-6">
        {/* Age-Appropriate Feeding */}
        <div className="bg-gradient-to-br from-feeding/20 to-feeding/5 rounded-3xl p-6 border border-feeding/20">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-feeding/20 flex items-center justify-center">
              <Baby className="h-6 w-6 text-feeding" />
            </div>
            <div>
              <h2 className="text-xl font-bold">
                Feeding at {babyAgeMonths} Months
              </h2>
              <p className="text-sm text-muted-foreground">
                Age-appropriate nutrition guide
              </p>
            </div>
          </div>

          {babyAgeMonths < 6 && (
            <div className="bg-card rounded-2xl p-4">
              <h3 className="font-semibold mb-2">Exclusive Milk Feeding</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Breast milk or formula only until 6 months
              </p>
              <div className="space-y-2 text-sm">
                <p>• Breastfeed on demand (8-12 times per day)</p>
                <p>• Formula: 24-32 oz per day</p>
                <p>• No water, juice, or solid foods yet</p>
              </div>
            </div>
          )}

          {babyAgeMonths >= 6 && babyAgeMonths < 12 && (
            <div className="space-y-3">
              <div className="bg-card rounded-2xl p-4">
                <h3 className="font-semibold mb-2">
                  Starting Solids (6-12 months)
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Introduce one new food every 3-5 days
                </p>
                <div className="space-y-2 text-sm">
                  <p>• Continue breast milk or formula (24-32 oz)</p>
                  <p>• Start with iron-fortified cereals</p>
                  <p>• Pureed fruits and vegetables</p>
                  <p>• Introduce common allergens early</p>
                </div>
              </div>
            </div>
          )}

          {babyAgeMonths >= 12 && (
            <div className="bg-card rounded-2xl p-4">
              <h3 className="font-semibold mb-2">
                Toddler Nutrition (12+ months)
              </h3>
              <p className="text-sm text-muted-foreground mb-3">
                Transition to family foods
              </p>
              <div className="space-y-2 text-sm">
                <p>• Whole milk (16-24 oz per day)</p>
                <p>• 3 meals + 2-3 snacks daily</p>
                <p>• Variety of textures and flavors</p>
                <p>• Self-feeding encouraged</p>
              </div>
            </div>
          )}
        </div>

        {/* Allergen Introduction */}
        {babyAgeMonths >= 4 && babyAgeMonths < 12 && (
          <div className="bg-card rounded-3xl p-6 border border-border">
            <h3 className="font-semibold text-lg mb-4">
              Allergen Introduction Schedule
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Introduce common allergens early (4-6 months) to reduce allergy
              risk
            </p>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-xl">
                <span className="text-sm">Peanut butter (thinned)</span>
                <span className="text-xs bg-primary/20 text-primary px-3 py-1 rounded-full">
                  Start early
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-xl">
                <span className="text-sm">Eggs (cooked)</span>
                <span className="text-xs bg-primary/20 text-primary px-3 py-1 rounded-full">
                  Start early
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-xl">
                <span className="text-sm">Dairy (yogurt, cheese)</span>
                <span className="text-xs bg-primary/20 text-primary px-3 py-1 rounded-full">
                  6+ months
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-xl">
                <span className="text-sm">Fish (well-cooked)</span>
                <span className="text-xs bg-primary/20 text-primary px-3 py-1 rounded-full">
                  6+ months
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Sample Meal Plan */}
        {babyAgeMonths >= 6 && (
          <div className="bg-card rounded-3xl p-6 border border-border">
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <Utensils className="h-5 w-5 text-solids" />
              Sample Daily Menu
            </h3>
            <div className="space-y-3">
              <div className="p-3 bg-solids/10 rounded-xl">
                <p className="font-medium">Breakfast</p>
                <p className="text-sm text-muted-foreground">
                  {babyAgeMonths < 8
                    ? 'Oatmeal cereal with mashed banana'
                    : 'Scrambled eggs with toast fingers'}
                </p>
              </div>
              <div className="p-3 bg-solids/10 rounded-xl">
                <p className="font-medium">Lunch</p>
                <p className="text-sm text-muted-foreground">
                  {babyAgeMonths < 8
                    ? 'Pureed sweet potato and chicken'
                    : 'Soft pasta with vegetables and cheese'}
                </p>
              </div>
              <div className="p-3 bg-solids/10 rounded-xl">
                <p className="font-medium">Dinner</p>
                <p className="text-sm text-muted-foreground">
                  {babyAgeMonths < 8
                    ? 'Pureed peas and rice cereal'
                    : 'Soft meatballs with mashed potatoes'}
                </p>
              </div>
              <div className="p-3 bg-solids/10 rounded-xl">
                <p className="font-medium">Snacks</p>
                <p className="text-sm text-muted-foreground">
                  {babyAgeMonths < 8
                    ? 'Pureed fruits'
                    : 'Cheese cubes, soft fruit pieces, yogurt'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Breastfeeding Nutrition for Mom */}
        {babyAgeMonths < 12 && (
          <div className="bg-card rounded-3xl p-6 border border-border">
            <h3 className="font-semibold text-lg mb-4">
              Nutrition for Breastfeeding Moms
            </h3>
            <div className="space-y-3">
              <div className="p-3 bg-muted/50 rounded-xl">
                <p className="font-medium">Extra Calories</p>
                <p className="text-sm text-muted-foreground">
                  Add 450-500 calories per day while breastfeeding
                </p>
              </div>
              <div className="p-3 bg-muted/50 rounded-xl">
                <p className="font-medium">Hydration</p>
                <p className="text-sm text-muted-foreground">
                  Drink 8-10 glasses of water daily
                </p>
              </div>
              <div className="p-3 bg-muted/50 rounded-xl">
                <p className="font-medium">Key Nutrients</p>
                <p className="text-sm text-muted-foreground">
                  Continue prenatal vitamins, focus on protein and calcium
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Foods to Avoid */}
        <div className="bg-card rounded-3xl p-6 border border-border">
          <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            Foods to Avoid (Under 12 Months)
          </h3>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-destructive">•</span>
              <span>Honey (risk of botulism)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-destructive">•</span>
              <span>Cow's milk as main drink (until 12 months)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-destructive">•</span>
              <span>Choking hazards (whole grapes, nuts, popcorn)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-destructive">•</span>
              <span>Added salt and sugar</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-destructive">•</span>
              <span>High-mercury fish</span>
            </li>
          </ul>
        </div>
      </div>
    );
  };

  const renderRecipesTab = () => {
    const recipes = [
      {
        age: '6-8 months',
        ingredients: ['1 sweet potato', 'Water or breast milk'],
        instructions:
          'Steam sweet potato until soft, blend with liquid to desired consistency',
        nutrition: 'Rich in vitamin A and fiber',
        title: 'Sweet Potato Puree',
      },
      {
        age: '6-8 months',
        ingredients: ['1/4 cup oats', '1/2 banana', 'Breast milk or formula'],
        instructions: 'Cook oats, mash banana, mix together with milk',
        nutrition: 'Good source of potassium and iron',
        title: 'Banana Oatmeal',
      },
      {
        age: '8-10 months',
        ingredients: ['2 oz cooked chicken', '1/4 cup peas', '1/4 cup carrots'],
        instructions:
          'Cook chicken and veggies until soft, mash or chop finely',
        nutrition: 'High protein with vitamins',
        title: 'Chicken & Veggie Mash',
      },
      {
        age: '10-12 months',
        ingredients: ['2 eggs', '1/4 cup cheese', 'Chopped veggies'],
        instructions:
          'Mix ingredients, pour into muffin tin, bake at 350°F for 15 min',
        nutrition: 'Protein-rich finger food',
        title: 'Mini Egg Muffins',
      },
    ];

    const filteredRecipes = recipes.filter((recipe) => {
      const ageRange = recipe.age.split('-')[0]?.trim() ?? '0';
      return Number.parseInt(ageRange, 10) <= babyAgeMonths;
    });

    return (
      <div className="space-y-4">
        <div className="bg-gradient-to-br from-solids/20 to-solids/5 rounded-3xl p-6 border border-solids/20">
          <h2 className="text-xl font-bold mb-2">Baby Food Recipes</h2>
          <p className="text-sm text-muted-foreground">
            Age-appropriate recipes for {babyAgeMonths} months
          </p>
        </div>

        {filteredRecipes.map((recipe) => (
          <div
            className="bg-card rounded-3xl p-6 border border-border"
            key={recipe.title}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-lg">{recipe.title}</h3>
                <p className="text-xs text-muted-foreground">{recipe.age}</p>
              </div>
              <span className="text-xs bg-solids/20 text-solids px-3 py-1 rounded-full">
                {recipe.nutrition}
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <p className="font-medium text-sm mb-2">Ingredients:</p>
                <ul className="space-y-1">
                  {recipe.ingredients.map((ingredient) => (
                    <li
                      className="text-sm text-muted-foreground flex items-start gap-2"
                      key={`${recipe.title}-${ingredient}`}
                    >
                      <span className="text-solids">•</span>
                      {ingredient}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="font-medium text-sm mb-2">Instructions:</p>
                <p className="text-sm text-muted-foreground">
                  {recipe.instructions}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderInventoryTab = () => {
    const addInventoryItem = () => {
      const isoDate = new Date().toISOString();
      const [datePart] = isoDate.split('T');
      const newItem: MilkInventoryItem = {
        amount: 4,
        date: datePart ?? isoDate,
        id: Date.now(),
        location: 'freezer',
        type: 'breastmilk',
        unit: 'oz',
      };
      const updated = [...milkInventory, newItem];
      setMilkInventory(updated);
      localStorage.setItem('milkInventory', JSON.stringify(updated));
    };

    const totalOz = milkInventory.reduce((sum, item) => sum + item.amount, 0);

    return (
      <div className="space-y-4">
        <div className="bg-gradient-to-br from-feeding/20 to-feeding/5 rounded-3xl p-6 border border-feeding/20">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold">Milk Inventory</h2>
              <p className="text-sm text-muted-foreground">
                Track your freezer stash
              </p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-feeding">{totalOz}</p>
              <p className="text-xs text-muted-foreground">oz total</p>
            </div>
          </div>

          <Button className="w-full" onClick={addInventoryItem}>
            <Milk className="h-4 w-4 mr-2" />
            Add Milk Storage
          </Button>
        </div>

        <div className="space-y-3">
          {milkInventory.length === 0 ? (
            <div className="bg-card rounded-3xl p-8 border border-border text-center">
              <Milk className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No milk inventory yet</p>
              <p className="text-sm text-muted-foreground">
                Start tracking your freezer stash
              </p>
            </div>
          ) : (
            milkInventory.map((item) => (
              <div
                className="bg-card rounded-2xl p-4 border border-border"
                key={item.id}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium capitalize">{item.type}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.date} • {item.location}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-feeding">
                      {item.amount} {item.unit}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="bg-card rounded-3xl p-6 border border-border">
          <h3 className="font-semibold mb-3">Storage Guidelines</h3>
          <div className="space-y-2 text-sm">
            <p className="flex items-start gap-2">
              <span className="text-feeding">•</span>
              <span>Room temp: 4 hours</span>
            </p>
            <p className="flex items-start gap-2">
              <span className="text-feeding">•</span>
              <span>Refrigerator: 4 days</span>
            </p>
            <p className="flex items-start gap-2">
              <span className="text-feeding">•</span>
              <span>Freezer: 6-12 months</span>
            </p>
          </div>
        </div>
      </div>
    );
  };

  const renderAllergenTrackerTab = () => {
    const allergens = [
      { age: '4-6 months', introduced: false, name: 'Peanuts' },
      { age: '4-6 months', introduced: false, name: 'Eggs' },
      { age: '6+ months', introduced: false, name: 'Milk/Dairy' },
      { age: '6+ months', introduced: false, name: 'Tree Nuts' },
      { age: '6+ months', introduced: false, name: 'Soy' },
      { age: '6+ months', introduced: false, name: 'Wheat' },
      { age: '6+ months', introduced: false, name: 'Fish' },
      { age: '8+ months', introduced: false, name: 'Shellfish' },
    ];

    const toggleAllergen = (name: string) => {
      const updated = { ...allergenTracker, [name]: !allergenTracker[name] };
      setAllergenTracker(updated);
      localStorage.setItem('allergenTracker', JSON.stringify(updated));
    };

    return (
      <div className="space-y-4">
        <div className="bg-gradient-to-br from-accent/20 to-accent/5 rounded-3xl p-6 border border-accent/20">
          <h2 className="text-xl font-bold mb-2">Allergen Introduction</h2>
          <p className="text-sm text-muted-foreground">
            Introduce allergens early (4-6 months) to reduce allergy risk. Wait
            3-5 days between new foods.
          </p>
        </div>

        <div className="space-y-3">
          {allergens.map((allergen) => (
            <div
              className="bg-card rounded-2xl p-4 border border-border flex items-center justify-between"
              key={allergen.name}
            >
              <div className="flex items-center gap-3">
                <button
                  className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-colors ${
                    allergenTracker[allergen.name]
                      ? 'bg-accent border-accent text-accent-foreground'
                      : 'border-border'
                  }`}
                  onClick={() => toggleAllergen(allergen.name)}
                  type="button"
                >
                  {allergenTracker[allergen.name] && (
                    <span className="text-white text-sm">✓</span>
                  )}
                </button>
                <div>
                  <p className="font-medium">{allergen.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Introduce at {allergen.age}
                  </p>
                </div>
              </div>
              {allergenTracker[allergen.name] && (
                <span className="text-xs bg-accent/20 text-accent px-3 py-1 rounded-full">
                  Introduced
                </span>
              )}
            </div>
          ))}
        </div>

        <div className="bg-card rounded-3xl p-6 border border-border">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            Watch for Reactions
          </h3>
          <p className="text-sm text-muted-foreground mb-3">
            Signs of allergic reaction: rash, hives, vomiting, diarrhea,
            difficulty breathing
          </p>
          <Link href="/emergency">
            <Button className="w-full" variant="destructive">
              Emergency Help
            </Button>
          </Link>
        </div>
      </div>
    );
  };

  const renderReactionsTab = () => {
    const addReaction = () => {
      const isoDate = new Date().toISOString();
      const [datePart] = isoDate.split('T');
      const newReaction: FoodReaction = {
        date: datePart ?? isoDate,
        food: 'New Food',
        id: Date.now(),
        reaction: 'Mild rash',
        severity: 'mild',
      };
      const updated = [...foodReactions, newReaction];
      setFoodReactions(updated);
      localStorage.setItem('foodReactions', JSON.stringify(updated));
    };

    return (
      <div className="space-y-4">
        <div className="bg-gradient-to-br from-destructive/20 to-destructive/5 rounded-3xl p-6 border border-destructive/20">
          <h2 className="text-xl font-bold mb-2">Food Reaction Diary</h2>
          <p className="text-sm text-muted-foreground">
            Track any reactions to new foods
          </p>
        </div>

        <Button className="w-full" onClick={addReaction}>
          <FileText className="h-4 w-4 mr-2" />
          Log New Reaction
        </Button>

        <div className="space-y-3">
          {foodReactions.length === 0 ? (
            <div className="bg-card rounded-3xl p-8 border border-border text-center">
              <ClipboardList className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No reactions logged</p>
              <p className="text-sm text-muted-foreground">
                Keep track of any food sensitivities
              </p>
            </div>
          ) : (
            foodReactions.map((reaction) => (
              <div
                className="bg-card rounded-2xl p-4 border border-border"
                key={reaction.id}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-medium">{reaction.food}</p>
                    <p className="text-xs text-muted-foreground">
                      {reaction.date}
                    </p>
                  </div>
                  <span
                    className={`text-xs px-3 py-1 rounded-full ${
                      reaction.severity === 'severe'
                        ? 'bg-destructive/20 text-destructive'
                        : reaction.severity === 'moderate'
                          ? 'bg-secondary/20 text-secondary'
                          : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {reaction.severity}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {reaction.reaction}
                </p>
              </div>
            ))
          )}
        </div>

        <div className="bg-card rounded-3xl p-6 border border-border">
          <h3 className="font-semibold mb-3">When to Call Doctor</h3>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-destructive">•</span>
              <span>Difficulty breathing or swallowing</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-destructive">•</span>
              <span>Swelling of face, lips, or tongue</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-destructive">•</span>
              <span>Severe vomiting or diarrhea</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-destructive">•</span>
              <span>Persistent rash or hives</span>
            </li>
          </ul>
        </div>
      </div>
    );
  };

  return (
    <main className="px-4 pt-4 pb-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-secondary/20 flex items-center justify-center">
            <Utensils className="h-6 w-6 text-secondary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Meal Planning & Nutrition</h1>
            <p className="text-sm text-muted-foreground">
              {journeyData?.journeyStage === 'ttc' &&
                'Nutrition for conception'}
              {journeyData?.journeyStage === 'pregnant' &&
                `Trimester ${getTrimester(weeksPregnant)} nutrition guide`}
              {journeyData?.journeyStage === 'born' &&
                `Feeding guide for ${babyAgeMonths} months`}
            </p>
          </div>
        </div>

        {journeyData?.journeyStage === 'born' && babyAgeMonths >= 4 && (
          <div className="flex gap-2 overflow-x-auto pb-2">
            <button
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === 'overview'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}
              onClick={() => setActiveTab('overview')}
              type="button"
            >
              Overview
            </button>
            <button
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === 'recipes'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}
              onClick={() => setActiveTab('recipes')}
              type="button"
            >
              Recipes
            </button>
            <button
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === 'inventory'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}
              onClick={() => setActiveTab('inventory')}
              type="button"
            >
              Milk Inventory
            </button>
            <button
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === 'allergens'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}
              onClick={() => setActiveTab('allergens')}
              type="button"
            >
              Allergens
            </button>
            <button
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === 'reactions'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}
              onClick={() => setActiveTab('reactions')}
              type="button"
            >
              Reactions
            </button>
          </div>
        )}

        {/* Quick Links */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-2 gap-3">
            <Link href="/learning">
              <div className="bg-card border border-border rounded-2xl p-4 hover:bg-muted/50 transition-colors">
                <BookOpen className="h-5 w-5 text-primary mb-2" />
                <p className="font-medium text-sm">Learning Hub</p>
                <p className="text-xs text-muted-foreground">Feeding guides</p>
              </div>
            </Link>
            <Link href="/chat">
              <div className="bg-card border border-border rounded-2xl p-4 hover:bg-muted/50 transition-colors">
                <ChefHat className="h-5 w-5 text-secondary mb-2" />
                <p className="font-medium text-sm">Ask AI</p>
                <p className="text-xs text-muted-foreground">Recipe ideas</p>
              </div>
            </Link>
          </div>
        )}

        {activeTab === 'overview' && (
          <>
            {journeyData?.journeyStage === 'ttc' && renderTTCContent()}
            {journeyData?.journeyStage === 'pregnant' &&
              renderPregnantContent()}
            {journeyData?.journeyStage === 'born' && renderBabyContent()}
          </>
        )}
        {activeTab === 'recipes' && renderRecipesTab()}
        {activeTab === 'inventory' && renderInventoryTab()}
        {activeTab === 'allergens' && renderAllergenTrackerTab()}
        {activeTab === 'reactions' && renderReactionsTab()}

        {!journeyData && (
          <div className="bg-card rounded-3xl p-8 border border-border text-center">
            <p className="text-muted-foreground mb-4">
              Complete onboarding to see personalized nutrition guidance
            </p>
            <Link href="/onboarding">
              <Button>Complete Onboarding</Button>
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
