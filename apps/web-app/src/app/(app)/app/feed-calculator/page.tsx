/* eslint-disable */
// @ts-nocheck
// NOTE: This screen is generated mock UI content. Disable type-checking until it is replaced with a typed implementation.
'use client';

import { Alert, AlertDescription } from '@nugget/ui/alert';
import { Button } from '@nugget/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@nugget/ui/card';
import { ChartContainer, ChartTooltip } from '@nugget/ui/chart';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@nugget/ui/collapsible';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@nugget/ui/drawer';
import { Input } from '@nugget/ui/input';
import { Label } from '@nugget/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@nugget/ui/select';
import { Switch } from '@nugget/ui/switch';
import {
  AlertCircle,
  Baby,
  BarChart3,
  BookOpen,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  Droplet,
  Eye,
  Heart,
  Milk,
  Plus,
  RotateCcw,
  Thermometer,
  Trash2,
  TrendingUp,
  User,
  UserPlus,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts';

// Types
type Ml = number;
type Oz = number;
type Source = 'PUMPED' | 'DONOR' | 'DIRECT' | 'FORMULA';
type SupplySource = 'PUMPED' | 'DONOR' | 'FORMULA';

interface FeedRow {
  id: string;
  isoTime: string;
  amountMl: Ml;
  source: Source;
  notes?: string;
  assignee?: string; // Added assignee field
  isScheduled?: boolean; // Added flag for future scheduled feeds
}

interface TargetWindow {
  id: string;
  label: string;
  minMlPerFeed: Ml;
  maxMlPerFeed: Ml;
  minMlPerDay: Ml;
  maxMlPerDay: Ml;
  minDays: number;
  maxDays: number;
}

interface BabyState {
  birthWeightOz: Oz;
  currentWeightOz: Oz;
  birthIso: string;
}

interface SupplyInventory {
  donorMl: number;
  formulaMl: number;
  pumpedMl: number;
}

interface AppState {
  baby: BabyState;
  targets: TargetWindow[];
  feedsByDate: Record<string, FeedRow[]>;
  unitPref: 'ML' | 'OZ';
  supply: SupplyInventory;
  pumpsPerDay: Ml;
  mlPerPump: Ml;
  feedIntervalHours: number;
  caregivers: string[]; // List of caregivers who can be assigned
}

// Constants & Utils
const ML_PER_OZ = 29.57;

const ozToMl = (oz: Oz): Ml => oz * ML_PER_OZ;
const mlToOz = (ml: Ml): Oz => ml / ML_PER_OZ;

const ageInDays = (birthIso: string, nowIso: string) =>
  Math.max(
    0,
    Math.floor(
      (new Date(nowIso).getTime() - new Date(birthIso).getTime()) /
        (1000 * 60 * 60 * 24),
    ),
  );

const formatAmount = (ml: Ml, pref: 'ML' | 'OZ') => {
  if (pref === 'ML') return `${ml.toFixed(0)} mL`;
  return `${mlToOz(ml).toFixed(1)} oz`;
};

const formatDateKey = (date: Date) => date.toISOString().split('T')[0];

const defaultTargets: TargetWindow[] = [
  {
    id: 'd1',
    label: 'Day 1',
    maxDays: 1,
    maxMlPerDay: 90,
    maxMlPerFeed: 10,
    minDays: 1,
    minMlPerDay: 60,
    minMlPerFeed: 5,
  },
  {
    id: 'd2',
    label: 'Day 2',
    maxDays: 2,
    maxMlPerDay: 150,
    maxMlPerFeed: 15,
    minDays: 2,
    minMlPerDay: 90,
    minMlPerFeed: 10,
  },
  {
    id: 'd3',
    label: 'Day 3',
    maxDays: 3,
    maxMlPerDay: 450,
    maxMlPerFeed: 30,
    minDays: 3,
    minMlPerDay: 300,
    minMlPerFeed: 20,
  },
  {
    id: 'd4',
    label: 'Day 4',
    maxDays: 4,
    maxMlPerDay: 500,
    maxMlPerFeed: 35,
    minDays: 4,
    minMlPerDay: 350,
    minMlPerFeed: 25,
  },
  {
    id: 'd5',
    label: 'Day 5',
    maxDays: 5,
    maxMlPerDay: 750,
    maxMlPerFeed: 60,
    minDays: 5,
    minMlPerDay: 600,
    minMlPerFeed: 45,
  },
  {
    id: 'd6-7',
    label: 'Days 6-7',
    maxDays: 7,
    maxMlPerDay: 800,
    maxMlPerFeed: 70,
    minDays: 6,
    minMlPerDay: 700,
    minMlPerFeed: 50,
  },
  {
    id: 'w2',
    label: 'Week 2',
    maxDays: 14,
    maxMlPerDay: 900,
    maxMlPerFeed: 90,
    minDays: 8,
    minMlPerDay: 750,
    minMlPerFeed: 60,
  },
  {
    id: 'w3',
    label: 'Week 3',
    maxDays: 21,
    maxMlPerDay: 1000,
    maxMlPerFeed: 100,
    minDays: 15,
    minMlPerDay: 900,
    minMlPerFeed: 90,
  },
  {
    id: 'w4',
    label: 'Week 4',
    maxDays: 28,
    maxMlPerDay: 1050,
    maxMlPerFeed: 120,
    minDays: 22,
    minMlPerDay: 900,
    minMlPerFeed: 90,
  },
];

const pickTargetWindow = (
  ageDays: number,
  windows: TargetWindow[],
): TargetWindow | null => {
  return (
    windows.find((w) => ageDays >= w.minDays && ageDays <= w.maxDays) || null
  );
};

const sumBySource = (rows: FeedRow[]) => {
  const totals = { DIRECT: 0, DONOR: 0, FORMULA: 0, PUMPED: 0, TOTAL: 0 };
  for (const r of rows) {
    totals[r.source] += r.amountMl;
    totals.TOTAL += r.amountMl;
  }
  return totals;
};

const generateId = () => Math.random().toString(36).substring(2, 11);

const getTargetWeightForAge = (ageDays: number, birthWeightOz: Oz): Oz => {
  // Babies should regain birth weight by day 10-14
  if (ageDays <= 14) {
    return birthWeightOz;
  }

  // After regaining birth weight, babies typically gain 0.5-1 oz per day (avg 0.75 oz/day)
  const daysAfterRegain = ageDays - 14;
  const expectedGainOz = daysAfterRegain * 0.75;
  return birthWeightOz + expectedGainOz;
};

const calculateWeightGainNeeded = (
  currentWeightOz: Oz,
  targetWeightOz: Oz,
  _ageDays: number,
): {
  deficitOz: number;
  additionalMlPerDay: number;
  adjustedMinPerFeed: number;
} => {
  const deficitOz = targetWeightOz - currentWeightOz;

  if (deficitOz <= 0) {
    return { additionalMlPerDay: 0, adjustedMinPerFeed: 0, deficitOz: 0 };
  }

  // To gain 1 oz, baby needs approximately 150-180 ml extra milk
  // We'll use 165 ml per oz as average
  const mlPer1OzGain = 165;

  // Spread the catch-up over 7-10 days for safe weight gain (using 7 days for faster catch-up)
  const daysToRecover = 7;
  const totalMlNeeded = deficitOz * mlPer1OzGain;
  const additionalMlPerDay = totalMlNeeded / daysToRecover;

  return {
    additionalMlPerDay,
    adjustedMinPerFeed: additionalMlPerDay / 8, // Assuming 8 feeds per day average
    deficitOz,
  };
};

const defaultState: AppState = {
  baby: {
    birthIso: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    birthWeightOz: 130, // 8 lb 2 oz
    currentWeightOz: 112, // 7 lb
  },
  caregivers: ['Mom', 'Dad'], // Default caregivers
  feedIntervalHours: 2.5,
  feedsByDate: {},
  mlPerPump: 24,
  pumpsPerDay: 6,
  supply: {
    donorMl: 0,
    formulaMl: 0,
    // Added supply tracking
    pumpedMl: 0,
  },
  targets: defaultTargets,
  unitPref: 'ML', // Default to ML
};

export default function FeedCalculatorPage() {
  const [state, setState] = useState<AppState>(defaultState);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const [logOpen, setLogOpen] = useState(false);

  const [addFeedDrawerOpen, setAddFeedDrawerOpen] = useState(false);
  const [addSupplyDrawerOpen, setAddSupplyDrawerOpen] = useState(false);
  const [postponeDrawerOpen, setPostponeDrawerOpen] = useState(false);
  const [postponeMinutes, setPostponeMinutes] = useState('30');

  const [supplyHistoryDrawerOpen, setSupplyHistoryDrawerOpen] = useState(false);
  const [selectedSupplyType, setSelectedSupplyType] = useState<
    'PUMPED' | 'DONOR' | 'FORMULA' | null
  >(null); // Initialize as null

  const [caregiversDrawerOpen, setCaregiversDrawerOpen] = useState(false);
  const [newCaregiverName, setNewCaregiverName] = useState('');
  const [assignDrawerOpen, setAssignDrawerOpen] = useState(false);
  const [selectedFeedId, setSelectedFeedId] = useState<string | null>(null);
  const [selectedAssignee, setSelectedAssignee] = useState('');
  const [customCaregiverName, setCustomCaregiverName] = useState('');

  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [filterAssignee, setFilterAssignee] = useState<string | null>(null);

  const [doneDrawerOpen, setDoneDrawerOpen] = useState(false);
  const [doneAmount, setDoneAmount] = useState('');
  const [doneTime, setDoneTime] = useState('');
  const [doneSource, setDoneSource] = useState<Source>('DIRECT');
  const [doneAssignee, setDoneAssignee] = useState('');
  const [doneCustomCaregiver, setDoneCustomCaregiver] = useState('');

  // State for the new feed inputs
  const [newFeedTime, setNewFeedTime] = useState('');
  const [newFeedAmount, setNewFeedAmount] = useState('');
  const [newFeedSource, setNewFeedSource] = useState<Source>('DIRECT');
  const [newFeedAssignee, setNewFeedAssignee] = useState(''); // Added assignee for new feeds
  const [newFeedCustomCaregiver, setNewFeedCustomCaregiver] = useState('');

  // State for adding supply
  const [addSupplyAmount, setAddSupplyAmount] = useState('');
  const [addSupplySource, setAddSupplySource] = useState<
    'PUMPED' | 'DONOR' | 'FORMULA'
  >('PUMPED');

  // CHANGE: Add state for calendar drawer
  const [calendarDrawerOpen, setCalendarDrawerOpen] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('feedCalculatorState');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (!parsed.supply) {
          parsed.supply = { donorMl: 0, formulaMl: 0, pumpedMl: 0 };
        }
        if (!parsed.pumpsPerDay) parsed.pumpsPerDay = 6;
        if (!parsed.mlPerPump) parsed.mlPerPump = 24;
        if (!parsed.feedIntervalHours) parsed.feedIntervalHours = 2.5;
        if (!parsed.caregivers) parsed.caregivers = ['Mom', 'Dad']; // Initialize caregivers
        setState(parsed);
      } catch (e) {
        console.error('Failed to parse saved state', e);
      }
    }
  }, []);

  // Save to localStorage with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem('feedCalculatorState', JSON.stringify(state));
    }, 500);
    return () => clearTimeout(timer);
  }, [state]);

  const ageDays = ageInDays(state.baby.birthIso, new Date().toISOString());
  const currentTarget = pickTargetWindow(ageDays, state.targets);
  const weightLossPercent =
    ((state.baby.birthWeightOz - state.baby.currentWeightOz) /
      state.baby.birthWeightOz) *
    100;

  const targetWeightOz = getTargetWeightForAge(
    ageDays,
    state.baby.birthWeightOz,
  );
  const weightGainAnalysis = calculateWeightGainNeeded(
    state.baby.currentWeightOz,
    targetWeightOz,
    ageDays,
  );
  const isUnderweight = weightGainAnalysis.deficitOz > 0;

  // Adjust feeding targets if underweight
  const adjustedTarget =
    currentTarget && isUnderweight
      ? {
          ...currentTarget,
          minMlPerDay:
            currentTarget.minMlPerDay + weightGainAnalysis.additionalMlPerDay,
          minMlPerFeed:
            currentTarget.minMlPerFeed + weightGainAnalysis.adjustedMinPerFeed,
        }
      : currentTarget;

  const selectedDateKey = formatDateKey(selectedDate);
  const todayFeeds = state.feedsByDate[selectedDateKey] || [];

  const now = new Date();
  const allPastFeeds = todayFeeds.filter(
    (f) => !f.isScheduled && new Date(f.isoTime) <= now,
  );
  const pastFeeds = filterAssignee
    ? allPastFeeds.filter((f) => f.assignee === filterAssignee)
    : allPastFeeds;
  const futureFeeds = generateFutureFeeds();

  const totals = sumBySource(allPastFeeds); // Count all past feeds for totals, not filtered

  const goToPreviousDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    setSelectedDate(newDate);
  };

  const goToNextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    setSelectedDate(newDate);
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  const isToday = formatDateKey(selectedDate) === formatDateKey(new Date());

  const formatDisplayDate = (date: Date) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (formatDateKey(date) === formatDateKey(today)) return 'Today';
    if (formatDateKey(date) === formatDateKey(tomorrow)) return 'Tomorrow';
    if (formatDateKey(date) === formatDateKey(yesterday)) return 'Yesterday';

    return date.toLocaleDateString([], {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const selectedDateAgeDays = ageInDays(
    state.baby.birthIso,
    selectedDate.toISOString(),
  );

  function generateFutureFeeds(): FeedRow[] {
    if (!currentTarget || pastFeeds.length === 0) return [];

    const sortedPastFeeds = [...pastFeeds].sort(
      (a, b) => new Date(b.isoTime).getTime() - new Date(a.isoTime).getTime(),
    );
    const lastFeed = sortedPastFeeds[0];
    const lastFeedTime = new Date(lastFeed.isoTime);

    const futureScheduled: FeedRow[] = [];
    let currentTime = new Date(
      lastFeedTime.getTime() + state.feedIntervalHours * 60 * 60 * 1000,
    );
    const endOfDay = new Date(selectedDate);
    endOfDay.setHours(23, 59, 59, 999);

    let feedCount = 0;
    while (currentTime <= endOfDay && feedCount < 10) {
      futureScheduled.push({
        amountMl: currentTarget.minMlPerFeed,
        assignee: undefined,
        id: `scheduled-${feedCount}`,
        isoTime: currentTime.toISOString(),
        isScheduled: true,
        source: 'DIRECT',
      });
      currentTime = new Date(
        currentTime.getTime() + state.feedIntervalHours * 60 * 60 * 1000,
      );
      feedCount++;
    }

    return futureScheduled;
  }

  const addFeedFromDrawer = () => {
    const amount = Number.parseFloat(newFeedAmount);
    if (Number.isNaN(amount) || amount <= 0) return;

    const amountInMl = state.unitPref === 'OZ' ? ozToMl(amount) : amount;

    const feedTime = new Date(selectedDate);
    if (newFeedTime) {
      const [hours, minutes] = newFeedTime.split(':');
      const parsedHours = Number.parseInt(hours ?? '', 10);
      const parsedMinutes = Number.parseInt(minutes ?? '', 10);
      if (!Number.isNaN(parsedHours) && !Number.isNaN(parsedMinutes)) {
        feedTime.setHours(parsedHours, parsedMinutes);
      }
    } else {
      // If no time is specified, use the current time
      feedTime.setHours(new Date().getHours(), new Date().getMinutes());
    }

    const finalAssignee =
      newFeedCustomCaregiver.trim() || newFeedAssignee || undefined;

    const newFeed: FeedRow = {
      amountMl: amountInMl,
      assignee: finalAssignee,
      id: generateId(),
      isoTime: feedTime.toISOString(),
      notes: '',
      source: newFeedSource,
    };

    setState((prev) => ({
      ...prev,
      feedsByDate: {
        ...prev.feedsByDate,
        [selectedDateKey]: [
          ...(prev.feedsByDate[selectedDateKey] || []),
          newFeed,
        ],
      },
    }));

    setNewFeedTime('');
    setNewFeedAmount('');
    setNewFeedSource('DIRECT');
    setNewFeedAssignee('');
    setNewFeedCustomCaregiver('');
    setAddFeedDrawerOpen(false);
  };

  const deleteFeed = (id: string) => {
    setState((prev) => ({
      ...prev,
      feedsByDate: {
        ...prev.feedsByDate,
        [selectedDateKey]: (prev.feedsByDate[selectedDateKey] || []).filter(
          (f) => f.id !== id,
        ),
      },
    }));
  };

  const addSupplyFromDrawer = () => {
    const amount = Number.parseFloat(addSupplyAmount);
    if (Number.isNaN(amount) || amount <= 0) return;

    const amountInMl = state.unitPref === 'OZ' ? ozToMl(amount) : amount;

    setState((prev) => ({
      ...prev,
      supply: {
        ...prev.supply,
        [`${addSupplySource.toLowerCase()}Ml`]:
          prev.supply[
            `${addSupplySource.toLowerCase()}Ml` as keyof SupplyInventory
          ] + amountInMl,
      },
    }));

    setAddSupplyAmount('');
    setAddSupplyDrawerOpen(false);
  };

  const clearAllData = () => {
    if (confirm('Are you sure you want to clear all data?')) {
      setState(defaultState);
      localStorage.removeItem('feedCalculatorState');
    }
  };

  const exportCSV = () => {
    const rows = [
      ['Time', 'Amount (mL)', 'Amount (oz)', 'Source', 'Assignee', 'Notes'],
      ...allPastFeeds.map((f) => [
        // Export all past feeds, not just filtered
        new Date(f.isoTime).toLocaleTimeString(),
        f.amountMl.toFixed(0),
        mlToOz(f.amountMl).toFixed(1),
        f.source,
        f.assignee || '',
        f.notes || '',
      ]),
      [],
      ['Summary'],
      ['Pumped', totals.PUMPED.toFixed(0), mlToOz(totals.PUMPED).toFixed(1)],
      ['Donor', totals.DONOR.toFixed(0), mlToOz(totals.DONOR).toFixed(1)],
      ['Formula', totals.FORMULA.toFixed(0), mlToOz(totals.FORMULA).toFixed(1)],
      ['Direct', totals.DIRECT.toFixed(0), mlToOz(totals.DIRECT).toFixed(1)],
      ['Total', totals.TOTAL.toFixed(0), mlToOz(totals.TOTAL).toFixed(1)],
    ];
    const csv = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `feed-log-${selectedDateKey}.csv`;
    a.click();
  };

  const getStatusColor = () => {
    if (!currentTarget) return 'text-muted-foreground';
    if (totals.TOTAL >= currentTarget.minMlPerDay) return 'text-green-500';
    if (totals.TOTAL >= currentTarget.minMlPerDay * 0.8)
      return 'text-yellow-500';
    return 'text-red-500';
  };

  const nextFeedInfo = () => {
    if (pastFeeds.length === 0) return null;

    const sortedFeeds = [...pastFeeds].sort(
      (a, b) => new Date(b.isoTime).getTime() - new Date(a.isoTime).getTime(),
    );
    const lastFeed = sortedFeeds[0];
    const nextFeedTime = new Date(
      new Date(lastFeed.isoTime).getTime() +
        state.feedIntervalHours * 60 * 60 * 1000,
    );
    const now = new Date();
    const diffMs = nextFeedTime.getTime() - now.getTime();

    const targetAmount = currentTarget
      ? formatAmount(currentTarget.minMlPerFeed, state.unitPref)
      : '';

    if (diffMs < 0) {
      const overdueMins = Math.abs(Math.floor(diffMs / (1000 * 60)));
      return {
        absoluteTime: nextFeedTime.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
        amount: targetAmount,
        relativeTime: `Overdue by ${overdueMins} min`,
        status: 'overdue',
      };
    }

    const mins = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;

    let relativeTime = '';
    if (hours > 0) {
      relativeTime = `in ${hours}h ${remainingMins}m`;
    } else {
      relativeTime = `in ${mins} min`;
    }

    return {
      absoluteTime: nextFeedTime.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
      amount: targetAmount,
      relativeTime,
      status: 'upcoming',
    };
  };

  const calculateSupplySufficiency = () => {
    if (!currentTarget) return null;

    const feedsPerDay = Math.ceil(24 / state.feedIntervalHours);
    const remainingFeeds = feedsPerDay - pastFeeds.length; // Use pastFeeds
    const amountNeededPerFeed = currentTarget.minMlPerFeed;
    const totalRemainingNeeded = remainingFeeds * amountNeededPerFeed;

    // Calculate available supply (exclude direct feeds)
    const availableSupply =
      state.supply.pumpedMl + state.supply.donorMl + state.supply.formulaMl;

    if (availableSupply >= totalRemainingNeeded) {
      const feedsCovered = Math.floor(availableSupply / amountNeededPerFeed);
      return {
        feedsCovered,
        message: `Supply available for ${feedsCovered} more feedings`,
        status: 'sufficient',
      };
    }
    const deficit = totalRemainingNeeded - availableSupply;
    const feedsCovered = Math.floor(availableSupply / amountNeededPerFeed);
    return {
      deficit,
      feedsCovered,
      message: `Only ${feedsCovered} feedings covered. Need ${formatAmount(deficit, state.unitPref)} more`,
      status: 'insufficient',
    };
  };

  // CHANGE: Add supply analysis calculations after the supplyInfo calculation
  const calculateSupplyAnalysis = () => {
    if (!currentTarget) return null;

    const feedsPerDay = Math.ceil(24 / state.feedIntervalHours);
    const dailyDemand = feedsPerDay * currentTarget.minMlPerFeed;

    // Calculate consumption by source
    const pumpedConsumedToday = totals.PUMPED;
    const donorConsumedToday = totals.DONOR;
    const formulaConsumedToday = totals.FORMULA;

    // Remaining supply after today's consumption
    const remainingPumped = Math.max(
      0,
      state.supply.pumpedMl - pumpedConsumedToday,
    );
    const remainingDonor = Math.max(
      0,
      state.supply.donorMl - donorConsumedToday,
    );
    const remainingFormula = Math.max(
      0,
      state.supply.formulaMl - formulaConsumedToday,
    );

    const totalRemaining = remainingPumped + remainingDonor + remainingFormula;

    // Days of supply remaining (excluding direct feeds)
    const daysRemaining = dailyDemand > 0 ? totalRemaining / dailyDemand : 0;

    // Daily production (pumping forecast)
    const dailyProduction = state.pumpsPerDay * state.mlPerPump;

    // Net daily change (production - consumption)
    const netDailyChange = dailyProduction - dailyDemand;

    // Projected supply in 3 days and 7 days
    const projectedIn3Days = totalRemaining + netDailyChange * 3;
    const projectedIn7Days = totalRemaining + netDailyChange * 7;

    // Calculate when inventory will run out (if deficit)
    let daysUntilRunOut = null;
    if (netDailyChange < 0 && totalRemaining > 0) {
      daysUntilRunOut = totalRemaining / Math.abs(netDailyChange);
    }

    return {
      breakdown: {
        donor: remainingDonor,
        formula: remainingFormula,
        pumped: remainingPumped,
      },
      dailyDemand,
      dailyProduction,
      daysRemaining,
      daysUntilRunOut,
      netDailyChange,
      projectedIn3Days,
      projectedIn7Days,
      totalRemaining,
    };
  };

  const supplyInfo = calculateSupplySufficiency();
  const supplyAnalysis = calculateSupplyAnalysis(); // CHANGE: Calculate supply analysis

  const openDoneDrawer = () => {
    if (!currentTarget) return;

    // Pre-populate with suggested values
    const now = new Date();
    setDoneTime(now.toTimeString().slice(0, 5)); // HH:MM format
    setDoneAmount(
      state.unitPref === 'ML'
        ? currentTarget.minMlPerFeed.toFixed(0)
        : mlToOz(currentTarget.minMlPerFeed).toFixed(1),
    );
    setDoneSource('DIRECT');
    setDoneAssignee('');
    setDoneCustomCaregiver('');
    setDoneDrawerOpen(true);
  };

  const confirmFeedDone = () => {
    const amount = Number.parseFloat(doneAmount);
    if (Number.isNaN(amount) || amount <= 0) return;

    const amountInMl = state.unitPref === 'OZ' ? ozToMl(amount) : amount;

    const feedTime = new Date(selectedDate);
    if (doneTime) {
      const [hours, minutes] = doneTime.split(':');
      const parsedHours = Number.parseInt(hours ?? '', 10);
      const parsedMinutes = Number.parseInt(minutes ?? '', 10);
      if (!Number.isNaN(parsedHours) && !Number.isNaN(parsedMinutes)) {
        feedTime.setHours(parsedHours, parsedMinutes);
      }
    }

    const finalAssignee =
      doneCustomCaregiver.trim() || doneAssignee || undefined;

    const newFeed: FeedRow = {
      amountMl: amountInMl,
      assignee: finalAssignee,
      id: generateId(),
      isoTime: feedTime.toISOString(),
      notes: '',
      source: doneSource,
    };

    setState((prev) => ({
      ...prev,
      feedsByDate: {
        ...prev.feedsByDate,
        [selectedDateKey]: [
          ...(prev.feedsByDate[selectedDateKey] || []),
          newFeed,
        ],
      },
    }));

    setDoneDrawerOpen(false);
  };

  const handlePostpone = () => {
    const mins = Number.parseInt(postponeMinutes, 10);
    if (Number.isNaN(mins) || mins <= 0) return;

    // Adjust the last feed time backward to push the next feed forward
    if (pastFeeds.length > 0) {
      const sortedFeeds = [...pastFeeds].sort(
        (a, b) => new Date(b.isoTime).getTime() - new Date(a.isoTime).getTime(),
      );
      const lastFeed = sortedFeeds[0];

      // Subtract the postpone time from the last feed to push next feed later
      const adjustedTime = new Date(
        new Date(lastFeed.isoTime).getTime() - mins * 60 * 1000,
      );

      setState((prev) => ({
        ...prev,
        feedsByDate: {
          ...prev.feedsByDate,
          [selectedDateKey]: (prev.feedsByDate[selectedDateKey] || []).map(
            (f) =>
              f.id === lastFeed.id
                ? { ...f, isoTime: adjustedTime.toISOString() }
                : f,
          ),
        },
      }));
    }

    setPostponeDrawerOpen(false);
    setPostponeMinutes('30');
  };

  const quickAddSupply = (
    type: 'PUMPED' | 'DONOR' | 'FORMULA',
    amount: number,
  ) => {
    const amountInMl = state.unitPref === 'OZ' ? ozToMl(amount) : amount;

    setState((prev) => ({
      ...prev,
      supply: {
        ...prev.supply,
        [`${type.toLowerCase()}Ml`]:
          prev.supply[`${type.toLowerCase()}Ml` as keyof SupplyInventory] +
          amountInMl,
      },
    }));
  };

  const addCaregiver = () => {
    if (!newCaregiverName.trim()) return;

    setState((prev) => ({
      ...prev,
      caregivers: [...prev.caregivers, newCaregiverName.trim()],
    }));

    setNewCaregiverName('');
  };

  const removeCaregiver = (name: string) => {
    setState((prev) => ({
      ...prev,
      caregivers: prev.caregivers.filter((c) => c !== name),
    }));
  };

  const assignFeed = () => {
    if (!selectedFeedId) return;

    const finalAssignee = customCaregiverName.trim() || selectedAssignee;
    if (!finalAssignee) return;

    const feed = futureFeeds.find((f) => f.id === selectedFeedId);
    if (!feed) return;

    // Convert scheduled feed to actual feed with assignee
    const newFeed: FeedRow = {
      amountMl: feed.amountMl,
      assignee: finalAssignee,
      id: generateId(),
      isoTime: feed.isoTime,
      isScheduled: true,
      notes: '',
      source: feed.source,
    };

    setState((prev) => ({
      ...prev,
      feedsByDate: {
        ...prev.feedsByDate,
        [selectedDateKey]: [
          ...(prev.feedsByDate[selectedDateKey] || []),
          newFeed,
        ],
      },
    }));

    setAssignDrawerOpen(false);
    setSelectedFeedId(null);
    setSelectedAssignee('');
    setCustomCaregiverName('');
  };

  const nextFeedAssignee = () => {
    if (futureFeeds.length === 0) return null;
    const nextScheduled = futureFeeds[0];
    const assignedFeed = todayFeeds.find(
      (f) =>
        f.isScheduled &&
        new Date(f.isoTime).getTime() ===
          new Date(nextScheduled.isoTime).getTime(),
    );
    return assignedFeed?.assignee || null;
  };

  // CHANGE: Added state for tips carousel
  const [currentTipIndex, setCurrentTipIndex] = useState(0);

  const feedingTips = [
    {
      content:
        'Wash bottles, nipples, and caps in hot soapy water immediately after each use. Use a bottle brush to reach all areas. Sterilize once daily for babies under 3 months by boiling for 5 minutes.',
      icon: Droplet,
      title: 'Bottle Cleaning Best Practices',
    },
    {
      content:
        'Freshly pumped milk: 4 hours at room temp, 4 days in fridge, 6-12 months in freezer. Thawed milk: use within 24 hours, never refreeze.',
      icon: Clock,
      title: 'Breast Milk Storage Times',
    },
    {
      content:
        "Once baby's mouth touches the bottle, bacteria can grow. Discard any unfinished milk within 1-2 hours. Don't save it for the next feeding.",
      icon: AlertCircle,
      title: 'Never Reuse Unfinished Milk',
    },
    {
      content:
        'Never microwave breast milk - it creates hot spots and destroys nutrients. Use a bottle warmer or warm water bath. Test temperature on your wrist before feeding.',
      icon: Thermometer,
      title: 'Warming Milk Safely',
    },
    {
      content:
        'Hold baby semi-upright and let them control the flow. Pause every 20-30 seconds to prevent overfeeding. This mimics breastfeeding and reduces gas.',
      icon: Baby,
      title: 'Paced Bottle Feeding',
    },
    {
      content:
        'Always add powder to water (not water to powder) for correct concentration. Use within 1 hour of preparation or store in fridge for up to 24 hours.',
      icon: Milk,
      title: 'Formula Preparation',
    },
    {
      content:
        'Burp baby halfway through and after feeding. Try over-shoulder, sitting, or face-down positions. Gentle back pats or circular rubs work best.',
      icon: Heart,
      title: 'Burping Techniques',
    },
    {
      content:
        'Watch for rooting, sucking on hands, smacking lips, or turning head toward breast/bottle. Crying is a late hunger cue - feed before baby gets too upset.',
      icon: Eye,
      title: 'Signs of Hunger',
    },
  ];

  const nextTip = () => {
    setCurrentTipIndex((prev) => (prev + 1) % feedingTips.length);
  };

  const previousTip = () => {
    setCurrentTipIndex(
      (prev) => (prev - 1 + feedingTips.length) % feedingTips.length,
    );
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary/20 via-secondary/10 to-accent/10 px-4 py-6">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-2xl font-bold text-foreground">
            Feed Calculator
          </h1>
          <div className="flex items-center gap-2 bg-card/50 backdrop-blur-sm px-2.5 py-1.5 rounded-lg">
            <span
              className={`text-xs font-medium ${state.unitPref === 'ML' ? 'text-foreground' : 'text-muted-foreground'}`}
            >
              mL
            </span>
            <Switch
              checked={state.unitPref === 'OZ'}
              onCheckedChange={(checked) =>
                setState((prev) => ({
                  ...prev,
                  unitPref: checked ? 'OZ' : 'ML',
                }))
              }
            />
            <span
              className={`text-xs font-medium ${state.unitPref === 'OZ' ? 'text-foreground' : 'text-muted-foreground'}`}
            >
              oz
            </span>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Track intake & manage supply
        </p>
      </div>
      <div className="px-3 py-4 space-y-4">
        {/* CHANGE: Added Helpful Tips Carousel */}
        <Card className="bg-gradient-to-br from-primary/10 to-secondary/10">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">Feeding Tips</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <div className="flex items-start gap-3 min-h-[120px]">
                {(() => {
                  const tip = feedingTips[currentTipIndex];
                  const Icon = tip.icon;
                  return (
                    <>
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-sm mb-1.5">
                          {tip.title}
                        </h3>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {tip.content}
                        </p>
                      </div>
                    </>
                  );
                })()}
              </div>

              <div className="flex items-center justify-between mt-4 pt-3 border-t">
                <Button
                  className="h-8"
                  onClick={previousTip}
                  size="sm"
                  variant="ghost"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                <div className="flex gap-1.5">
                  {feedingTips.map((tip, idx) => (
                    <button
                      aria-label={`Go to tip ${idx + 1}`}
                      className={`h-1.5 rounded-full transition-all ${
                        idx === currentTipIndex
                          ? 'w-4 bg-primary'
                          : 'w-1.5 bg-muted-foreground/30'
                      }`}
                      key={tip.title}
                      onClick={() => setCurrentTipIndex(idx)}
                      type="button"
                    />
                  ))}
                </div>

                <Button
                  className="h-8"
                  onClick={nextTip}
                  size="sm"
                  variant="ghost"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Baby Info */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Baby Profile</CardTitle>
                <CardDescription className="text-xs">
                  Age {ageDays} days • Weight loss{' '}
                  {weightLossPercent.toFixed(1)}%
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label className="text-xs">Birth Weight</Label>
                <Input
                  className="mt-1 h-9 text-sm"
                  onChange={(e) =>
                    setState((prev) => ({
                      ...prev,
                      baby: {
                        ...prev.baby,
                        birthWeightOz: Number.parseFloat(e.target.value) || 0,
                      },
                    }))
                  }
                  type="number"
                  value={state.baby.birthWeightOz}
                />
                <p className="text-xs text-muted-foreground mt-0.5">
                  {(state.baby.birthWeightOz / 16).toFixed(1)} lb
                </p>
              </div>
              <div>
                <Label className="text-xs">Current Weight</Label>
                <Input
                  className="mt-1 h-9 text-sm"
                  onChange={(e) =>
                    setState((prev) => ({
                      ...prev,
                      baby: {
                        ...prev.baby,
                        currentWeightOz: Number.parseFloat(e.target.value) || 0,
                      },
                    }))
                  }
                  type="number"
                  value={state.baby.currentWeightOz}
                />
                <p className="text-xs text-muted-foreground mt-0.5">
                  {(state.baby.currentWeightOz / 16).toFixed(1)} lb
                </p>
              </div>
              <div>
                <Label className="text-xs">Birth Date</Label>
                <Input
                  className="mt-1 h-9 text-sm"
                  onChange={(e) =>
                    setState((prev) => ({
                      ...prev,
                      baby: {
                        ...prev.baby,
                        birthIso: new Date(e.target.value).toISOString(),
                      },
                    }))
                  }
                  type="date"
                  value={state.baby.birthIso.slice(0, 10)}
                />
              </div>
            </div>

            {/* Feed Interval Configuration */}
            <div className="pt-2 border-t">
              <Label className="text-xs">Feed Interval (hours)</Label>
              <Input
                className="mt-1 h-9 text-sm"
                max="8"
                min="0.5"
                onChange={(e) =>
                  setState((prev) => ({
                    ...prev,
                    feedIntervalHours: Number.parseFloat(e.target.value) || 2.5,
                  }))
                }
                step="0.5"
                type="number"
                value={state.feedIntervalHours}
              />
              <p className="text-xs text-muted-foreground mt-0.5">
                Time between scheduled feedings
              </p>
            </div>

            {isUnderweight && (
              <Alert className="py-3 border-accent">
                <TrendingUp className="h-4 w-4" />
                <AlertDescription className="text-xs space-y-2">
                  <div className="font-semibold">Weight Gain Recommended</div>
                  <div className="space-y-1">
                    <p>
                      <span className="font-medium">Current:</span>{' '}
                      {(state.baby.currentWeightOz / 16).toFixed(2)} lb
                    </p>
                    <p>
                      <span className="font-medium">Target:</span>{' '}
                      {(targetWeightOz / 16).toFixed(2)} lb
                    </p>
                    <p>
                      <span className="font-medium">Needs to gain:</span>{' '}
                      {weightGainAnalysis.deficitOz.toFixed(1)} oz
                    </p>
                  </div>
                  <div className="pt-2 border-t border-accent/30">
                    <p className="font-semibold mb-1">Feeding Plan:</p>
                    <p>
                      Add{' '}
                      <span className="font-bold text-accent-foreground">
                        {formatAmount(
                          weightGainAnalysis.additionalMlPerDay,
                          state.unitPref,
                        )}
                      </span>{' '}
                      per day
                    </p>
                    <p className="text-muted-foreground mt-1">
                      Targets below have been adjusted to help baby gain weight
                      safely over 7 days
                    </p>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {weightLossPercent > 10 && (
              <Alert className="py-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  Weight loss exceeds 10%. Consult your pediatrician
                  immediately.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Target Card using adjustedTarget */}
        {adjustedTarget && (
          <Card className="border-2 border-primary/30">
            {/* Supply Analysis and related sections */}
            <CardHeader className="pb-2">
              {supplyInfo && (
                <Alert
                  className={`mb-3 py-2 ${supplyInfo.status === 'insufficient' ? 'border-destructive/50 bg-destructive/10' : 'border-primary/50 bg-primary/10'}`}
                >
                  <AlertCircle
                    className={`h-4 w-4 ${supplyInfo.status === 'insufficient' ? 'text-destructive' : 'text-primary'}`}
                  />
                  <AlertDescription className="text-xs">
                    {supplyInfo.message}
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1">
                  <Button
                    className="h-8 w-8"
                    onClick={goToPreviousDay}
                    size="icon"
                    variant="ghost"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  {/* CHANGE: Make the date display clickable to open calendar drawer */}
                  <button
                    className="text-left hover:bg-muted/50 px-2 py-1 rounded-md transition-colors"
                    onClick={() => setCalendarDrawerOpen(true)}
                    type="button"
                  >
                    <CardTitle className="text-sm">
                      {formatDisplayDate(selectedDate)}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Day {selectedDateAgeDays}
                    </CardDescription>
                  </button>
                  <Button
                    className="h-8 w-8"
                    onClick={goToNextDay}
                    size="icon"
                    variant="ghost"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                <div className="text-right">
                  <div className={`text-lg font-bold ${getStatusColor()}`}>
                    {state.unitPref === 'ML'
                      ? `${totals.TOTAL.toFixed(0)}/${adjustedTarget.minMlPerDay.toFixed(0)}mL` // Use adjustedTarget
                      : `${mlToOz(totals.TOTAL).toFixed(1)}/${mlToOz(adjustedTarget.minMlPerDay).toFixed(1)}oz`}{' '}
                    {/* Use adjustedTarget */}
                  </div>
                  <div className="text-xs text-muted-foreground">Fed today</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {!isToday && (
                  <Button
                    className="h-8 text-xs flex-1 bg-transparent"
                    onClick={goToToday}
                    size="sm"
                    variant="outline"
                  >
                    Today
                  </Button>
                )}

                <Drawer
                  onOpenChange={setCaregiversDrawerOpen}
                  open={caregiversDrawerOpen}
                >
                  <DrawerTrigger asChild>
                    <Button
                      className="h-8 text-xs flex-1 bg-transparent"
                      size="sm"
                      variant="outline"
                    >
                      <UserPlus className="h-3.5 w-3.5 mr-1" />
                      Caregivers
                    </Button>
                  </DrawerTrigger>
                  <DrawerContent className="max-h-[85vh]">
                    <DrawerHeader>
                      <DrawerTitle>Manage Caregivers</DrawerTitle>
                      <DrawerDescription>
                        Add or remove people who feed the baby
                      </DrawerDescription>
                    </DrawerHeader>
                    <div className="px-4 py-4 space-y-4 overflow-y-auto max-h-[50vh]">
                      <div className="space-y-2">
                        {state.caregivers.map((caregiver) => (
                          <div
                            className="flex items-center justify-between p-2 border rounded-lg bg-muted/30"
                            key={caregiver}
                          >
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm font-medium">
                                {caregiver}
                              </span>
                            </div>
                            <Button
                              className="h-8 w-8 p-0"
                              onClick={() => removeCaregiver(caregiver)}
                              size="sm"
                              variant="ghost"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        ))}
                      </div>

                      <div className="pt-2 border-t">
                        <Label className="text-sm">Add New Caregiver</Label>
                        <div className="flex gap-2 mt-1.5">
                          <Input
                            className="flex-1"
                            onChange={(e) =>
                              setNewCaregiverName(e.target.value)
                            }
                            placeholder="Name (e.g., Jackie)"
                            value={newCaregiverName}
                          />
                          <Button onClick={addCaregiver}>
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    <DrawerFooter className="pt-4">
                      <DrawerClose asChild>
                        <Button variant="outline">Close</Button>
                      </DrawerClose>
                    </DrawerFooter>
                  </DrawerContent>
                </Drawer>

                <Drawer
                  onOpenChange={setAddFeedDrawerOpen}
                  open={addFeedDrawerOpen}
                >
                  <DrawerTrigger asChild>
                    <Button
                      className="h-8 text-xs flex-1"
                      size="sm"
                      variant="default"
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" />
                      Add Feed
                    </Button>
                  </DrawerTrigger>
                  <DrawerContent className="max-h-[90vh]">
                    <DrawerHeader>
                      <DrawerTitle>Add Feed</DrawerTitle>
                      <DrawerDescription>
                        Log a feeding session
                      </DrawerDescription>
                    </DrawerHeader>
                    <div className="px-4 py-4 space-y-4 overflow-y-auto max-h-[60vh]">
                      <div>
                        <Label className="text-sm">Time</Label>
                        <Input
                          className="mt-1.5"
                          onChange={(e) => setNewFeedTime(e.target.value)}
                          placeholder="Now"
                          type="time"
                          value={newFeedTime}
                        />
                      </div>
                      <div>
                        <Label className="text-sm">
                          Amount ({state.unitPref})
                        </Label>
                        <Input
                          className="mt-1.5"
                          onChange={(e) => setNewFeedAmount(e.target.value)}
                          placeholder="0"
                          step="0.1"
                          type="number"
                          value={newFeedAmount}
                        />
                      </div>
                      <div>
                        <Label className="text-sm">Source</Label>
                        <Select
                          onValueChange={(value: Source) =>
                            setNewFeedSource(value)
                          }
                          value={newFeedSource}
                        >
                          <SelectTrigger className="mt-1.5">
                            <SelectValue placeholder="Select source" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="DIRECT">
                              Direct (Breast)
                            </SelectItem>
                            <SelectItem value="PUMPED">Pumped</SelectItem>
                            <SelectItem value="DONOR">Donor</SelectItem>
                            <SelectItem value="FORMULA">Formula</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-sm">
                          Assigned To (Optional)
                        </Label>
                        <Select
                          onValueChange={setNewFeedAssignee}
                          value={newFeedAssignee}
                        >
                          <SelectTrigger className="mt-1.5">
                            <SelectValue placeholder="Select caregiver" />
                          </SelectTrigger>
                          <SelectContent>
                            {state.caregivers.map((caregiver) => (
                              <SelectItem key={caregiver} value={caregiver}>
                                {caregiver}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-sm">Or Enter Custom Name</Label>
                        <Input
                          className="mt-1.5"
                          onChange={(e) =>
                            setNewFeedCustomCaregiver(e.target.value)
                          }
                          placeholder="e.g., Jackie"
                          value={newFeedCustomCaregiver}
                        />
                      </div>
                    </div>
                    <DrawerFooter className="pt-4">
                      <Button onClick={addFeedFromDrawer}>Add Feed</Button>
                      <DrawerClose asChild>
                        <Button variant="outline">Cancel</Button>
                      </DrawerClose>
                    </DrawerFooter>
                  </DrawerContent>
                </Drawer>

                <Drawer
                  onOpenChange={setAddSupplyDrawerOpen}
                  open={addSupplyDrawerOpen}
                >
                  <DrawerTrigger asChild>
                    <Button
                      className="h-8 text-xs flex-1 bg-transparent"
                      size="sm"
                      variant="outline"
                    >
                      <Droplet className="h-3.5 w-3.5 mr-1" />
                      Add Supply
                    </Button>
                  </DrawerTrigger>
                  <DrawerContent className="max-h-[70vh]">
                    <DrawerHeader>
                      <DrawerTitle>Add Supply</DrawerTitle>
                      <DrawerDescription>Log milk supply</DrawerDescription>
                    </DrawerHeader>
                    <div className="px-4 py-4 space-y-4">
                      <div>
                        <Label className="text-sm">
                          Amount ({state.unitPref})
                        </Label>
                        <Input
                          className="mt-1.5"
                          onChange={(e) => setAddSupplyAmount(e.target.value)}
                          placeholder="0"
                          step="0.1"
                          type="number"
                          value={addSupplyAmount}
                        />
                      </div>
                      <div>
                        <Label className="text-sm">Source</Label>
                        <Select
                          onValueChange={(value: SupplySource) =>
                            setAddSupplySource(value)
                          }
                          value={addSupplySource}
                        >
                          <SelectTrigger className="mt-1.5">
                            <SelectValue placeholder="Select source" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="PUMPED">Pumped</SelectItem>
                            <SelectItem value="DONOR">Donor</SelectItem>
                            <SelectItem value="FORMULA">Formula</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DrawerFooter className="pt-4">
                      <Button onClick={addSupplyFromDrawer}>Add Supply</Button>
                      <DrawerClose asChild>
                        <Button variant="outline">Cancel</Button>
                      </DrawerClose>
                    </DrawerFooter>
                  </DrawerContent>
                </Drawer>
              </div>

              {/* CHANGE: Replace the supply badges section with supply analysis */}
              <div className="space-y-2 mt-3">
                {supplyAnalysis && (
                  <div className="p-3 bg-muted/30 rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold">
                        Supply Overview
                      </span>
                      <Drawer
                        onOpenChange={setSupplyHistoryDrawerOpen}
                        open={supplyHistoryDrawerOpen}
                      >
                        <DrawerTrigger asChild>
                          <Button
                            className="h-7 text-xs"
                            size="sm"
                            variant="ghost"
                          >
                            Manage
                          </Button>
                        </DrawerTrigger>
                        <DrawerContent className="max-h-[90vh]">
                          <DrawerHeader>
                            <DrawerTitle>Milk Supply Management</DrawerTitle>
                            <DrawerDescription>
                              Track inventory and view supply breakdown
                            </DrawerDescription>
                          </DrawerHeader>
                          <div className="px-4 py-4 space-y-4 overflow-y-auto max-h-[60vh]">
                            <div className="space-y-2">
                              <button
                                className="w-full p-3 bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors text-left"
                                onClick={() => setSelectedSupplyType('PUMPED')}
                                type="button"
                              >
                                <div className="flex items-center justify-between">
                                  <div>
                                    <div className="flex items-center gap-1.5 mb-1">
                                      <Droplet className="h-4 w-4 text-primary" />
                                      <span className="text-sm font-medium">
                                        Pumped Milk
                                      </span>
                                    </div>
                                    <div className="text-lg font-bold">
                                      {formatAmount(
                                        supplyAnalysis.breakdown.pumped,
                                        state.unitPref,
                                      )}
                                    </div>
                                  </div>
                                  <ChevronDown className="h-4 w-4 text-muted-foreground -rotate-90" />
                                </div>
                              </button>

                              <button
                                className="w-full p-3 bg-secondary/10 hover:bg-secondary/20 rounded-lg transition-colors text-left"
                                onClick={() => setSelectedSupplyType('DONOR')}
                                type="button"
                              >
                                <div className="flex items-center justify-between">
                                  <div>
                                    <div className="flex items-center gap-1.5 mb-1">
                                      <Droplet className="h-4 w-4 text-secondary" />
                                      <span className="text-sm font-medium">
                                        Donor Milk
                                      </span>
                                    </div>
                                    <div className="text-lg font-bold">
                                      {formatAmount(
                                        supplyAnalysis.breakdown.donor,
                                        state.unitPref,
                                      )}
                                    </div>
                                  </div>
                                  <ChevronDown className="h-4 w-4 text-muted-foreground -rotate-90" />
                                </div>
                              </button>

                              <button
                                className="w-full p-3 bg-accent/10 hover:bg-accent/20 rounded-lg transition-colors text-left"
                                onClick={() => setSelectedSupplyType('FORMULA')}
                                type="button"
                              >
                                <div className="flex items-center justify-between">
                                  <div>
                                    <div className="flex items-center gap-1.5 mb-1">
                                      <Droplet className="h-4 w-4 text-accent" />
                                      <span className="text-sm font-medium">
                                        Formula
                                      </span>
                                    </div>
                                    <div className="text-lg font-bold">
                                      {formatAmount(
                                        supplyAnalysis.breakdown.formula,
                                        state.unitPref,
                                      )}
                                    </div>
                                  </div>
                                  <ChevronDown className="h-4 w-4 text-muted-foreground -rotate-90" />
                                </div>
                              </button>
                            </div>

                            <div className="space-y-3 pt-3 border-t">
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-semibold">
                                  Supply Forecast (7 Days)
                                </p>
                                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                              </div>

                              <div className="h-[200px] w-full">
                                <ChartContainer
                                  className="h-full w-full"
                                  config={{
                                    demand: {
                                      color: 'hsl(var(--destructive))',
                                      label: 'Daily Demand',
                                    },
                                    supply: {
                                      color: 'hsl(var(--primary))',
                                      label: 'Supply',
                                    },
                                  }}
                                >
                                  <ResponsiveContainer
                                    height="100%"
                                    width="100%"
                                  >
                                    <AreaChart
                                      data={(() => {
                                        const chartData = [];
                                        for (let day = 0; day <= 7; day++) {
                                          const projectedSupply = Math.max(
                                            0,
                                            supplyAnalysis.totalRemaining +
                                              supplyAnalysis.netDailyChange *
                                                day,
                                          );
                                          chartData.push({
                                            day:
                                              day === 0
                                                ? 'Today'
                                                : `Day ${day}`,
                                            demand: Math.round(
                                              supplyAnalysis.dailyDemand,
                                            ),
                                            supply: Math.round(projectedSupply),
                                          });
                                        }
                                        return chartData;
                                      })()}
                                      margin={{
                                        bottom: 0,
                                        left: 0,
                                        right: 10,
                                        top: 10,
                                      }}
                                    >
                                      <defs>
                                        <linearGradient
                                          id="colorSupply"
                                          x1="0"
                                          x2="0"
                                          y1="0"
                                          y2="1"
                                        >
                                          <stop
                                            offset="5%"
                                            stopColor="hsl(var(--primary))"
                                            stopOpacity={0.3}
                                          />
                                          <stop
                                            offset="95%"
                                            stopColor="hsl(var(--primary))"
                                            stopOpacity={0}
                                          />
                                        </linearGradient>
                                      </defs>
                                      <CartesianGrid
                                        stroke="hsl(var(--border))"
                                        strokeDasharray="3 3"
                                      />
                                      <XAxis
                                        dataKey="day"
                                        tick={{
                                          fill: 'hsl(var(--muted-foreground))',
                                          fontSize: 10,
                                        }}
                                        tickLine={false}
                                      />
                                      <YAxis
                                        tick={{
                                          fill: 'hsl(var(--muted-foreground))',
                                          fontSize: 10,
                                        }}
                                        tickLine={false}
                                        width={35}
                                      />
                                      <ChartTooltip
                                        content={({ active, payload }) => {
                                          if (
                                            active &&
                                            payload &&
                                            payload.length
                                          ) {
                                            return (
                                              <div className="rounded-lg border bg-background p-2 shadow-sm">
                                                <div className="grid gap-1">
                                                  <div className="flex items-center justify-between gap-2">
                                                    <span className="text-xs text-muted-foreground">
                                                      {payload[0].payload.day}
                                                    </span>
                                                  </div>
                                                  <div className="flex items-center justify-between gap-2">
                                                    <div className="flex items-center gap-1">
                                                      <div className="h-2 w-2 rounded-full bg-primary" />
                                                      <span className="text-xs">
                                                        Supply
                                                      </span>
                                                    </div>
                                                    <span className="text-xs font-bold">
                                                      {formatAmount(
                                                        payload[0]
                                                          .value as number,
                                                        state.unitPref,
                                                      )}
                                                    </span>
                                                  </div>
                                                  <div className="flex items-center justify-between gap-2">
                                                    <div className="flex items-center gap-1">
                                                      <div className="h-2 w-2 rounded-full bg-destructive" />
                                                      <span className="text-xs">
                                                        Demand
                                                      </span>
                                                    </div>
                                                    <span className="text-xs font-bold">
                                                      {formatAmount(
                                                        payload[1]
                                                          ?.value as number,
                                                        state.unitPref,
                                                      )}
                                                    </span>
                                                  </div>
                                                </div>
                                              </div>
                                            );
                                          }
                                          return null;
                                        }}
                                      />
                                      <Area
                                        dataKey="supply"
                                        fill="url(#colorSupply)"
                                        stroke="hsl(var(--primary))"
                                        strokeWidth={2}
                                        type="monotone"
                                      />
                                      <Line
                                        dataKey="demand"
                                        dot={false}
                                        stroke="hsl(var(--destructive))"
                                        strokeDasharray="5 5"
                                        strokeWidth={2}
                                        type="monotone"
                                      />
                                    </AreaChart>
                                  </ResponsiveContainer>
                                </ChartContainer>
                              </div>

                              <div className="flex items-center gap-4 text-xs">
                                <div className="flex items-center gap-1.5">
                                  <div className="h-3 w-3 rounded-sm bg-primary" />
                                  <span className="text-muted-foreground">
                                    Projected Supply
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <div
                                    className="h-0.5 w-5 bg-destructive"
                                    style={{ borderTop: '2px dashed' }}
                                  />
                                  <span className="text-muted-foreground">
                                    Daily Demand
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Supply vs Demand Analysis */}
                            <div className="space-y-3 pt-3 border-t">
                              <div>
                                <p className="text-sm font-semibold mb-2">
                                  Supply Chain Analysis
                                </p>
                              </div>

                              <div className="grid grid-cols-2 gap-2">
                                <div className="p-2.5 bg-muted/50 rounded-lg">
                                  <p className="text-xs text-muted-foreground mb-0.5">
                                    Daily Demand
                                  </p>
                                  <p className="text-sm font-bold">
                                    {formatAmount(
                                      supplyAnalysis.dailyDemand,
                                      state.unitPref,
                                    )}
                                  </p>
                                </div>
                                <div className="p-2.5 bg-muted/50 rounded-lg">
                                  <p className="text-xs text-muted-foreground mb-0.5">
                                    Daily Production
                                  </p>
                                  <p className="text-sm font-bold text-primary">
                                    {formatAmount(
                                      supplyAnalysis.dailyProduction,
                                      state.unitPref,
                                    )}
                                  </p>
                                </div>
                              </div>

                              <div className="p-3 bg-muted/50 rounded-lg">
                                <div className="flex items-center justify-between mb-2">
                                  <p className="text-xs text-muted-foreground">
                                    Net Daily Change
                                  </p>
                                  <p
                                    className={`text-sm font-bold ${
                                      supplyAnalysis.netDailyChange >= 0
                                        ? 'text-green-500'
                                        : 'text-destructive'
                                    }`}
                                  >
                                    {supplyAnalysis.netDailyChange >= 0
                                      ? '+'
                                      : ''}
                                    {formatAmount(
                                      Math.abs(supplyAnalysis.netDailyChange),
                                      state.unitPref,
                                    )}
                                  </p>
                                </div>
                                {supplyAnalysis.netDailyChange < 0 ? (
                                  <p className="text-xs text-destructive">
                                    ⚠️ Consuming more than producing. Consider
                                    increasing pumping or adding supply.
                                  </p>
                                ) : (
                                  <p className="text-xs text-green-600">
                                    ✓ Production exceeds demand. Building
                                    supply.
                                  </p>
                                )}
                              </div>

                              <div className="p-3 bg-primary/10 rounded-lg">
                                <div className="flex items-center justify-between mb-1">
                                  <p className="text-xs text-muted-foreground">
                                    Days of Supply Remaining
                                  </p>
                                  <p className="text-lg font-bold">
                                    {supplyAnalysis.daysRemaining.toFixed(1)}{' '}
                                    days
                                  </p>
                                </div>
                                <div className="w-full bg-muted/50 rounded-full h-2 mt-2">
                                  <div
                                    className={`h-2 rounded-full transition-all ${
                                      supplyAnalysis.daysRemaining >= 3
                                        ? 'bg-green-500'
                                        : supplyAnalysis.daysRemaining >= 1
                                          ? 'bg-yellow-500'
                                          : 'bg-destructive'
                                    }`}
                                    style={{
                                      width: `${Math.min(100, (supplyAnalysis.daysRemaining / 5) * 100)}%`,
                                    }}
                                  />
                                </div>
                              </div>

                              <div className="p-3 bg-secondary/10 rounded-lg">
                                <p className="text-xs text-muted-foreground mb-1">
                                  Projected Supply (3 days)
                                </p>
                                <p
                                  className={`text-lg font-bold ${
                                    supplyAnalysis.projectedIn3Days >
                                    supplyAnalysis.totalRemaining
                                      ? 'text-green-500'
                                      : 'text-destructive'
                                  }`}
                                >
                                  {formatAmount(
                                    Math.max(
                                      0,
                                      supplyAnalysis.projectedIn3Days,
                                    ),
                                    state.unitPref,
                                  )}
                                </p>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {supplyAnalysis.projectedIn3Days >
                                  supplyAnalysis.totalRemaining
                                    ? 'Supply will increase'
                                    : 'Supply will decrease'}
                                </p>
                              </div>

                              {supplyAnalysis.daysUntilRunOut !== null && (
                                <div className="p-3 bg-destructive/10 rounded-lg">
                                  <p className="text-xs text-muted-foreground mb-1">
                                    Inventory Runs Out
                                  </p>
                                  <p className="text-lg font-bold text-destructive">
                                    In{' '}
                                    {supplyAnalysis.daysUntilRunOut.toFixed(1)}{' '}
                                    days
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                          <DrawerFooter className="pt-4">
                            <DrawerClose asChild>
                              <Button variant="outline">Close</Button>
                            </DrawerClose>
                          </DrawerFooter>
                        </DrawerContent>
                      </Drawer>
                    </div>

                    {/* Compact supply display */}
                    <div className="flex gap-2 text-xs">
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">
                            Total Supply:
                          </span>
                          <span className="font-semibold">
                            {formatAmount(
                              supplyAnalysis.totalRemaining,
                              state.unitPref,
                            )}
                          </span>
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-muted-foreground">
                            Days Left:
                          </span>
                          <span
                            className={`font-semibold ${
                              supplyAnalysis.daysRemaining >= 3
                                ? 'text-green-500'
                                : supplyAnalysis.daysRemaining >= 1
                                  ? 'text-yellow-500'
                                  : 'text-destructive'
                            }`}
                          >
                            {supplyAnalysis.daysRemaining.toFixed(1)}d
                          </span>
                        </div>
                      </div>
                      <div className="flex-1 border-l pl-2">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">
                            Production:
                          </span>
                          <span className="font-semibold text-primary">
                            {formatAmount(
                              supplyAnalysis.dailyProduction,
                              state.unitPref,
                            )}
                            /d
                          </span>
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-muted-foreground">
                            Net Change:
                          </span>
                          <span
                            className={`font-semibold ${
                              supplyAnalysis.netDailyChange >= 0
                                ? 'text-green-500'
                                : 'text-destructive'
                            }`}
                          >
                            {supplyAnalysis.netDailyChange >= 0 ? '+' : ''}
                            {formatAmount(
                              Math.abs(supplyAnalysis.netDailyChange),
                              state.unitPref,
                            )}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Visual progress bar */}
                    <div>
                      <div className="w-full bg-muted/50 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full transition-all ${
                            supplyAnalysis.daysRemaining >= 3
                              ? 'bg-green-500'
                              : supplyAnalysis.daysRemaining >= 1
                                ? 'bg-yellow-500'
                                : 'bg-destructive'
                          }`}
                          style={{
                            width: `${Math.min(100, (supplyAnalysis.daysRemaining / 5) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="text-center p-2.5 bg-primary/10 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-0.5">
                    Per Feed
                  </p>
                  <p className="text-xs font-bold">
                    {formatAmount(adjustedTarget.minMlPerFeed, state.unitPref)}{' '}
                    - {/* Use adjustedTarget */}
                    {formatAmount(adjustedTarget.maxMlPerFeed, state.unitPref)}{' '}
                    {/* Use adjustedTarget */}
                  </p>
                </div>
                <div className="text-center p-2.5 bg-primary/10 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-0.5">
                    Per Day
                  </p>
                  <p className="text-xs font-bold">
                    {formatAmount(adjustedTarget.minMlPerDay, state.unitPref)} -{' '}
                    {/* Use adjustedTarget */}
                    {formatAmount(adjustedTarget.maxMlPerDay, state.unitPref)}{' '}
                    {/* Use adjustedTarget */}
                  </p>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t">
                <Collapsible onOpenChange={setLogOpen} open={logOpen}>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold">Feed Log</span>
                    <div className="flex gap-2">
                      <Drawer
                        onOpenChange={setFilterDrawerOpen}
                        open={filterDrawerOpen}
                      >
                        <DrawerTrigger asChild>
                          <Button
                            className={`h-8 w-8 p-0 ${filterAssignee ? 'text-primary' : ''}`}
                            size="sm"
                            variant="ghost"
                          >
                            <svg
                              fill="none"
                              height="16"
                              stroke="currentColor"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              viewBox="0 0 24 24"
                              width="16"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <title>Filter Icon</title>
                              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                            </svg>
                          </Button>
                        </DrawerTrigger>
                        <DrawerContent className="max-h-[80vh]">
                          <DrawerHeader>
                            <DrawerTitle>Filter Feed Log</DrawerTitle>
                            <DrawerDescription>
                              Show feeds by specific caregiver
                            </DrawerDescription>
                          </DrawerHeader>
                          <div className="px-4 py-4 space-y-2 overflow-y-auto max-h-[50vh]">
                            <Button
                              className="w-full justify-start"
                              onClick={() => setFilterAssignee(null)}
                              variant={
                                filterAssignee === null ? 'default' : 'outline'
                              }
                            >
                              All Feeds
                            </Button>
                            {state.caregivers.map((caregiver) => (
                              <Button
                                className="w-full justify-start"
                                key={caregiver}
                                onClick={() => setFilterAssignee(caregiver)}
                                variant={
                                  filterAssignee === caregiver
                                    ? 'default'
                                    : 'outline'
                                }
                              >
                                <User className="h-4 w-4 mr-2" />
                                {caregiver}
                              </Button>
                            ))}
                            {Array.from(
                              new Set(
                                allPastFeeds
                                  .map((f) => f.assignee)
                                  .filter(
                                    (a) => a && !state.caregivers.includes(a),
                                  ),
                              ),
                            ).map((assignee) => (
                              <Button
                                className="w-full justify-start"
                                key={assignee}
                                onClick={() => setFilterAssignee(assignee)}
                                variant={
                                  filterAssignee === assignee
                                    ? 'default'
                                    : 'outline'
                                }
                              >
                                <User className="h-4 w-4 mr-2" />
                                {assignee}
                              </Button>
                            ))}
                          </div>
                          <DrawerFooter className="pt-4">
                            <DrawerClose asChild>
                              <Button variant="outline">Close</Button>
                            </DrawerClose>
                          </DrawerFooter>
                        </DrawerContent>
                      </Drawer>

                      <CollapsibleTrigger asChild>
                        <Button
                          className="h-8 w-8 p-0"
                          size="sm"
                          variant="ghost"
                        >
                          <ChevronDown
                            className={`h-4 w-4 transition-transform ${logOpen ? 'rotate-180' : ''}`}
                          />
                        </Button>
                      </CollapsibleTrigger>
                    </div>
                  </div>

                  <CollapsibleContent className="space-y-2 mt-2">
                    {filterAssignee && (
                      <div className="flex items-center gap-2 p-2 bg-primary/10 rounded-lg mb-2">
                        <User className="h-3.5 w-3.5 text-primary" />
                        <span className="text-xs font-medium">
                          Showing feeds by {filterAssignee}
                        </span>
                        <Button
                          className="ml-auto h-6 px-2 text-xs"
                          onClick={() => setFilterAssignee(null)}
                          size="sm"
                          variant="ghost"
                        >
                          Clear
                        </Button>
                      </div>
                    )}

                    {pastFeeds.length > 0 ? (
                      <div className="space-y-2">
                        {pastFeeds.map((feed) => (
                          <div
                            className="p-2 border rounded-lg flex items-center justify-between bg-muted/30"
                            key={feed.id}
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-baseline gap-2">
                                <span className="text-sm font-semibold">
                                  {new Date(feed.isoTime).toLocaleTimeString(
                                    [],
                                    {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    },
                                  )}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {(() => {
                                    const diffMs =
                                      Date.now() -
                                      new Date(feed.isoTime).getTime();
                                    const mins = Math.floor(
                                      diffMs / (1000 * 60),
                                    );
                                    const hours = Math.floor(mins / 60);
                                    if (hours > 0) return `${hours}h ago`;
                                    return `${mins}m ago`;
                                  })()}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                <span className="text-sm font-medium">
                                  {formatAmount(feed.amountMl, state.unitPref)}
                                </span>
                                <span className="text-xs px-1.5 py-0.5 rounded bg-primary/20 text-primary capitalize">
                                  {feed.source.toLowerCase()}
                                </span>
                                {feed.assignee && (
                                  <span className="text-xs px-1.5 py-0.5 rounded bg-secondary/20 text-secondary flex items-center gap-1">
                                    <User className="h-3 w-3" />
                                    {feed.assignee}
                                  </span>
                                )}
                              </div>
                            </div>
                            <Button
                              className="ml-2 h-8 w-8 p-0 shrink-0"
                              onClick={() => deleteFeed(feed.id)}
                              size="sm"
                              variant="ghost"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground text-center py-4">
                        No feeds logged yet
                      </p>
                    )}

                    <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Pumped:</span>
                        <span className="font-medium">
                          {formatAmount(totals.PUMPED, state.unitPref)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Donor:</span>
                        <span className="font-medium">
                          {formatAmount(totals.DONOR, state.unitPref)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Formula:</span>
                        <span className="font-medium">
                          {formatAmount(totals.FORMULA, state.unitPref)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Direct:</span>
                        <span className="font-medium">
                          {formatAmount(totals.DIRECT, state.unitPref)}
                        </span>
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                {nextFeedInfo() && (
                  <div
                    className={`p-2.5 rounded-lg mt-2 ${
                      nextFeedInfo().status === 'overdue'
                        ? 'bg-destructive/10'
                        : 'bg-secondary/10'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <Clock
                        className={`h-4 w-4 mt-0.5 shrink-0 ${
                          nextFeedInfo().status === 'overdue'
                            ? 'text-destructive'
                            : 'text-secondary'
                        }`}
                      />
                      <div className="flex-1 space-y-0.5 min-w-0">
                        <div className="flex items-baseline gap-2">
                          <span className="text-sm font-semibold">
                            {nextFeedInfo().absoluteTime}
                          </span>
                          <span
                            className={`text-xs ${
                              nextFeedInfo().status === 'overdue'
                                ? 'text-destructive font-semibold'
                                : 'text-muted-foreground'
                            }`}
                          >
                            {nextFeedInfo().relativeTime}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {nextFeedInfo().amount} needed
                        </div>
                        {nextFeedAssignee() && (
                          <div className="text-xs flex items-center gap-1 mt-1">
                            <User className="h-3 w-3 text-muted-foreground" />
                            <span className="font-medium">
                              {nextFeedAssignee()}
                            </span>
                          </div>
                        )}

                        <div className="flex gap-2 mt-2">
                          <Button
                            className="h-7 text-xs flex-1"
                            onClick={openDoneDrawer}
                            size="sm"
                          >
                            Done
                          </Button>
                          <Drawer
                            onOpenChange={setPostponeDrawerOpen}
                            open={postponeDrawerOpen}
                          >
                            <DrawerTrigger asChild>
                              <Button
                                className="h-7 text-xs flex-1 bg-transparent"
                                size="sm"
                                variant="outline"
                              >
                                Postpone
                              </Button>
                            </DrawerTrigger>
                            <DrawerContent className="max-h-[70vh]">
                              <DrawerHeader>
                                <DrawerTitle>Postpone Feed</DrawerTitle>
                                <DrawerDescription>
                                  How long do you want to delay the next
                                  feeding?
                                </DrawerDescription>
                              </DrawerHeader>
                              <div className="px-4 py-4 space-y-3">
                                <div className="grid grid-cols-2 gap-2">
                                  <Button
                                    className="h-12"
                                    onClick={() => setPostponeMinutes('15')}
                                    variant={
                                      postponeMinutes === '15'
                                        ? 'default'
                                        : 'outline'
                                    }
                                  >
                                    15 min
                                  </Button>
                                  <Button
                                    className="h-12"
                                    onClick={() => setPostponeMinutes('30')}
                                    variant={
                                      postponeMinutes === '30'
                                        ? 'default'
                                        : 'outline'
                                    }
                                  >
                                    30 min
                                  </Button>
                                  <Button
                                    className="h-12"
                                    onClick={() => setPostponeMinutes('45')}
                                    variant={
                                      postponeMinutes === '45'
                                        ? 'default'
                                        : 'outline'
                                    }
                                  >
                                    45 min
                                  </Button>
                                  <Button
                                    className="h-12"
                                    onClick={() => setPostponeMinutes('60')}
                                    variant={
                                      postponeMinutes === '60'
                                        ? 'default'
                                        : 'outline'
                                    }
                                  >
                                    1 hour
                                  </Button>
                                </div>
                                <div>
                                  <Label className="text-sm">
                                    Custom (minutes)
                                  </Label>
                                  <Input
                                    className="mt-1.5"
                                    onChange={(e) =>
                                      setPostponeMinutes(e.target.value)
                                    }
                                    placeholder="30"
                                    type="number"
                                    value={postponeMinutes}
                                  />
                                </div>
                              </div>
                              <DrawerFooter className="pt-4">
                                <Button onClick={handlePostpone}>
                                  Postpone Feed
                                </Button>
                                <DrawerClose asChild>
                                  <Button variant="outline">Cancel</Button>
                                </DrawerClose>
                              </DrawerFooter>
                            </DrawerContent>
                          </Drawer>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Scheduled feeds accordion within the same card */}
                {adjustedTarget &&
                  futureFeeds.length > 0 && ( // Use adjustedTarget
                    <Collapsible className="mt-3 pt-3 border-t">
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="text-sm font-semibold">
                            Scheduled Feeds
                          </span>
                          <p className="text-xs text-muted-foreground">
                            Upcoming feeds for today
                          </p>
                        </div>
                        <CollapsibleTrigger asChild>
                          <Button
                            className="h-8 w-8 p-0"
                            size="sm"
                            variant="ghost"
                          >
                            <ChevronDown className="h-4 w-4" />
                          </Button>
                        </CollapsibleTrigger>
                      </div>

                      <CollapsibleContent className="space-y-2 mt-3">
                        {futureFeeds.map((feed) => {
                          const assignedFeed = todayFeeds.find(
                            (f) =>
                              f.isScheduled &&
                              new Date(f.isoTime).getTime() ===
                                new Date(feed.isoTime).getTime(),
                          );
                          const displayFeed = assignedFeed || feed;

                          return (
                            <div
                              className="p-2 border border-dashed rounded-lg flex items-center justify-between bg-muted/10"
                              key={feed.id}
                            >
                              <div className="flex-1 min-w-0">
                                <div className="flex items-baseline gap-2">
                                  <span className="text-sm font-semibold">
                                    {new Date(feed.isoTime).toLocaleTimeString(
                                      [],
                                      {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                      },
                                    )}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {(() => {
                                      const diffMs =
                                        new Date(feed.isoTime).getTime() -
                                        Date.now();
                                      const mins = Math.floor(
                                        diffMs / (1000 * 60),
                                      );
                                      const hours = Math.floor(mins / 60);
                                      const remainingMins = mins % 60;
                                      if (hours > 0)
                                        return `in ${hours}h ${remainingMins}m`;
                                      return `in ${mins}m`;
                                    })()}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                  <span className="text-sm font-medium">
                                    {formatAmount(
                                      feed.amountMl,
                                      state.unitPref,
                                    )}
                                  </span>
                                  {displayFeed.assignee && (
                                    <span className="text-xs px-1.5 py-0.5 rounded bg-secondary/20 text-secondary flex items-center gap-1">
                                      <User className="h-3 w-3" />
                                      {displayFeed.assignee}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <Button
                                className="ml-2 h-8 text-xs bg-transparent"
                                onClick={() => {
                                  setSelectedFeedId(feed.id);
                                  setAssignDrawerOpen(true);
                                }}
                                size="sm"
                                variant="outline"
                              >
                                {displayFeed.assignee ? 'Change' : 'Assign'}
                              </Button>
                            </div>
                          );
                        })}
                      </CollapsibleContent>
                    </Collapsible>
                  )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            className="flex-1 bg-transparent h-10 text-xs"
            onClick={exportCSV}
            variant="outline"
          >
            <Download className="h-4 w-4 mr-1.5" />
            Export
          </Button>
          <Button
            className="flex-1 bg-transparent h-10 text-xs"
            onClick={() =>
              setState((prev) => ({ ...prev, targets: defaultTargets }))
            }
            variant="outline"
          >
            <RotateCcw className="h-4 w-4 mr-1.5" />
            Reset
          </Button>
          <Button
            className="flex-1 h-10 text-xs"
            onClick={clearAllData}
            variant="destructive"
          >
            <Trash2 className="h-4 w-4 mr-1.5" />
            Clear
          </Button>
        </div>
      </div>
      {/* CHANGE: Add calendar drawer at the end of the component before closing tags */}
      <Drawer onOpenChange={setCalendarDrawerOpen} open={calendarDrawerOpen}>
        <DrawerContent className="max-h-[80vh]">
          <DrawerHeader>
            <DrawerTitle>Select Date</DrawerTitle>
            <DrawerDescription>
              Choose a date to view feeding history
            </DrawerDescription>
          </DrawerHeader>
          <div className="p-6 overflow-y-auto">
            <div className="grid grid-cols-7 gap-2 mb-4">
              <div className="text-center text-xs font-medium text-muted-foreground">
                Sun
              </div>
              <div className="text-center text-xs font-medium text-muted-foreground">
                Mon
              </div>
              <div className="text-center text-xs font-medium text-muted-foreground">
                Tue
              </div>
              <div className="text-center text-xs font-medium text-muted-foreground">
                Wed
              </div>
              <div className="text-center text-xs font-medium text-muted-foreground">
                Thu
              </div>
              <div className="text-center text-xs font-medium text-muted-foreground">
                Fri
              </div>
              <div className="text-center text-xs font-medium text-muted-foreground">
                Sat
              </div>
            </div>

            {(() => {
              const year = selectedDate.getFullYear();
              const month = selectedDate.getMonth();
              const firstDay = new Date(year, month, 1);
              const lastDay = new Date(year, month + 1, 0);
              const daysInMonth = lastDay.getDate();
              const startingDayOfWeek = firstDay.getDay();

              const days = [];

              // Empty cells for days before month starts
              for (let i = 0; i < startingDayOfWeek; i++) {
                days.push(<div key={`empty-${i}`} />);
              }

              // Days of the month
              for (let day = 1; day <= daysInMonth; day++) {
                const date = new Date(year, month, day);
                const isSelected =
                  formatDateKey(date) === formatDateKey(selectedDate);
                const isCurrentDay =
                  formatDateKey(date) === formatDateKey(new Date());

                days.push(
                  <button
                    className={`
                      h-10 rounded-md text-sm font-medium transition-colors
                      ${
                        isSelected
                          ? 'bg-primary text-primary-foreground'
                          : isCurrentDay
                            ? 'bg-accent text-accent-foreground'
                            : 'hover:bg-muted'
                      }
                    `}
                    key={day}
                    onClick={() => {
                      setSelectedDate(date);
                      setCalendarDrawerOpen(false);
                    }}
                    type="button"
                  >
                    {day}
                  </button>,
                );
              }

              return <div className="grid grid-cols-7 gap-2">{days}</div>;
            })()}

            <div className="mt-6 flex gap-2">
              <Button
                className="flex-1 bg-transparent"
                onClick={() => {
                  const newDate = new Date(selectedDate);
                  newDate.setMonth(newDate.getMonth() - 1);
                  setSelectedDate(newDate);
                }}
                variant="outline"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous Month
              </Button>
              <Button
                className="flex-1 bg-transparent"
                onClick={() => {
                  const newDate = new Date(selectedDate);
                  newDate.setMonth(newDate.getMonth() + 1);
                  setSelectedDate(newDate);
                }}
                variant="outline"
              >
                Next Month
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>

            <Button
              className="w-full mt-3"
              onClick={() => {
                setSelectedDate(new Date());
                setCalendarDrawerOpen(false);
              }}
              variant="secondary"
            >
              Today
            </Button>
          </div>
        </DrawerContent>
      </Drawer>
      <Drawer onOpenChange={setAssignDrawerOpen} open={assignDrawerOpen}>
        <DrawerContent className="max-h-[75vh]">
          <DrawerHeader>
            <DrawerTitle>Assign Feed</DrawerTitle>
            <DrawerDescription>
              Choose who will handle this feeding
            </DrawerDescription>
          </DrawerHeader>
          <div className="px-4 py-4 space-y-4 overflow-y-auto max-h-[45vh]">
            <div>
              <Label className="text-sm mb-2 block">Select Caregiver</Label>
              <div className="grid grid-cols-2 gap-2">
                {state.caregivers.map((caregiver) => (
                  <Button
                    className="h-16 flex flex-col items-center justify-center"
                    key={caregiver}
                    onClick={() => {
                      setSelectedAssignee(caregiver);
                      setCustomCaregiverName(''); // Clear custom name when selecting existing
                    }}
                    variant={
                      selectedAssignee === caregiver ? 'default' : 'outline'
                    }
                  >
                    <User className="h-4 w-4 mb-1" />
                    <span className="text-xs">{caregiver}</span>
                  </Button>
                ))}
              </div>
            </div>
            <div className="pt-2 border-t">
              <Label className="text-sm">Or Enter Custom Name</Label>
              <Input
                className="mt-1.5"
                onChange={(e) => {
                  setCustomCaregiverName(e.target.value);
                  setSelectedAssignee(''); // Clear selected when typing custom
                }}
                placeholder="e.g., Jackie"
                value={customCaregiverName}
              />
            </div>
          </div>
          <DrawerFooter className="pt-4">
            <Button
              disabled={!selectedAssignee && !customCaregiverName.trim()}
              onClick={assignFeed}
            >
              Assign Feed
            </Button>
            <DrawerClose asChild>
              <Button variant="outline">Cancel</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
      {/* CHANGE: Update the individual supply type drawer to include pump forecast */}
      <Drawer
        onOpenChange={(open) => {
          if (!open) setSelectedSupplyType(null);
        }}
        open={selectedSupplyType !== null && !supplyHistoryDrawerOpen}
      >
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader>
            <DrawerTitle>
              {selectedSupplyType
                ? selectedSupplyType.charAt(0) +
                  selectedSupplyType.slice(1).toLowerCase()
                : ''}{' '}
              Milk
            </DrawerTitle>
            <DrawerDescription>
              Current inventory and quick add
            </DrawerDescription>
          </DrawerHeader>
          <div className="px-4 py-4 space-y-4 overflow-y-auto max-h-[60vh]">
            <div className="p-4 bg-muted/50 rounded-lg text-center">
              <p className="text-sm text-muted-foreground mb-1">
                Current Inventory
              </p>
              <p className="text-2xl font-bold">
                {selectedSupplyType &&
                  formatAmount(
                    state.supply[
                      `${selectedSupplyType.toLowerCase()}Ml` as keyof SupplyInventory
                    ],
                    state.unitPref,
                  )}
              </p>
            </div>

            {selectedSupplyType === 'PUMPED' && (
              <div className="space-y-3 pt-3 border-t">
                <div>
                  <p className="text-sm font-semibold mb-2">Pumping Forecast</p>
                  <p className="text-xs text-muted-foreground mb-3">
                    Set your daily pumping schedule
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Pumps/day</Label>
                    <Input
                      className="mt-1.5 h-9 text-sm"
                      onChange={(e) =>
                        setState((prev) => ({
                          ...prev,
                          pumpsPerDay: Number.parseFloat(e.target.value) || 0,
                        }))
                      }
                      type="number"
                      value={state.pumpsPerDay}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">{state.unitPref}/pump</Label>
                    <Input
                      className="mt-1.5 h-9 text-sm"
                      onChange={(e) => {
                        const value = Number.parseFloat(e.target.value) || 0;
                        setState((prev) => ({
                          ...prev,
                          mlPerPump:
                            state.unitPref === 'ML' ? value : ozToMl(value),
                        }));
                      }}
                      type="number"
                      value={
                        state.unitPref === 'ML'
                          ? state.mlPerPump
                          : mlToOz(state.mlPerPump).toFixed(1)
                      }
                    />
                  </div>
                </div>
                <div className="flex justify-between text-sm p-2.5 bg-primary/10 rounded-lg">
                  <span className="text-xs text-muted-foreground">
                    Projected daily:
                  </span>
                  <span className="font-semibold text-sm">
                    {formatAmount(
                      state.pumpsPerDay * state.mlPerPump,
                      state.unitPref,
                    )}
                  </span>
                </div>
              </div>
            )}

            <div className="pt-3 border-t">
              <Label className="text-sm">Custom Amount</Label>
              <div className="flex gap-2 mt-1.5">
                <Input
                  className="flex-1"
                  onChange={(e) => setAddSupplyAmount(e.target.value)}
                  placeholder={`Amount in ${state.unitPref}`}
                  step="0.1"
                  type="number"
                  value={addSupplyAmount}
                />
                <Button
                  onClick={() => {
                    const amount = Number.parseFloat(addSupplyAmount);
                    if (
                      !Number.isNaN(amount) &&
                      amount > 0 &&
                      selectedSupplyType
                    ) {
                      quickAddSupply(selectedSupplyType, amount);
                      setAddSupplyAmount('');
                    }
                  }}
                >
                  Add
                </Button>
              </div>
            </div>
          </div>
          <DrawerFooter className="pt-4">
            <DrawerClose asChild>
              <Button variant="outline">Close</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
      <Drawer onOpenChange={setDoneDrawerOpen} open={doneDrawerOpen}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader>
            <DrawerTitle>Confirm Feed</DrawerTitle>
            <DrawerDescription>
              Review and adjust the feed details
            </DrawerDescription>
          </DrawerHeader>
          <div className="px-4 py-4 space-y-4 overflow-y-auto max-h-[60vh]">
            <div>
              <Label className="text-sm">Time</Label>
              <Input
                className="mt-1.5"
                onChange={(e) => setDoneTime(e.target.value)}
                type="time"
                value={doneTime}
              />
            </div>
            <div>
              <Label className="text-sm">Amount ({state.unitPref})</Label>
              <Input
                className="mt-1.5"
                onChange={(e) => setDoneAmount(e.target.value)}
                step="0.1"
                type="number"
                value={doneAmount}
              />
            </div>
            <div>
              <Label className="text-sm">Source</Label>
              <Select
                onValueChange={(value: Source) => setDoneSource(value)}
                value={doneSource}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Select source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DIRECT">Direct (Breast)</SelectItem>
                  <SelectItem value="PUMPED">Pumped</SelectItem>
                  <SelectItem value="DONOR">Donor</SelectItem>
                  <SelectItem value="FORMULA">Formula</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm">Fed By (Optional)</Label>
              <Select onValueChange={setDoneAssignee} value={doneAssignee}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Select caregiver" />
                </SelectTrigger>
                <SelectContent>
                  {state.caregivers.map((caregiver) => (
                    <SelectItem key={caregiver} value={caregiver}>
                      {caregiver}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm">Or Enter Custom Name</Label>
              <Input
                className="mt-1.5"
                onChange={(e) => setDoneCustomCaregiver(e.target.value)}
                placeholder="e.g., Jackie"
                value={doneCustomCaregiver}
              />
            </div>
          </div>
          <DrawerFooter className="pt-4">
            <Button onClick={confirmFeedDone}>Confirm Feed</Button>
            <DrawerClose asChild>
              <Button variant="outline">Cancel</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
