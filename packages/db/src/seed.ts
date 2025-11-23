import { createId } from '@nugget/id';
import { addDays, addHours, addMinutes, subDays } from 'date-fns';

import { db } from './client';
import type {
  NewActivity,
  NewGrowthRecord,
  NewMedicalRecord,
  NewMilestone,
  NewSupplyTransaction,
} from './schema';
import {
  Activities,
  Babies,
  CelebrationMemories,
  Families,
  FamilyMembers,
  GrowthRecords,
  MedicalRecords,
  Milestones,
  ShortUrls,
  SupplyInventory,
  SupplyTransactions,
  Users,
} from './schema';

// ============================================================================
// Constants
// ============================================================================

const userId = 'user_35PcqfvekNupJOOpWltzXmw1hr2';
const orgId = 'org_35Uth7fkh3ORQVmRQTZTHtlaWbM';
const orgName = "Riley's Family";
const stripeCustomerId = 'cus_TQQq400JNvigi7'; // Updated from find-stripe-customer script
const stripeSubscriptionId = 'sub_1RsJCH4hM6DbRRtOGcENjqIO'; // TODO: Update with actual subscription if available

// ============================================================================
// Helper Functions - Random Data Generation
// ============================================================================

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function randomChoice<T>(array: readonly T[]): T {
  const index = Math.floor(Math.random() * array.length);
  return array[index] as T;
}

function randomBoolean(probability = 0.5): boolean {
  return Math.random() < probability;
}

// ============================================================================
// Helper Functions - Time Generation
// ============================================================================

/**
 * Generate a random time on a specific day
 */
function randomTimeOnDay(baseDate: Date, hourMin = 0, hourMax = 23): Date {
  const hour = randomInt(hourMin, hourMax);
  const minute = randomInt(0, 59);
  return addMinutes(addHours(baseDate, hour), minute);
}

/**
 * Generate feeding times based on age-appropriate intervals
 */
function generateFeedingTimes(
  baseDate: Date,
  ageInDays: number,
  count: number,
): Date[] {
  const times: Date[] = [];
  let currentTime = addHours(baseDate, 6); // Start at 6 AM

  // Determine feeding interval based on age
  const intervalHours =
    ageInDays < 14 ? 2.5 : ageInDays < 30 ? 3 : ageInDays < 90 ? 3.5 : 4;

  for (let i = 0; i < count; i++) {
    // Add some randomness to intervals (±30 min)
    const variation = randomInt(-30, 30);
    currentTime = addMinutes(currentTime, variation);
    times.push(new Date(currentTime));

    // Move to next feeding time
    currentTime = addHours(currentTime, intervalHours);
  }

  return times;
}

/**
 * Generate sleep times (naps and night sleep)
 */
function generateSleepTimes(
  baseDate: Date,
  ageInDays: number,
): Array<{ startTime: Date; duration: number; type: 'nap' | 'night' }> {
  const sleeps: Array<{
    startTime: Date;
    duration: number;
    type: 'nap' | 'night';
  }> = [];

  // Night sleep (longer duration)
  const nightStart = addHours(baseDate, 19 + randomInt(-2, 2)); // ~7 PM ±2 hours
  const nightDuration =
    ageInDays < 14
      ? randomInt(120, 180) // 2-3 hours for newborns
      : ageInDays < 90
        ? randomInt(180, 360) // 3-6 hours
        : randomInt(360, 540); // 6-9 hours
  sleeps.push({
    duration: nightDuration,
    startTime: nightStart,
    type: 'night',
  });

  // Naps during the day
  const napCount =
    ageInDays < 14
      ? randomInt(5, 7)
      : ageInDays < 90
        ? randomInt(3, 5)
        : randomInt(2, 3);

  for (let i = 0; i < napCount; i++) {
    const napStart = addHours(baseDate, 8 + i * 2 + randomInt(-1, 1));
    const napDuration =
      ageInDays < 14
        ? randomInt(30, 90)
        : ageInDays < 90
          ? randomInt(45, 120)
          : randomInt(60, 150);
    sleeps.push({ duration: napDuration, startTime: napStart, type: 'nap' });
  }

  return sleeps;
}

// ============================================================================
// Activity Generators
// ============================================================================

/**
 * Generate sleep activities for a baby over a period
 */
