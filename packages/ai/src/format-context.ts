// Context Formatters for BAML Prompts
// Converts structured context data into human-readable strings for AI prompts

import type { BamlContextData } from './context-builder';

// ============================================================================
// Chat Context Formatting
// ============================================================================

export function formatChatContext(data: BamlContextData): string {
  const parts: string[] = [];

  // Recent chat summaries
  if (data.chatSummaries.length > 0) {
    parts.push('**Recent Discussion Topics:**');
    data.chatSummaries.forEach((chat, index) => {
      const date = chat.updatedAt.toLocaleDateString();
      parts.push(`${index + 1}. ${chat.title} (${date}): ${chat.summary}`);
    });
    parts.push('');
  }

  // Recent messages (last few exchanges for immediate context)
  if (data.recentChatMessages.length > 0) {
    parts.push('**Latest Chat Messages:**');
    data.recentChatMessages.reverse().forEach((msg) => {
      const role = msg.role === 'user' ? 'Parent' : 'AI';
      const preview =
        msg.content.length > 150
          ? `${msg.content.substring(0, 150)}...`
          : msg.content;
      parts.push(`- ${role}: ${preview}`);
    });
    parts.push('');
  }

  if (parts.length === 0) {
    return 'No recent chat history available.';
  }

  return parts.join('\n');
}

// ============================================================================
// Milestone Context Formatting
// ============================================================================

export function formatMilestoneContext(data: BamlContextData): string {
  if (data.recentMilestones.length === 0) {
    return 'No milestones achieved yet.';
  }

  const parts: string[] = ['**Recently Achieved Milestones:**'];

  data.recentMilestones.forEach((milestone, index) => {
    const date = milestone.achievedDate.toLocaleDateString();
    const description = milestone.description
      ? `: ${milestone.description}`
      : '';
    parts.push(
      `${index + 1}. ${milestone.title} (${milestone.type}) - ${date}${description}`,
    );
  });

  return parts.join('\n');
}

// ============================================================================
// Activity Context Formatting
// ============================================================================

export function formatActivityContext(data: BamlContextData): string {
  const parts: string[] = ['**Activity Summary (Last 3 Days):**'];

  // Feeding
  const { feeding, sleep, diaper } = data.last3DaysActivities;

  parts.push(`\n**Feeding:**`);
  parts.push(`- Count: ${feeding.count} feedings`);
  if (feeding.avgDuration) {
    parts.push(`- Average duration: ${Math.round(feeding.avgDuration)} minutes`);
  }
  if (feeding.patterns) {
    parts.push(`- Pattern: ${feeding.patterns}`);
  }

  // Sleep
  parts.push(`\n**Sleep:**`);
  parts.push(`- Sleep sessions: ${sleep.count}`);
  parts.push(`- Total sleep: ${sleep.totalHours.toFixed(1)} hours`);
  if (sleep.quality) {
    parts.push(`- Quality: ${sleep.quality}`);
  }

  // Diaper
  parts.push(`\n**Diaper Changes:**`);
  parts.push(`- Wet diapers: ${diaper.wet}`);
  parts.push(`- Dirty diapers: ${diaper.dirty}`);
  if (diaper.concerns.length > 0) {
    parts.push(`- Concerns: ${diaper.concerns.join(', ')}`);
  }

  // Other activities
  if (data.last3DaysActivities.other.types.length > 0) {
    parts.push(`\n**Other Activities:**`);
    parts.push(`- Types: ${data.last3DaysActivities.other.types.join(', ')}`);
  }

  // Weekly trends
  parts.push(`\n**Weekly Trends:**`);
  parts.push(`- Feeding: ${data.weeklyTrends.feedingTrend}`);
  parts.push(`- Sleep: ${data.weeklyTrends.sleepTrend}`);
  if (data.weeklyTrends.notableChanges.length > 0) {
    parts.push(
      `- Notable changes: ${data.weeklyTrends.notableChanges.join('; ')}`,
    );
  }

  // Red flags
  if (data.redFlags.length > 0) {
    parts.push(`\n**⚠️ Red Flags:**`);
    data.redFlags.forEach((flag) => {
      parts.push(`- ${flag}`);
    });
  }

  return parts.join('\n');
}

// ============================================================================
// Parent Wellness Context Formatting
// ============================================================================

