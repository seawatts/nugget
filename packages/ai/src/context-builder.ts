// Context Builder for BAML AI Functions
// Aggregates database context for richer, more personalized AI responses

import { db } from '@nugget/db/client';
import {
  Activities,
  Babies,
  ChatMessages,
  Chats,
  Milestones,
  ParentCheckIns,
  ParentTasks,
  WellnessAssessments,
  MedicalRecords,
} from '@nugget/db/schema';
import { and, desc, eq, gte, inArray, isNotNull, lte, sql } from 'drizzle-orm';

// ============================================================================
// Interfaces
// ============================================================================

export interface BamlContextData {
  // Chat history
  recentChatMessages: Array<{
    role: string;
    content: string;
    createdAt: Date;
  }>;
  chatSummaries: Array<{
    title: string;
    summary: string;
    updatedAt: Date;
  }>;

  // Milestone history
  recentMilestones: Array<{
    title: string;
    type: string;
    achievedDate: Date;
    description?: string | null;
  }>;

  // Activity summaries
  last3DaysActivities: {
    feeding: { count: number; avgDuration?: number; patterns: string };
    sleep: { count: number; totalHours: number; quality: string };
    diaper: { wet: number; dirty: number; concerns: string[] };
    other: { types: string[]; notes: string[] };
  };
  weeklyTrends: {
    feedingTrend: string; // "stable", "increasing", "decreasing"
    sleepTrend: string;
    notableChanges: string[];
  };
  redFlags: string[]; // e.g., "Fewer wet diapers than expected", "Temperature recorded"

  // Parent wellness
  recentCheckIns: Array<{
    date: Date;
    moodScore?: number | null;
    concerns: string[];
  }>;
  wellnessRiskScore?: number | null;
  completedTasks: Array<{ taskText: string; completedAt: Date }>;

  // Medical records
  upcomingAppointments: Array<{
    title: string;
    date: Date;
    provider?: string | null;
  }>;
  recentAppointments: Array<{ title: string; date: Date; type: string }>;
  activeVaccinations: Array<{ title: string; date: Date }>;
  activeMedications: Array<{ name: string; dosage: string }>;
}

interface BuildContextParams {
  babyId: string;
  userId: string;
  familyId: string;
  includeChat?: boolean;
  includeMilestones?: boolean;
  includeActivities?: boolean;
  includeParentWellness?: boolean;
  includeMedical?: boolean;
}

// ============================================================================
// Helper Functions
// ============================================================================