function generateSleepActivities(
  babyId: string,
  familyId: string,
  birthDate: Date,
  daysToGenerate: number,
  userIds: string[],
): NewActivity[] {
  const activities: NewActivity[] = [];
  const qualities = ['peaceful', 'restless', 'fussy', 'crying'] as const;
  const locations = [
    'crib',
    'bassinet',
    'bed',
    'car_seat',
    'stroller',
    'arms',
    'swing',
    'bouncer',
  ] as const;
  const wakeReasons = [
    'hungry',
    'diaper',
    'crying',
    'naturally',
    'noise',
    'unknown',
  ] as const;

  for (let day = 0; day < daysToGenerate; day++) {
    const currentDate = addDays(birthDate, day);
    const ageInDays = day;
    const sleepTimes = generateSleepTimes(currentDate, ageInDays);

    for (const sleep of sleepTimes) {
      activities.push({
        babyId,
        details: {
          location: randomChoice(locations),
          quality: randomChoice(qualities),
          sleepType: sleep.type,
          type: 'sleep',
          wakeReason: randomChoice(wakeReasons),
        },
        duration: sleep.duration,
        endTime: addMinutes(sleep.startTime, sleep.duration),
        familyId,
        startTime: sleep.startTime,
        type: 'sleep',
        userId: randomChoice(userIds),
      });
    }
  }

  return activities;
}

/**
 * Generate feeding activities (nursing and bottle)
 */
function generateFeedingActivities(
  babyId: string,
  familyId: string,
  birthDate: Date,
  daysToGenerate: number,
  userIds: string[],
): NewActivity[] {
  const activities: NewActivity[] = [];
  const sides = ['left', 'right', 'both'] as const;
  const feedingSources = ['pumped', 'donor', 'formula'] as const;

  for (let day = 0; day < daysToGenerate; day++) {
    const currentDate = addDays(birthDate, day);
    const ageInDays = day;
    const feedingCount =
      ageInDays < 14
        ? randomInt(10, 12)
        : ageInDays < 90
          ? randomInt(8, 10)
          : randomInt(6, 8);
    const feedingTimes = generateFeedingTimes(
      currentDate,
      ageInDays,
      feedingCount,
    );

    for (let i = 0; i < feedingTimes.length; i++) {
      const time = feedingTimes[i];
      if (!time) continue;
      const isNursing = randomBoolean(0.6); // 60% nursing, 40% bottle

      if (isNursing) {
        // Nursing activity
        const duration = randomInt(10, 45);
        const skipped = randomBoolean(0.05); // 5% chance of skipped feed

        activities.push({
          babyId,
          details: {
            side: randomChoice(sides),
            skipped,
            skipReason: skipped ? 'Baby refused to feed' : undefined,
            type: 'nursing',
            vitaminDGiven: day < 180 && randomBoolean(0.3), // 30% chance for first 6 months
          },
          duration,
          endTime: addMinutes(time, duration),
          familyId,
          startTime: time,
          type: 'nursing',
          userId: randomChoice(userIds),
        });
      } else {
        // Bottle feeding
        const amount =
          ageInDays < 14
            ? randomInt(30, 90)
            : ageInDays < 90
              ? randomInt(90, 150)
              : randomInt(120, 240);
        const duration = randomInt(10, 30);

        activities.push({
          amountMl: amount,
          babyId,
          details: {
            type: 'bottle',
            vitaminDGiven: day < 180 && randomBoolean(0.2),
          },
          duration,
          endTime: addMinutes(time, duration),
          familyId,
          feedingSource: randomChoice(feedingSources),
          startTime: time,
          type: 'bottle',
          userId: randomChoice(userIds),
        });
      }
    }
  }

  return activities;
}

/**
 * Generate solid food activities (for babies 4+ months)
 */
function generateSolidsActivities(
  babyId: string,
  familyId: string,
  birthDate: Date,
  daysToGenerate: number,
  startDay: number,
  userIds: string[],
): NewActivity[] {
  const activities: NewActivity[] = [];
  const foods = [
    { allergenInfo: '', foodName: 'Rice cereal', portion: '1-2 tbsp' },
    { allergenInfo: '', foodName: 'Mashed banana', portion: '2-3 tbsp' },
    { allergenInfo: '', foodName: 'Sweet potato puree', portion: '2-3 tbsp' },
    { allergenInfo: '', foodName: 'Avocado', portion: '1-2 tbsp' },
    { allergenInfo: '', foodName: 'Applesauce', portion: '2 tbsp' },
    { allergenInfo: '', foodName: 'Pear puree', portion: '2 tbsp' },
    { allergenInfo: '', foodName: 'Carrot puree', portion: '2-3 tbsp' },
    {
      allergenInfo: 'Peanut',
      foodName: 'Peanut butter (thinned)',
      portion: '1 tsp',
    },
    { allergenInfo: 'Egg', foodName: 'Scrambled egg', portion: '1-2 tbsp' },
  ];
  const reactions = ['none', 'liked', 'disliked', 'rash'] as const;

  for (let day = startDay; day < daysToGenerate; day++) {
    const currentDate = addDays(birthDate, day);
    const solidsCount = randomInt(1, 3); // 1-3 solid meals per day

    for (let i = 0; i < solidsCount; i++) {
      const mealTime = addHours(currentDate, 8 + i * 4 + randomInt(-1, 1));
      const itemCount = randomInt(1, 2);
      const items = [];

      for (let j = 0; j < itemCount; j++) {
        const food = randomChoice(foods);
        items.push({
          allergenInfo: food.allergenInfo,
          foodName: food.foodName,
          notes: randomBoolean(0.2) ? 'Baby enjoyed this' : undefined,
          portion: food.portion,
          reaction: randomChoice(reactions),
        });
      }

      activities.push({
        babyId,
        details: {
          items,
          type: 'solids',
        },
        familyId,
        startTime: mealTime,
        type: 'solids',
        userId: randomChoice(userIds),
      });
    }
  }

  return activities;
}

