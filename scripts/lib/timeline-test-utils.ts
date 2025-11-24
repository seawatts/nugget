import { db } from '@nugget/db/client';
import {
  Activities,
  Babies,
  ChatMessages,
  Chats,
  FamilyMembers,
  Milestones,
  Users,
} from '@nugget/db/schema';
import { eq } from 'drizzle-orm';

// Export schema types for use in other scripts
export {
  Activities,
  Babies,
  ChatMessages,
  Chats,
  FamilyMembers,
  Milestones,
  Users,
};

// ANSI color codes for terminal output
export const colors = {
  bgGreen: '\x1b[42m',

  // Background colors
  bgRed: '\x1b[41m',
  bgYellow: '\x1b[43m',
  blue: '\x1b[34m',
  bright: '\x1b[1m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  magenta: '\x1b[35m',

  // Foreground colors
  red: '\x1b[31m',
  reset: '\x1b[0m',
  white: '\x1b[37m',
  yellow: '\x1b[33m',
};

/**
 * Print colored output to console
 */
export function log(message: string, color?: keyof typeof colors) {
  if (color) {
    console.log(`${colors[color]}${message}${colors.reset}`);
  } else {
    console.log(message);
  }
}

/**
 * Print a section header
 */
export function section(title: string) {
  console.log(`\n${'='.repeat(80)}`);
  log(title, 'cyan');
  console.log('='.repeat(80));
}

/**
 * Print a success message
 */
export function success(message: string) {
  log(`✓ ${message}`, 'green');
}

/**
 * Print an error message
 */
export function error(message: string) {
  log(`✗ ${message}`, 'red');
}

/**
 * Print a warning message
 */
export function warning(message: string) {
  log(`⚠ ${message}`, 'yellow');
}

/**
 * Print an info message
 */
export function info(message: string) {
  log(`ℹ ${message}`, 'blue');
}

/**
 * Format a date for display
 */
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return 'null';
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return 'Invalid Date';
  return d.toISOString();
}

/**
 * Format JSON for display with proper indentation
 */
export function formatJSON(obj: unknown): string {
  return JSON.stringify(obj, null, 2);
}

/**
 * Test database connection
 */
export async function testDatabaseConnection(): Promise<boolean> {
  try {
    // Try a simple query
    await db.query.Users.findFirst({ limit: 1 });
    return true;
  } catch {
    return false;
  }
}

/**
 * Get baby details including family and user info
 */
export async function getBabyDetails(babyId: string) {
  return db.query.Babies.findFirst({
    where: eq(Babies.id, babyId),
    with: {
      family: {
        with: {
          familyMembers: {
            with: {
              user: true,
            },
          },
        },
      },
    },
  });
}

/**
 * Get activity counts for a baby
 */
export async function getActivityCounts(babyId: string) {
  const activities = await db.query.Activities.findMany({
    where: eq(Activities.babyId, babyId),
  });

  const scheduled = activities.filter((a) => a.isScheduled);
  const unscheduled = activities.filter((a) => !a.isScheduled);
  const withInvalidDates = activities.filter((a) => {
    if (!a.startTime) return true;
    const date =
      a.startTime instanceof Date ? a.startTime : new Date(a.startTime);
    return Number.isNaN(date.getTime());
  });

  return {
    activities,
    scheduled: scheduled.length,
    total: activities.length,
    unscheduled: unscheduled.length,
    withInvalidDates: withInvalidDates.length,
  };
}

/**
 * Get milestone counts for a baby
 */
export async function getMilestoneCounts(babyId: string) {
  const milestones = await db.query.Milestones.findMany({
    where: eq(Milestones.babyId, babyId),
  });

  const achieved = milestones.filter((m) => m.achievedDate !== null);
  const pending = milestones.filter((m) => m.achievedDate === null);
  const withInvalidDates = achieved.filter((m) => {
    if (!m.achievedDate) return false;
    const date =
      m.achievedDate instanceof Date
        ? m.achievedDate
        : new Date(m.achievedDate);
    return Number.isNaN(date.getTime());
  });

  return {
    achieved: achieved.length,
    milestones,
    pending: pending.length,
    total: milestones.length,
    withInvalidDates: withInvalidDates.length,
  };
}

/**
 * Get chat counts for a baby
 */
export async function getChatCounts(babyId: string) {
  const chats = await db.query.Chats.findMany({
    where: eq(Chats.babyId, babyId),
    with: {
      messages: true,
    },
  });

  const withMessages = chats.filter((c) => c.messages.length > 0);
  const withInvalidDates = chats.filter((c) => {
    if (!c.createdAt) return true;
    const date =
      c.createdAt instanceof Date ? c.createdAt : new Date(c.createdAt);
    return Number.isNaN(date.getTime());
  });

  return {
    chats,
    total: chats.length,
    withInvalidDates: withInvalidDates.length,
    withMessages: withMessages.length,
  };
}

/**
 * Validate a timestamp
 */
export function isValidTimestamp(
  timestamp: Date | string | null | undefined,
): boolean {
  if (!timestamp) return false;
  const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
  return !Number.isNaN(date.getTime());
}

/**
 * Print a table row with padding
 */
export function tableRow(label: string, value: string | number, width = 30) {
  const paddedLabel = label.padEnd(width, ' ');
  console.log(`  ${paddedLabel}: ${value}`);
}

/**
 * Print object details in a readable format
 */
export function printObject(obj: Record<string, unknown>, indent = '  ') {
  for (const [key, value] of Object.entries(obj)) {
    if (value === null || value === undefined) {
      console.log(`${indent}${key}: ${value}`);
    } else if (value instanceof Date) {
      console.log(`${indent}${key}: ${formatDate(value)}`);
    } else if (typeof value === 'object') {
      console.log(`${indent}${key}:`);
      printObject(value as Record<string, unknown>, `${indent}  `);
    } else {
      console.log(`${indent}${key}: ${value}`);
    }
  }
}

/**
 * Get the baby ID from command line args or use default
 */
export function getBabyIdFromArgs(): string {
  const args = process.argv.slice(2);
  return args[0] || 'baby_a2wr6cnjrxinbe6m0ihgnvef';
}

/**
 * Print script header
 */
export function printHeader(scriptName: string, description: string) {
  console.log('\n');
  log(`╔${'═'.repeat(78)}╗`, 'cyan');
  log(`║${' '.repeat(78)}║`, 'cyan');
  log(`║  ${scriptName.padEnd(74, ' ')}║`, 'bright');
  log(`║${' '.repeat(78)}║`, 'cyan');
  log(`║  ${description.padEnd(74, ' ')}║`, 'cyan');
  log(`║${' '.repeat(78)}║`, 'cyan');
  log(`╚${'═'.repeat(78)}╝`, 'cyan');
  console.log('\n');
}

/**
 * Print script footer with summary
 */
export function printFooter(issues: string[], recommendations: string[]) {
  console.log('\n');
  log('═'.repeat(80), 'cyan');
  log('SUMMARY', 'bright');
  log('═'.repeat(80), 'cyan');

  if (issues.length === 0) {
    success('No issues detected!');
  } else {
    error(`Found ${issues.length} issue(s):`);
    for (const issue of issues) {
      console.log(`  • ${issue}`);
    }
  }

  if (recommendations.length > 0) {
    console.log('\n');
    log('RECOMMENDATIONS:', 'yellow');
    for (const rec of recommendations) {
      console.log(`  → ${rec}`);
    }
  }

  console.log('\n');
}

/**
 * Export database client for direct access
 */
export { db };