function getDateDaysAgo(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

function getDateDaysFromNow(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

// ============================================================================
// Main Context Builder
// ============================================================================

export async function buildBamlContext(
  params: BuildContextParams,
): Promise<BamlContextData> {
  const {
    babyId,
    userId,
    familyId,
    includeChat = true,
    includeMilestones = true,
    includeActivities = true,
    includeParentWellness = true,
    includeMedical = true,
  } = params;

  // Initialize empty context
  const context: BamlContextData = {
    recentChatMessages: [],
    chatSummaries: [],
    recentMilestones: [],
    last3DaysActivities: {
      feeding: { count: 0, patterns: '' },
      sleep: { count: 0, totalHours: 0, quality: '' },
      diaper: { wet: 0, dirty: 0, concerns: [] },
      other: { types: [], notes: [] },
    },
    weeklyTrends: {
      feedingTrend: 'stable',
      sleepTrend: 'stable',
      notableChanges: [],
    },
    redFlags: [],
    recentCheckIns: [],
    completedTasks: [],
    upcomingAppointments: [],
    recentAppointments: [],
    activeVaccinations: [],
    activeMedications: [],
  };

  try {
    // Parallel queries for better performance
    const [
      chatData,
      milestoneData,
      activityData,
      parentWellnessData,
      medicalData,
    ] = await Promise.all([
      includeChat ? fetchChatContext(babyId, familyId) : null,
      includeMilestones ? fetchMilestoneContext(babyId, familyId) : null,
      includeActivities ? fetchActivityContext(babyId, familyId) : null,
      includeParentWellness
        ? fetchParentWellnessContext(userId, familyId)
        : null,
      includeMedical ? fetchMedicalContext(babyId, familyId) : null,
    ]);

    // Merge results
    if (chatData) {
      context.recentChatMessages = chatData.recentChatMessages;
      context.chatSummaries = chatData.chatSummaries;
    }

    if (milestoneData) {
      context.recentMilestones = milestoneData;
    }

    if (activityData) {
      context.last3DaysActivities = activityData.last3DaysActivities;
      context.weeklyTrends = activityData.weeklyTrends;
      context.redFlags = activityData.redFlags;
    }

    if (parentWellnessData) {
      context.recentCheckIns = parentWellnessData.recentCheckIns;
      context.wellnessRiskScore = parentWellnessData.wellnessRiskScore;
      context.completedTasks = parentWellnessData.completedTasks;
    }

    if (medicalData) {
      context.upcomingAppointments = medicalData.upcomingAppointments;
      context.recentAppointments = medicalData.recentAppointments;
      context.activeVaccinations = medicalData.activeVaccinations;
      context.activeMedications = medicalData.activeMedications;
    }
  } catch (error) {
    console.error('Error building BAML context:', error);
    // Return partial context on error rather than failing completely
  }

  return context;
}

// ============================================================================
// Context Fetchers
// ============================================================================

async function fetchChatContext(babyId: string, familyId: string) {
  const thirtyDaysAgo = getDateDaysAgo(30);

  // Get recent chats with summaries
  const chatsWithSummaries = await db
    .select({
      title: Chats.title,
      summary: Chats.summary,
      updatedAt: Chats.updatedAt,
    })
    .from(Chats)
    .where(
      and(
        eq(Chats.babyId, babyId),
        eq(Chats.familyId, familyId),
        isNotNull(Chats.summary),
        gte(Chats.updatedAt, thirtyDaysAgo),
      ),
    )
    .orderBy(desc(Chats.updatedAt))
    .limit(10);

  // Get most recent chat messages (last 10 messages across all recent chats)
  const recentChats = await db
    .select({ id: Chats.id })
    .from(Chats)
    .where(and(eq(Chats.babyId, babyId), eq(Chats.familyId, familyId)))
    .orderBy(desc(Chats.updatedAt))
    .limit(3);

  const chatIds = recentChats.map((c) => c.id);

  let recentMessages: Array<{
    role: string;
    content: string;
    createdAt: Date;
  }> = [];

  if (chatIds.length > 0) {
    recentMessages = await db
      .select({
        role: ChatMessages.role,
        content: ChatMessages.content,
        createdAt: ChatMessages.createdAt,
      })
      .from(ChatMessages)
      .where(inArray(ChatMessages.chatId, chatIds))
      .orderBy(desc(ChatMessages.createdAt))
      .limit(10);
  }

  return {
    recentChatMessages: recentMessages,
    chatSummaries: chatsWithSummaries.filter(
      (c) => c.summary !== null,
    ) as Array<{
      title: string;
      summary: string;
      updatedAt: Date;
    }>,
  };
}

async function fetchMilestoneContext(babyId: string, familyId: string) {
  const milestones = await db
    .select({
      title: Milestones.title,
      type: Milestones.type,
      achievedDate: Milestones.achievedDate,
      description: Milestones.description,
    })
    .from(Milestones)
    .where(
      and(
        eq(Milestones.babyId, babyId),
        eq(Milestones.familyId, familyId),
        isNotNull(Milestones.achievedDate),
      ),
    )
    .orderBy(desc(Milestones.achievedDate))
    .limit(10);

  return milestones as Array<{
    title: string;
    type: string;
    achievedDate: Date;
    description?: string | null;
  }>;
}

async function fetchActivityContext(babyId: string, familyId: string) {
  const threeDaysAgo = getDateDaysAgo(3);
  const sevenDaysAgo = getDateDaysAgo(7);
  const fourteenDaysAgo = getDateDaysAgo(14);

  // Get last 3 days activities
  const recentActivities = await db
    .select()
    .from(Activities)
    .where(
      and(
        eq(Activities.babyId, babyId),
        eq(Activities.familyId, familyId),
        gte(Activities.startTime, threeDaysAgo),
      ),
    )
    .orderBy(desc(Activities.startTime));

  // Get last 7 days for trend analysis
  const last7DaysActivities = await db
    .select()
    .from(Activities)
    .where(
      and(
        eq(Activities.babyId, babyId),
        eq(Activities.familyId, familyId),
        gte(Activities.startTime, sevenDaysAgo),
      ),
    );

  // Get previous 7 days for comparison
  const previous7DaysActivities = await db
    .select()
    .from(Activities)
    .where(
      and(
        eq(Activities.babyId, babyId),
        eq(Activities.familyId, familyId),
        gte(Activities.startTime, fourteenDaysAgo),
        lte(Activities.startTime, sevenDaysAgo),
      ),
    );

  // Aggregate last 3 days
  const last3Days = aggregateActivities(recentActivities);

  // Calculate trends
  const trends = calculateTrends(last7DaysActivities, previous7DaysActivities);

  // Detect red flags
  const redFlags = detectRedFlags(recentActivities, last7DaysActivities);

  return {
    last3DaysActivities: last3Days,
    weeklyTrends: trends,
    redFlags,
  };
}

async function fetchParentWellnessContext(userId: string, familyId: string) {
  const sevenDaysAgo = getDateDaysAgo(7);

  // Get recent check-ins
  const checkIns = await db
    .select({
      date: ParentCheckIns.date,
      moodScore: ParentCheckIns.moodScore,
      concernsRaised: ParentCheckIns.concernsRaised,
    })
    .from(ParentCheckIns)
    .where(
      and(
        eq(ParentCheckIns.userId, userId),
        eq(ParentCheckIns.familyId, familyId),
        gte(ParentCheckIns.date, sevenDaysAgo),
      ),
    )
    .orderBy(desc(ParentCheckIns.date))
    .limit(7);

  // Get latest wellness assessment
  const latestWellness = await db
    .select({ riskScore: WellnessAssessments.riskScore })
    .from(WellnessAssessments)
    .where(
      and(
        eq(WellnessAssessments.userId, userId),
        eq(WellnessAssessments.familyId, familyId),
      ),
    )
    .orderBy(desc(WellnessAssessments.date))
    .limit(1);

  // Get completed tasks
  const tasks = await db
    .select({
      taskText: ParentTasks.taskText,
      completedAt: ParentTasks.completedAt,
    })
    .from(ParentTasks)
    .where(
      and(
        eq(ParentTasks.userId, userId),
        eq(ParentTasks.familyId, familyId),
        eq(ParentTasks.completed, true),
        isNotNull(ParentTasks.completedAt),
        gte(ParentTasks.completedAt, sevenDaysAgo),
      ),
    )
    .orderBy(desc(ParentTasks.completedAt))
    .limit(10);

  return {
    recentCheckIns: checkIns.map((c) => ({
      date: c.date,
      moodScore: c.moodScore,
      concerns: (c.concernsRaised as string[]) || [],
    })),
    wellnessRiskScore: latestWellness[0]?.riskScore || null,
    completedTasks: tasks
      .filter((t) => t.completedAt !== null)
      .map((t) => ({
        taskText: t.taskText,
        completedAt: t.completedAt as Date,
      })),
  };
}

async function fetchMedicalContext(babyId: string, familyId: string) {
  const thirtyDaysAgo = getDateDaysAgo(30);
  const thirtyDaysFromNow = getDateDaysFromNow(30);
  const now = new Date();

  // Get upcoming appointments
  const upcoming = await db
    .select({
      title: MedicalRecords.title,
      date: MedicalRecords.date,
      provider: MedicalRecords.provider,
      type: MedicalRecords.type,
    })
    .from(MedicalRecords)
    .where(
      and(
        eq(MedicalRecords.babyId, babyId),
        eq(MedicalRecords.familyId, familyId),
        gte(MedicalRecords.date, now),
        lte(MedicalRecords.date, thirtyDaysFromNow),
      ),
    )
    .orderBy(MedicalRecords.date)
    .limit(5);

  // Get recent appointments
  const recent = await db
    .select({
      title: MedicalRecords.title,
      date: MedicalRecords.date,
      type: MedicalRecords.type,
    })
    .from(MedicalRecords)
    .where(
      and(
        eq(MedicalRecords.babyId, babyId),
        eq(MedicalRecords.familyId, familyId),
        lte(MedicalRecords.date, now),
        gte(MedicalRecords.date, thirtyDaysAgo),
      ),
    )
    .orderBy(desc(MedicalRecords.date))
    .limit(5);

  // Get vaccinations
  const vaccinations = await db
    .select({
      title: MedicalRecords.title,
      date: MedicalRecords.date,
    })
    .from(MedicalRecords)
    .where(
      and(
        eq(MedicalRecords.babyId, babyId),
        eq(MedicalRecords.familyId, familyId),
        eq(MedicalRecords.type, 'vaccination'),
      ),
    )
    .orderBy(desc(MedicalRecords.date))
    .limit(10);

  // Get active medications
  const medications = await db
    .select({
      title: MedicalRecords.title,
      description: MedicalRecords.description,
    })
    .from(MedicalRecords)
    .where(
      and(
        eq(MedicalRecords.babyId, babyId),
        eq(MedicalRecords.familyId, familyId),
        eq(MedicalRecords.type, 'medication'),
        gte(MedicalRecords.date, thirtyDaysAgo),
      ),
    )
    .orderBy(desc(MedicalRecords.date))
    .limit(5);

  return {
    upcomingAppointments: upcoming.map((a) => ({
      title: a.title,
      date: a.date,
      provider: a.provider,
    })),
    recentAppointments: recent,
    activeVaccinations: vaccinations,
    activeMedications: medications.map((m) => ({
      name: m.title,
      dosage: m.description || '',
    })),
  };
}

// ============================================================================
// Activity Analysis Functions
// ============================================================================

function aggregateActivities(activities: typeof Activities.$inferSelect[]) {
  const feeding = activities.filter(
    (a) =>
      a.type === 'feeding' ||
      a.type === 'nursing' ||
      a.type === 'bottle' ||
      a.type === 'pumping',
  );
  const sleep = activities.filter((a) => a.type === 'sleep');
  const diaper = activities.filter(
    (a) =>
      a.type === 'diaper' ||
      a.type === 'wet' ||
      a.type === 'dirty' ||
      a.type === 'both',
  );
  const other = activities.filter(
    (a) =>
      !['feeding', 'nursing', 'bottle', 'pumping', 'sleep', 'diaper', 'wet', 'dirty', 'both'].includes(a.type),
  );

  const avgFeedingDuration =
    feeding.length > 0
      ? feeding.reduce((sum, f) => sum + (f.duration || 0), 0) / feeding.length
      : undefined;

  const totalSleepHours =
    sleep.reduce((sum, s) => sum + (s.duration || 0), 0) / 60;

  const wetCount = diaper.filter((d) => d.type === 'wet' || d.type === 'both')
    .length;
  const dirtyCount = diaper.filter(
    (d) => d.type === 'dirty' || d.type === 'both',
  ).length;

  const sleepQuality = calculateSleepQuality(sleep);
  const feedingPatterns = calculateFeedingPatterns(feeding);

  return {
    feeding: {
      count: feeding.length,
      avgDuration: avgFeedingDuration,
      patterns: feedingPatterns,
    },
    sleep: {
      count: sleep.length,
      totalHours: totalSleepHours,
      quality: sleepQuality,
    },
    diaper: {
      wet: wetCount,
      dirty: dirtyCount,
      concerns: detectDiaperConcerns(diaper),
    },
    other: {
      types: [...new Set(other.map((a) => a.type))],
      notes: other.map((a) => a.notes).filter((n) => n !== null) as string[],
    },
  };
}

function calculateTrends(
  last7Days: typeof Activities.$inferSelect[],
  previous7Days: typeof Activities.$inferSelect[],
) {
  const recentFeeding = last7Days.filter((a) =>
    ['feeding', 'nursing', 'bottle', 'pumping'].includes(a.type),
  );
  const previousFeeding = previous7Days.filter((a) =>
    ['feeding', 'nursing', 'bottle', 'pumping'].includes(a.type),
  );

  const recentSleep = last7Days.filter((a) => a.type === 'sleep');
  const previousSleep = previous7Days.filter((a) => a.type === 'sleep');

  const feedingTrend =
    recentFeeding.length > previousFeeding.length * 1.15
      ? 'increasing'
      : recentFeeding.length < previousFeeding.length * 0.85
        ? 'decreasing'
        : 'stable';

  const recentSleepHours =
    recentSleep.reduce((sum, s) => sum + (s.duration || 0), 0) / 60;
  const previousSleepHours =
    previousSleep.reduce((sum, s) => sum + (s.duration || 0), 0) / 60;

  const sleepTrend =
    recentSleepHours > previousSleepHours * 1.15
      ? 'increasing'
      : recentSleepHours < previousSleepHours * 0.85
        ? 'decreasing'
        : 'stable';

  const notableChanges: string[] = [];
  if (feedingTrend !== 'stable') {
    notableChanges.push(`Feeding frequency ${feedingTrend}`);
  }
  if (sleepTrend !== 'stable') {
    notableChanges.push(`Sleep duration ${sleepTrend}`);
  }

  return {
    feedingTrend,
    sleepTrend,
    notableChanges,
  };
}

function detectRedFlags(
  recentActivities: typeof Activities.$inferSelect[],
  weekActivities: typeof Activities.$inferSelect[],
) {
  const redFlags: string[] = [];

  // Check for temperature recordings
  const hasTemperature = recentActivities.some(
    (a) => a.type === 'temperature',
  );
  if (hasTemperature) {
    redFlags.push('Temperature recorded in last 3 days');
  }

  // Check for low diaper output
  const diapers = recentActivities.filter(
    (a) =>
      a.type === 'diaper' ||
      a.type === 'wet' ||
      a.type === 'dirty' ||
      a.type === 'both',
  );
  if (diapers.length < 6) {
    // CDC recommends 6+ wet diapers per day
    redFlags.push('Fewer wet diapers than expected (< 6 per day)');
  }

  // Check for sudden feeding changes
  const recentFeeding = recentActivities.filter((a) =>
    ['feeding', 'nursing', 'bottle'].includes(a.type),
  );
  const weekFeeding = weekActivities.filter((a) =>
    ['feeding', 'nursing', 'bottle'].includes(a.type),
  );
  const avgWeeklyFeedings = weekFeeding.length / 7;

  if (recentFeeding.length < avgWeeklyFeedings * 0.5) {
    redFlags.push('Significant decrease in feeding frequency');
  }

  return redFlags;
}

function calculateSleepQuality(
  sleepActivities: typeof Activities.$inferSelect[],
): string {
  if (sleepActivities.length === 0) return 'No data';

  const qualities = sleepActivities
    .map((s) => {
      const details = s.details as any;
      return details?.quality;
    })
    .filter((q) => q !== undefined && q !== null);

  if (qualities.length === 0) return 'Not tracked';

  const peacefulCount = qualities.filter((q) => q === 'peaceful').length;
  const restlessCount = qualities.filter((q) => q === 'restless').length;
  const fussyCount = qualities.filter((q) => q === 'fussy').length;

  if (peacefulCount > qualities.length * 0.6) return 'Mostly peaceful';
  if (restlessCount + fussyCount > qualities.length * 0.6)
    return 'Frequently restless';
  return 'Mixed quality';
}

function calculateFeedingPatterns(
  feedingActivities: typeof Activities.$inferSelect[],
): string {
  if (feedingActivities.length === 0) return 'No data';

  const intervals: number[] = [];
  for (let i = 1; i < feedingActivities.length; i++) {
    const prevStartTime = feedingActivities[i - 1]?.startTime;
    const currStartTime = feedingActivities[i]?.startTime;

    if (!prevStartTime || !currStartTime) continue;

    const diff =
      prevStartTime.getTime() -
      currStartTime.getTime();
    intervals.push(diff / (1000 * 60 * 60)); // Convert to hours
  }

  if (intervals.length === 0) return 'Insufficient data';

  const avgInterval =
    intervals.reduce((sum, i) => sum + i, 0) / intervals.length;

  if (avgInterval < 2) return 'Cluster feeding (< 2h intervals)';
  if (avgInterval < 3) return 'Frequent feeding (2-3h intervals)';
  if (avgInterval < 4) return 'Regular feeding (3-4h intervals)';
  return 'Extended intervals (> 4h)';
}

function detectDiaperConcerns(
  diaperActivities: typeof Activities.$inferSelect[],
): string[] {
  const concerns: string[] = [];

  diaperActivities.forEach((d) => {
    const details = d.details as any;
    if (details?.color === 'red') {
      concerns.push('Blood in stool detected');
    }
    if (details?.color === 'white') {
      concerns.push('Pale/white stool (possible bile duct issue)');
    }
    if (details?.consistency === 'diarrhea') {
      concerns.push('Diarrhea noted');
    }
  });

  return [...new Set(concerns)]; // Remove duplicates
}