/**
 * Generate diaper activities
 */
function generateDiaperActivities(
  babyId: string,
  familyId: string,
  birthDate: Date,
  daysToGenerate: number,
  userIds: string[],
): NewActivity[] {
  const activities: NewActivity[] = [];
  const types = ['wet', 'dirty', 'both', 'diaper'] as const;
  const colors = ['yellow', 'brown', 'green', 'black', 'orange'] as const;
  const consistencies = [
    'solid',
    'loose',
    'runny',
    'mucousy',
    'hard',
    'pebbles',
  ] as const;

  for (let day = 0; day < daysToGenerate; day++) {
    const currentDate = addDays(birthDate, day);
    const ageInDays = day;
    const diaperCount =
      ageInDays < 14
        ? randomInt(10, 12)
        : ageInDays < 90
          ? randomInt(8, 10)
          : randomInt(6, 8);

    // Determine size based on age
    const size =
      ageInDays < 30 ? 'little' : ageInDays < 120 ? 'medium' : 'large';

    for (let i = 0; i < diaperCount; i++) {
      const time = randomTimeOnDay(currentDate, 6, 22);
      const type = randomChoice(types);
      const isDirty = type === 'dirty' || type === 'both';

      activities.push({
        babyId,
        details: {
          color: isDirty ? randomChoice(colors) : undefined,
          consistency: isDirty ? randomChoice(consistencies) : undefined,
          size,
          type: 'diaper',
        },
        familyId,
        startTime: time,
        type,
        userId: randomChoice(userIds),
      });
    }
  }

  return activities;
}

/**
 * Generate pumping activities
 */
function generatePumpingActivities(
  babyId: string,
  familyId: string,
  birthDate: Date,
  daysToGenerate: number,
  userIds: string[],
): NewActivity[] {
  const activities: NewActivity[] = [];

  for (let day = 0; day < daysToGenerate; day++) {
    const currentDate = addDays(birthDate, day);
    const ageInDays = day;
    const pumpingCount = randomInt(4, 6);

    for (let i = 0; i < pumpingCount; i++) {
      const time = addHours(currentDate, 7 + i * 3 + randomInt(-1, 1));
      const duration = randomInt(15, 30);
      const skipped = randomBoolean(0.1); // 10% skipped

      const leftAmount = skipped ? 0 : randomInt(30, 90);
      const rightAmount = skipped ? 0 : randomInt(30, 90);

      activities.push({
        babyId,
        details: {
          isColostrum: ageInDays < 5 && randomBoolean(0.5),
          leftBreastMl: leftAmount,
          rightBreastMl: rightAmount,
          skipped,
          skipReason: skipped ? 'Too tired' : undefined,
          type: 'pumping',
        },
        duration,
        endTime: addMinutes(time, duration),
        familyId,
        startTime: time,
        type: 'pumping',
        userId: randomChoice(userIds),
      });
    }
  }

  return activities;
}

/**
 * Generate other activities (bath, tummy time, vitamin D, etc.)
 */
