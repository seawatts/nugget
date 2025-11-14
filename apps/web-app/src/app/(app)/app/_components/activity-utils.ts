/**
 * Parse sleep type from notes (if present) and return clean notes
 */
export function parseSleepNotes(notes: string | null | undefined): {
  sleepType: 'nap' | 'night' | null;
  cleanNotes: string;
} {
  if (!notes) {
    return { cleanNotes: '', sleepType: null };
  }

  const sleepTypeMatch = notes.match(/^\[sleepType:(nap|night)\]/);
  if (sleepTypeMatch) {
    const sleepType = sleepTypeMatch[1] as 'nap' | 'night';
    const cleanNotes = notes.replace(/^\[sleepType:(nap|night)\]\s*/, '');
    return { cleanNotes, sleepType };
  }

  return { cleanNotes: notes, sleepType: null };
}

/**
 * Encode sleep type into notes
 */
export function encodeSleepNotes(
  sleepType: 'nap' | 'night',
  notes: string,
): string {
  return `[sleepType:${sleepType}]${notes ? ` ${notes}` : ''}`;
}

/**
 * Get clean display notes (removes sleep type marker)
 */
export function getDisplayNotes(
  notes: string | null | undefined,
): string | null {
  if (!notes) return null;
  const { cleanNotes } = parseSleepNotes(notes);
  return cleanNotes || null;
}

export function getDefaultActivityData(
  activityType:
    | 'sleep'
    | 'feeding'
    | 'bottle'
    | 'nursing'
    | 'pumping'
    | 'diaper'
    | 'wet'
    | 'dirty'
    | 'both'
    | 'solids'
    | 'bath'
    | 'medicine'
    | 'temperature'
    | 'tummy_time'
    | 'growth'
    | 'potty',
  _birthDate: Date | null,
) {
  const now = new Date();

  switch (activityType) {
    case 'sleep':
      return {
        startTime: now,
        type: 'sleep' as const,
      };
    case 'nursing':
      return {
        startTime: now,
        type: 'nursing' as const,
      };
    case 'bottle':
      return {
        startTime: now,
        type: 'bottle' as const,
      };
    case 'solids':
      return {
        startTime: now,
        type: 'solids' as const,
      };
    case 'diaper':
      return {
        startTime: now,
        type: 'diaper' as const,
      };
    case 'pumping':
      return {
        startTime: now,
        type: 'pumping' as const,
      };
    case 'potty':
      return {
        startTime: now,
        type: 'potty' as const,
      };
    case 'tummy_time':
      return {
        startTime: now,
        type: 'tummy_time' as const,
      };
    case 'medicine':
      return {
        startTime: now,
        type: 'medicine' as const,
      };
    case 'temperature':
      return {
        startTime: now,
        type: 'temperature' as const,
      };
    case 'growth':
      return {
        startTime: now,
        type: 'growth' as const,
      };
    case 'bath':
      return {
        startTime: now,
        type: 'bath' as const,
      };
    case 'feeding':
    case 'wet':
    case 'dirty':
    case 'both':
      // These types exist in the enum but don't have specific defaults
      return {
        startTime: now,
        type: activityType,
      };
  }
}

export function formatActivityForToast(
  activityType:
    | 'sleep'
    | 'feeding'
    | 'bottle'
    | 'nursing'
    | 'pumping'
    | 'diaper'
    | 'wet'
    | 'dirty'
    | 'both'
    | 'solids'
    | 'bath'
    | 'medicine'
    | 'temperature'
    | 'tummy_time'
    | 'growth'
    | 'potty',
  _activityData: ReturnType<typeof getDefaultActivityData>,
): string {
  switch (activityType) {
    case 'sleep':
      return 'Sleep tracking started';
    case 'nursing':
      return 'Nursing session logged';
    case 'bottle':
      return 'Bottle feeding logged';
    case 'solids':
      return 'Solid food logged';
    case 'diaper':
      return 'Diaper change logged';
    case 'pumping':
      return 'Pumping session logged';
    case 'potty':
      return 'Potty visit logged';
    case 'tummy_time':
      return 'Tummy time logged';
    case 'medicine':
      return 'Medicine logged';
    case 'temperature':
      return 'Temperature logged';
    case 'growth':
      return 'Growth measurement logged';
    case 'bath':
      return 'Bath logged';
    default:
      return 'Activity logged';
  }
}