export function formatParentWellnessContext(data: BamlContextData): string {
  const parts: string[] = ['**Parent Wellness Context:**'];

  // Wellness risk score
  if (data.wellnessRiskScore !== null && data.wellnessRiskScore !== undefined) {
    const riskLevel =
      data.wellnessRiskScore >= 7
        ? 'High Risk'
        : data.wellnessRiskScore >= 4
          ? 'Moderate Risk'
          : 'Low Risk';
    parts.push(`\n**Risk Assessment:** ${riskLevel} (Score: ${data.wellnessRiskScore}/10)`);
  }

  // Recent check-ins
  if (data.recentCheckIns.length > 0) {
    parts.push(`\n**Recent Check-Ins:**`);
    data.recentCheckIns.forEach((checkIn) => {
      const date = checkIn.date.toLocaleDateString();
      const mood = checkIn.moodScore ? ` (Mood: ${checkIn.moodScore}/10)` : '';
      parts.push(`- ${date}${mood}`);

      if (checkIn.concerns.length > 0) {
        parts.push(`  Concerns: ${checkIn.concerns.join(', ')}`);
      }
    });
  }

  // Completed tasks
  if (data.completedTasks.length > 0) {
    parts.push(`\n**Recently Completed Tasks:**`);
    data.completedTasks.slice(0, 5).forEach((task) => {
      const date = task.completedAt.toLocaleDateString();
      parts.push(`- ${task.taskText} (${date})`);
    });
  }

  if (parts.length === 1) {
    return 'No recent parent wellness data available.';
  }

  return parts.join('\n');
}

// ============================================================================
// Medical Context Formatting
// ============================================================================

export function formatMedicalContext(data: BamlContextData): string {
  const parts: string[] = ['**Medical Context:**'];

  // Upcoming appointments
  if (data.upcomingAppointments.length > 0) {
    parts.push(`\n**Upcoming Appointments:**`);
    data.upcomingAppointments.forEach((apt) => {
      const date = apt.date.toLocaleDateString();
      const provider = apt.provider ? ` with ${apt.provider}` : '';
      parts.push(`- ${apt.title} on ${date}${provider}`);
    });
  }

  // Recent appointments
  if (data.recentAppointments.length > 0) {
    parts.push(`\n**Recent Appointments:**`);
    data.recentAppointments.forEach((apt) => {
      const date = apt.date.toLocaleDateString();
      parts.push(`- ${apt.title} (${apt.type}) on ${date}`);
    });
  }

  // Vaccinations
  if (data.activeVaccinations.length > 0) {
    parts.push(`\n**Vaccination History:**`);
    data.activeVaccinations.slice(0, 5).forEach((vax) => {
      const date = vax.date.toLocaleDateString();
      parts.push(`- ${vax.title} on ${date}`);
    });
  }

  // Active medications
  if (data.activeMedications.length > 0) {
    parts.push(`\n**Active Medications:**`);
    data.activeMedications.forEach((med) => {
      parts.push(`- ${med.name}${med.dosage ? `: ${med.dosage}` : ''}`);
    });
  }

  if (parts.length === 1) {
    return 'No recent medical records available.';
  }

  return parts.join('\n');
}

// ============================================================================
// Combined Context Formatting
// ============================================================================

/**
 * Formats all context sections into a single comprehensive string.
 * Use this when you want to provide complete context to the AI.
 */
export function formatAllContext(data: BamlContextData): string {
  const sections: string[] = [];

  const chat = formatChatContext(data);
  if (!chat.includes('No recent')) {
    sections.push(chat);
  }

  const milestones = formatMilestoneContext(data);
  if (!milestones.includes('No milestones')) {
    sections.push(milestones);
  }

  const activities = formatActivityContext(data);
  sections.push(activities);

  const wellness = formatParentWellnessContext(data);
  if (!wellness.includes('No recent parent')) {
    sections.push(wellness);
  }

  const medical = formatMedicalContext(data);
  if (!medical.includes('No recent medical')) {
    sections.push(medical);
  }

  return sections.join('\n\n---\n\n');
}

/**
 * Formats context selectively based on what's relevant for the specific use case.
 * This is useful when you don't need all context sections.
 */
export function formatSelectiveContext(
  data: BamlContextData,
  options: {
    includeChat?: boolean;
    includeMilestones?: boolean;
    includeActivities?: boolean;
    includeWellness?: boolean;
    includeMedical?: boolean;
  },
): string {
  const sections: string[] = [];

  if (options.includeChat) {
    const chat = formatChatContext(data);
    if (!chat.includes('No recent')) {
      sections.push(chat);
    }
  }

  if (options.includeMilestones) {
    const milestones = formatMilestoneContext(data);
    if (!milestones.includes('No milestones')) {
      sections.push(milestones);
    }
  }

  if (options.includeActivities) {
    const activities = formatActivityContext(data);
    sections.push(activities);
  }

  if (options.includeWellness) {
    const wellness = formatParentWellnessContext(data);
    if (!wellness.includes('No recent parent')) {
      sections.push(wellness);
    }
  }

  if (options.includeMedical) {
    const medical = formatMedicalContext(data);
    if (!medical.includes('No recent medical')) {
      sections.push(medical);
    }
  }

  return sections.join('\n\n---\n\n');
}