function generateOtherActivities(
  babyId: string,
  familyId: string,
  birthDate: Date,
  daysToGenerate: number,
  userIds: string[],
): NewActivity[] {
  const activities: NewActivity[] = [];

  for (let day = 0; day < daysToGenerate; day++) {
    const currentDate = addDays(birthDate, day);

    // Vitamin D (daily)
    activities.push({
      babyId,
      details: {
        method: randomChoice(['drops', 'spray'] as const),
        type: 'vitamin_d',
      },
      familyId,
      startTime: addHours(currentDate, 9 + randomInt(-1, 1)),
      type: 'vitamin_d',
      userId: randomChoice(userIds),
    });

    // Bath (every 2-3 days)
    if (day % randomInt(2, 3) === 0) {
      const bathTime = addHours(currentDate, 18 + randomInt(-1, 1));
      activities.push({
        babyId,
        familyId,
        startTime: bathTime,
        type: 'bath',
        userId: randomChoice(userIds),
      });
    }

    // Tummy time (1-2 per day for older babies)
    if (day > 14) {
      const tummyCount = randomInt(1, 2);
      for (let i = 0; i < tummyCount; i++) {
        const tummyTime = addHours(currentDate, 10 + i * 5);
        const duration = randomInt(5, 20);
        activities.push({
          babyId,
          duration,
          endTime: addMinutes(tummyTime, duration),
          familyId,
          startTime: tummyTime,
          type: 'tummy_time',
          userId: randomChoice(userIds),
        });
      }
    }

    // Medicine (occasional, ~5% of days)
    if (randomBoolean(0.05)) {
      activities.push({
        babyId,
        details: {
          dosage: '0.5ml',
          name: randomChoice(['Tylenol', 'Vitamin D drops', 'Gas drops']),
          type: 'medicine',
        },
        familyId,
        startTime: addHours(currentDate, 12 + randomInt(-2, 2)),
        type: 'medicine',
        userId: randomChoice(userIds),
      });
    }

    // Temperature (when sick, ~2% of days)
    if (randomBoolean(0.02)) {
      activities.push({
        babyId,
        details: {
          method: randomChoice([
            'oral',
            'rectal',
            'axillary',
            'temporal',
            'tympanic',
          ] as const),
          temperatureFahrenheit: randomFloat(98.0, 100.5),
          type: 'temperature',
        },
        familyId,
        startTime: addHours(currentDate, 14 + randomInt(-2, 2)),
        type: 'temperature',
        userId: randomChoice(userIds),
      });
    }
  }

  return activities;
}

/**
 * Generate doctor visit activities (monthly)
 */
function generateDoctorVisits(
  babyId: string,
  familyId: string,
  birthDate: Date,
  daysToGenerate: number,
  userIds: string[],
): NewActivity[] {
  const activities: NewActivity[] = [];
  const vaccinations = [
    'Hepatitis B',
    'DTaP',
    'Hib',
    'Polio',
    'Pneumococcal',
    'Rotavirus',
  ];

  // Generate visits at 2 weeks, 1 month, 2 months, 4 months, 6 months
  const visitDays = [14, 30, 60, 120, 180];

  for (const visitDay of visitDays) {
    if (visitDay >= daysToGenerate) break;

    const visitDate = addDays(birthDate, visitDay);
    const visitTime = addHours(visitDate, 10 + randomInt(-1, 1));

    // Realistic measurements based on age
    const weightKg = 3.5 + (visitDay / 30) * 0.7; // ~0.7kg per month
    const lengthCm = 50 + (visitDay / 30) * 2.5; // ~2.5cm per month
    const headCircumferenceCm = 35 + (visitDay / 30) * 1; // ~1cm per month

    activities.push({
      babyId,
      details: {
        doctorName: 'Dr. Smith',
        headCircumferenceCm: headCircumferenceCm.toFixed(1),
        lengthCm: lengthCm.toFixed(1),
        location: 'Pediatric Clinic',
        type: 'doctor_visit',
        vaccinations: visitDay >= 60 ? [randomChoice(vaccinations)] : [],
        visitType: 'well-baby',
        weightKg: weightKg.toFixed(2),
      },
      familyId,
      startTime: visitTime,
      type: 'doctor_visit',
      userId: randomChoice(userIds),
    });
  }

  return activities;
}

// ============================================================================
// Supporting Data Generators
// ============================================================================

/**
 * Generate growth records
 */
function generateGrowthRecords(
  babyId: string,
  familyId: string,
  birthDate: Date,
  daysToGenerate: number,
): NewGrowthRecord[] {
  const records: NewGrowthRecord[] = [];
  const recordInterval = 7; // Weekly recordings

  for (let day = 0; day < daysToGenerate; day += recordInterval) {
    const recordDate = addDays(birthDate, day);

    // Realistic growth progression
    const weight = 3500 + (day / 30) * 700; // ~700g per month
    const height = 50 + (day / 30) * 2.5; // ~2.5cm per month
    const headCircumference = 35 + (day / 30) * 1; // ~1cm per month

    records.push({
      babyId,
      date: recordDate,
      familyId,
      headCircumference: Math.round(headCircumference),
      height: Math.round(height),
      notes:
        day % 28 === 0
          ? 'Growth spurt week - feeding more frequently'
          : undefined,
      userId,
      weight: Math.round(weight),
    });
  }

  return records;
}

/**
 * Generate medical records
 */
function generateMedicalRecords(
  babyId: string,
  familyId: string,
  birthDate: Date,
  daysToGenerate: number,
): NewMedicalRecord[] {
  const records: NewMedicalRecord[] = [];
  const visitDays = [14, 30, 60, 120, 180];
  const vaccinations = [
    ['Hepatitis B'],
    ['Hepatitis B (2nd dose)'],
    ['DTaP', 'Hib', 'Polio', 'Pneumococcal', 'Rotavirus'],
    ['DTaP', 'Hib', 'Polio', 'Pneumococcal', 'Rotavirus'],
    ['DTaP', 'Hib', 'Polio', 'Pneumococcal', 'Rotavirus', 'Influenza'],
  ];

  for (let i = 0; i < visitDays.length; i++) {
    const visitDay = visitDays[i];
    if (visitDay === undefined || visitDay > daysToGenerate) break;

    const visitDate = addDays(birthDate, visitDay);
    const weightKg = 3.5 + (visitDay / 30) * 0.7;
    const lengthCm = 50 + (visitDay / 30) * 2.5;
    const headCircumferenceCm = 35 + (visitDay / 30) * 1;

    records.push({
      babyId,
      date: visitDate,
      description: `Well-baby checkup at ${visitDay} days`,
      doctorName: 'Dr. Smith',
      familyId,
      headCircumferenceCm: Number.parseFloat(headCircumferenceCm.toFixed(1)),
      lengthCm: Number.parseFloat(lengthCm.toFixed(1)),
      location: 'Pediatric Clinic',
      title: `${visitDay}-day checkup`,
      type: 'appointment',
      userId,
      vaccinations: vaccinations[i] || [],
      visitType: 'well-baby',
      weightKg: Number.parseFloat(weightKg.toFixed(2)),
    });
  }

  // Add occasional sick visits
  if (daysToGenerate > 45 && randomBoolean(0.3)) {
    records.push({
      babyId,
      date: addDays(birthDate, 45),
      description: 'Mild cold symptoms, monitoring',
      doctorName: 'Dr. Smith',
      familyId,
      location: 'Pediatric Clinic',
      title: 'Sick visit - cold',
      type: 'illness',
      userId,
      visitType: 'sick',
    });
  }

  return records;
}

/**
 * Generate milestones
 */
function generateMilestones(
  babyId: string,
  familyId: string,
  birthDate: Date,
  daysToGenerate: number,
): NewMilestone[] {
  const milestones: NewMilestone[] = [];

  const milestonesData = [
    {
      achievedDay: 3,
      description: 'First genuine smile',
      isSuggested: true,
      title: 'First smile',
      type: 'social',
    },
    {
      achievedDay: 14,
      description: 'Can lift head briefly when on tummy',
      isSuggested: true,
      title: 'Lifts head',
      type: 'physical',
    },
    {
      achievedDay: 30,
      description: 'Follows objects with eyes',
      isSuggested: true,
      title: 'Tracks objects',
      type: 'cognitive',
    },
    {
      achievedDay: 45,
      description: 'Coos and makes vowel sounds',
      isSuggested: true,
      title: 'First coos',
      type: 'language',
    },
    {
      achievedDay: 60,
      description: 'Holds head steady',
      isSuggested: true,
      title: 'Head control',
      type: 'physical',
    },
    {
      achievedDay: 90,
      description: 'Rolls from tummy to back',
      isSuggested: true,
      title: 'First roll',
      type: 'physical',
    },
    {
      achievedDay: 105,
      description: 'Laughs out loud',
      isSuggested: true,
      title: 'First laugh',
      type: 'social',
    },
    {
      achievedDay: 120,
      description: 'Reaches for toys',
      isSuggested: true,
      title: 'Reaches for objects',
      type: 'physical',
    },
    {
      achievedDay: 150,
      description: 'Sits with support',
      isSuggested: true,
      title: 'Sits with help',
      type: 'physical',
    },
    {
      achievedDay: 165,
      description: 'Babbles with consonants',
      isSuggested: true,
      title: 'Babbling',
      type: 'language',
    },
    {
      achievedDay: 180,
      description: 'Sits independently',
      isSuggested: false,
      title: 'Sits alone',
      type: 'physical',
    },
    {
      achievedDay: null,
      description: 'Not yet achieved',
      isSuggested: true,
      suggestedDay: 210,
      title: 'Crawls',
      type: 'physical',
    },
  ];

  for (const milestone of milestonesData) {
    if (
      milestone.achievedDay !== null &&
      milestone.achievedDay < daysToGenerate
    ) {
      milestones.push({
        achievedDate: addDays(birthDate, milestone.achievedDay),
        babyId,
        description: milestone.description,
        familyId,
        isSuggested: milestone.isSuggested,
        suggestedDay: milestone.suggestedDay,
        title: milestone.title,
        type: milestone.type as
          | 'physical'
          | 'cognitive'
          | 'social'
          | 'language'
          | 'self_care',
        userId,
      });
    }
  }

  return milestones;
}

interface CelebrationMemory {
  aiSummary: string;
  babyId: string;
  celebrationDate: Date;
  celebrationType:
    | 'week_1'
    | 'week_2'
    | 'week_3'
    | 'week_4'
    | 'week_5'
    | 'week_6'
    | 'week_7'
    | 'week_8'
    | 'week_9'
    | 'week_10'
    | 'week_11'
    | 'week_12'
    | 'month_1'
    | 'month_2'
    | 'month_3'
    | 'month_4'
    | 'month_5'
    | 'month_6';
  familyId: string;
  note: string;
  photoUrls: string[];
  userId: string;
}

/**
 * Generate celebration memories
 */
function generateCelebrations(
  babyId: string,
  familyId: string,
  birthDate: Date,
  daysToGenerate: number,
): CelebrationMemory[] {
  const celebrations: CelebrationMemory[] = [];

  // Week celebrations (1-12)
  for (let week = 1; week <= 12; week++) {
    const celebrationDay = week * 7;
    if (celebrationDay >= daysToGenerate) break;

    celebrations.push({
      aiSummary: `Week ${week}: Baby is growing well and meeting developmental milestones.`,
      babyId,
      celebrationDate: addDays(birthDate, celebrationDay),
      celebrationType: `week_${week}` as CelebrationMemory['celebrationType'],
      familyId,
      note: week === 1 ? 'Happy 1 week!' : `Happy ${week} weeks!`,
      photoUrls: [],
      userId,
    });
  }

  // Month celebrations
  const months = [
    { days: 30, type: 'month_1' },
    { days: 60, type: 'month_2' },
    { days: 90, type: 'month_3' },
    { days: 120, type: 'month_4' },
    { days: 150, type: 'month_5' },
    { days: 180, type: 'month_6' },
  ];

  for (const month of months) {
    if (month.days >= daysToGenerate) break;

    const monthNumber = month.type.split('_')[1];
    celebrations.push({
      aiSummary: `Month ${monthNumber}: Significant growth and development observed.`,
      babyId,
      celebrationDate: addDays(birthDate, month.days),
      celebrationType: month.type as CelebrationMemory['celebrationType'],
      familyId,
      note: `${monthNumber} month milestone!`,
      photoUrls: [],
      userId,
    });
  }

  return celebrations;
}

/**
 * Generate supply transactions
 */
function generateSupplyTransactions(
  babyId: string,
  familyId: string,
  pumpingActivities: NewActivity[],
  bottleActivities: NewActivity[],
): NewSupplyTransaction[] {
  const transactions: NewSupplyTransaction[] = [];

  // Add transactions from pumping (add to inventory)
  for (const pumping of pumpingActivities) {
    if (pumping.type !== 'pumping') continue;

    const details = pumping.details as {
      type: 'pumping';
      leftBreastMl?: number;
      rightBreastMl?: number;
    } | null;
    const totalMl =
      (details?.leftBreastMl || 0) + (details?.rightBreastMl || 0);

    if (totalMl > 0) {
      transactions.push({
        amountMl: totalMl,
        babyId,
        familyId,
        notes: 'From pumping session',
        source: 'pumped',
        timestamp: pumping.startTime,
        type: 'add',
        userId,
      });
    }
  }

  // Deduct transactions from bottle feeding
  for (const bottle of bottleActivities) {
    if (bottle.amountMl && bottle.feedingSource) {
      transactions.push({
        amountMl: bottle.amountMl,
        babyId,
        familyId,
        notes: 'Used for feeding',
        source: bottle.feedingSource,
        timestamp: bottle.startTime,
        type: 'deduct',
        userId,
      });
    }
  }

  return transactions;
}

// ============================================================================
// Main Seed Function
// ============================================================================

console.log('🌱 Starting database seed...');

// Reset all tables
console.log('🗑️  Clearing existing data...');
await db.delete(GrowthRecords);
await db.delete(CelebrationMemories);
await db.delete(Milestones);
await db.delete(MedicalRecords);
await db.delete(SupplyTransactions);
await db.delete(SupplyInventory);
await db.delete(Activities);
await db.delete(Babies);
await db.delete(ShortUrls);
await db.delete(FamilyMembers);
await db.delete(Families);
await db.delete(Users);

// Create base user, family, and family members
console.log('👤 Creating users, family, and family members...');

// Create primary user
await db.insert(Users).values({
  alarmDiaperEnabled: false,
  alarmFeedingEnabled: false,
  alarmPumpingEnabled: false,
  alarmSleepEnabled: false,
  clerkId: userId,
  email: 'chris.watts.t@gmail.com',
  firstName: 'Chris',
  id: userId,
  lastName: 'Watts',
  online: true,
});

// Create partner user
const partnerUserId = 'user_partner123';
await db.insert(Users).values({
  alarmDiaperEnabled: false,
  alarmFeedingEnabled: false,
  alarmPumpingEnabled: false,
  alarmSleepEnabled: false,
  clerkId: partnerUserId,
  email: 'partner@example.com',
  firstName: 'Alex',
  id: partnerUserId,
  lastName: 'Watts',
  online: false,
});

// Create caregiver user
const caregiverUserId = 'user_caregiver123';
await db.insert(Users).values({
  alarmDiaperEnabled: false,
  alarmFeedingEnabled: false,
  alarmPumpingEnabled: false,
  alarmSleepEnabled: false,
  clerkId: caregiverUserId,
  email: 'caregiver@example.com',
  firstName: 'Jordan',
  id: caregiverUserId,
  lastName: 'Smith',
  online: false,
});

await db.insert(Families).values({
  clerkOrgId: orgId,
  createdByUserId: userId,
  id: orgId,
  name: orgName,
  stripeCustomerId,
  stripeSubscriptionId,
  stripeSubscriptionStatus: 'active',
});

// Create family members with different roles
await db.insert(FamilyMembers).values([
  {
    familyId: orgId,
    onboardingCompletedAt: new Date(),
    role: 'primary',
    userId,
  },
  {
    familyId: orgId,
    onboardingCompletedAt: new Date(),
    role: 'partner',
    userId: partnerUserId,
  },
  {
    familyId: orgId,
    onboardingCompletedAt: new Date(),
    role: 'caregiver',
    userId: caregiverUserId,
  },
]);

console.log('✅ Created 3 users (primary, partner, caregiver)');

// Array of user IDs for assigning activities
const familyUserIds = [userId, partnerUserId, caregiverUserId];

await db.insert(ShortUrls).values([
  {
    code: 'test-code-1',
    familyId: orgId,
    redirectUrl: 'https://example.com/invite1',
    userId,
  },
  {
    code: 'test-code-2',
    familyId: orgId,
    redirectUrl: 'https://example.com/invite2',
    userId,
  },
  {
    code: 'test-code-3',
    familyId: orgId,
    redirectUrl: 'https://example.com/share',
    userId,
  },
]);

// Create babies with different ages
console.log('👶 Creating babies...');
const now = new Date();

const babies = [
  {
    ageInDays: 14,
    birthDate: subDays(now, 14),
    firstName: 'Riley',
    gender: 'female',
    id: createId({ prefix: 'baby' }),
    name: 'Riley (2 weeks)',
  },
  {
    ageInDays: 45,
    birthDate: subDays(now, 45),
    firstName: 'Oliver',
    gender: 'male',
    id: createId({ prefix: 'baby' }),
    name: 'Oliver (6 weeks)',
  },
  {
    ageInDays: 90,
    birthDate: subDays(now, 90),
    firstName: 'Sophia',
    gender: 'female',
    id: createId({ prefix: 'baby' }),
    name: 'Sophia (3 months)',
  },
];

for (const baby of babies) {
  await db.insert(Babies).values({
    birthDate: baby.birthDate,
    birthWeightOz: 120, // 7.5 lbs
    familyId: orgId,
    firstName: baby.firstName,
    gender: baby.gender,
    id: baby.id,
    journeyStage: 'born',
    lastName: 'Test',
    userId,
  });
}

console.log(`✅ Created ${babies.length} babies`);

// Generate activities for each baby
console.log('📝 Generating activities...');
let totalActivities = 0;

for (const baby of babies) {
  console.log(`\n  Generating activities for ${baby.name}...`);

  // Generate activities only for the actual age of the baby (not future activities)
  const daysToGenerateForBaby = baby.ageInDays;

  const sleepActivities = generateSleepActivities(
    baby.id,
    orgId,
    baby.birthDate,
    daysToGenerateForBaby,
    familyUserIds,
  );
  console.log(`    ✓ ${sleepActivities.length} sleep activities`);

  const feedingActivities = generateFeedingActivities(
    baby.id,
    orgId,
    baby.birthDate,
    daysToGenerateForBaby,
    familyUserIds,
  );
  console.log(`    ✓ ${feedingActivities.length} feeding activities`);

  const diaperActivities = generateDiaperActivities(
    baby.id,
    orgId,
    baby.birthDate,
    daysToGenerateForBaby,
    familyUserIds,
  );
  console.log(`    ✓ ${diaperActivities.length} diaper activities`);

  const pumpingActivities = generatePumpingActivities(
    baby.id,
    orgId,
    baby.birthDate,
    daysToGenerateForBaby,
    familyUserIds,
  );
  console.log(`    ✓ ${pumpingActivities.length} pumping activities`);

  const otherActivities = generateOtherActivities(
    baby.id,
    orgId,
    baby.birthDate,
    daysToGenerateForBaby,
    familyUserIds,
  );
  console.log(`    ✓ ${otherActivities.length} other activities`);

  const doctorVisits = generateDoctorVisits(
    baby.id,
    orgId,
    baby.birthDate,
    daysToGenerateForBaby,
    familyUserIds,
  );
  console.log(`    ✓ ${doctorVisits.length} doctor visits`);

  // Generate solids for baby starting at 4 months if they're old enough
  let solidsActivities: NewActivity[] = [];
  if (baby.ageInDays >= 120) {
    solidsActivities = generateSolidsActivities(
      baby.id,
      orgId,
      baby.birthDate,
      daysToGenerateForBaby,
      120,
      familyUserIds,
    );
    console.log(`    ✓ ${solidsActivities.length} solid food activities`);
  }

  // Combine all activities
  const allActivities = [
    ...sleepActivities,
    ...feedingActivities,
    ...diaperActivities,
    ...pumpingActivities,
    ...otherActivities,
    ...doctorVisits,
    ...solidsActivities,
  ];

  // Insert activities in batches
  const batchSize = 500;
  for (let i = 0; i < allActivities.length; i += batchSize) {
    const batch = allActivities.slice(i, i + batchSize);
    await db.insert(Activities).values(batch);
  }

  totalActivities += allActivities.length;

  // Generate supporting data
  console.log('    Generating supporting data...');

  const growthRecords = generateGrowthRecords(
    baby.id,
    orgId,
    baby.birthDate,
    daysToGenerateForBaby,
  );
  await db.insert(GrowthRecords).values(growthRecords);
  console.log(`    ✓ ${growthRecords.length} growth records`);

  const medicalRecords = generateMedicalRecords(
    baby.id,
    orgId,
    baby.birthDate,
    daysToGenerateForBaby,
  );
  if (medicalRecords.length > 0) {
    await db.insert(MedicalRecords).values(medicalRecords);
  }
  console.log(`    ✓ ${medicalRecords.length} medical records`);

  const milestones = generateMilestones(
    baby.id,
    orgId,
    baby.birthDate,
    daysToGenerateForBaby,
  );
  if (milestones.length > 0) {
    await db.insert(Milestones).values(milestones);
  }
  console.log(`    ✓ ${milestones.length} milestones`);

  const celebrations = generateCelebrations(
    baby.id,
    orgId,
    baby.birthDate,
    daysToGenerateForBaby,
  );
  if (celebrations.length > 0) {
    await db.insert(CelebrationMemories).values(celebrations);
  }
  console.log(`    ✓ ${celebrations.length} celebrations`);

  // Generate supply data
  const bottleActivities = feedingActivities.filter((a) => a.type === 'bottle');
  const transactions = generateSupplyTransactions(
    baby.id,
    orgId,
    pumpingActivities,
    bottleActivities,
  );

  // Insert transactions in batches
  for (let i = 0; i < transactions.length; i += batchSize) {
    const batch = transactions.slice(i, i + batchSize);
    await db.insert(SupplyTransactions).values(batch);
  }
  console.log(`    ✓ ${transactions.length} supply transactions`);

  // Calculate current inventory
  let pumpedMl = 0;
  let formulaMl = 0;
  let donorMl = 0;

  for (const transaction of transactions) {
    if (transaction.type === 'add') {
      if (transaction.source === 'pumped') pumpedMl += transaction.amountMl;
      if (transaction.source === 'formula') formulaMl += transaction.amountMl;
      if (transaction.source === 'donor') donorMl += transaction.amountMl;
    } else {
      if (transaction.source === 'pumped')
        pumpedMl = Math.max(0, pumpedMl - transaction.amountMl);
      if (transaction.source === 'formula')
        formulaMl = Math.max(0, formulaMl - transaction.amountMl);
      if (transaction.source === 'donor')
        donorMl = Math.max(0, donorMl - transaction.amountMl);
    }
  }

  await db.insert(SupplyInventory).values({
    babyId: baby.id,
    donorMl: Math.max(0, donorMl),
    familyId: orgId,
    formulaMl: Math.max(0, formulaMl),
    pumpedMl: Math.max(0, pumpedMl),
    userId,
  });
  console.log(
    `    ✓ Supply inventory (pumped: ${pumpedMl.toFixed(0)}ml, formula: ${formulaMl.toFixed(0)}ml, donor: ${donorMl.toFixed(0)}ml)`,
  );
}

console.log('\n✅ Seed completed successfully!');
console.log('\n📊 Summary:');
console.log(`   • ${babies.length} babies created`);
console.log(`   • ${totalActivities.toLocaleString()} total activities`);
const avgActivitiesPerDay =
  totalActivities / babies.reduce((sum, b) => sum + b.ageInDays, 0);
console.log(
  `   • ~${Math.round(avgActivitiesPerDay)} activities per day per baby`,
);

process.exit(0);
