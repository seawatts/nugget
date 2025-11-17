// BAML function for generating contextual milestone suggestions
// Provides AI-powered milestone suggestions based on baby's current data and activities

// ============================================================================
// Classes
// ============================================================================

class MilestoneSuggestion {
  title string @description("Concise milestone title (max 6 words)")
  type string @description("Milestone type: 'physical', 'cognitive', 'social', 'language', or 'self_care'")
  description string @description("Brief description (max 12 words)")
  ageLabel string @description("Age context label (e.g., 'Week 2', 'Day 5')")
  relevance string @description("Why relevant now (max 15 words)")
}

class ContextualMilestonesOutput {
  milestones MilestoneSuggestion[] @description("2-3 contextually relevant milestone suggestions based on baby's current stage and activities")
}

// ============================================================================
// Functions
// ============================================================================

function GenerateContextualMilestones(
  babyName: string,
  ageInDays: int,
  ageInWeeks: int,
  currentWeightOz: int?,
  birthWeightOz: int?,
  height: int?,
  feedingCount24h: int?,
  avgFeedingInterval: float?,
  sleepCount24h: int?,
  totalSleepHours24h: float?,
  diaperCount24h: int?,
  avgFeedingsPerDay: float?,
  avgSleepHoursPerDay: float?,
  avgDiaperChangesPerDay: float?,
  recentDiaperColors: string?,
  hasTummyTimeActivity: bool?
) -> ContextualMilestonesOutput {
  client CustomGPT4oMini
  prompt #"
    {{_.role("system")}}
    You are a pediatric development expert suggesting relevant milestones for parents to watch for based on their baby's current age and recent activities.

    {{_.role("user")}}
    Generate 2-3 contextually relevant milestone suggestions for {{babyName}}.

    Baby Context:
    - Age: {{ageInDays}} days ({{ageInWeeks}} weeks)
    {% if currentWeightOz and birthWeightOz %}- Weight: {{currentWeightOz}}oz (birth: {{birthWeightOz}}oz, change: {{currentWeightOz - birthWeightOz}}oz){% endif %}
    {% if height %}- Height: {{height}}cm{% endif %}

    {% if feedingCount24h or sleepCount24h or diaperCount24h %}
    Recent Activity (24h):
    {% if feedingCount24h %}- Feedings: {{feedingCount24h}}{% if avgFeedingInterval %} (avg {{avgFeedingInterval}}h intervals){% endif %}{% endif %}
    {% if sleepCount24h %}- Sleep: {{sleepCount24h}} sessions{% if totalSleepHours24h %} ({{totalSleepHours24h}}h total){% endif %}{% endif %}
    {% if diaperCount24h %}- Diapers: {{diaperCount24h}} changes{% endif %}
    {% if recentDiaperColors %}- Recent diaper colors: {{recentDiaperColors}}{% endif %}
    {% endif %}

    {% if avgFeedingsPerDay or avgSleepHoursPerDay or avgDiaperChangesPerDay %}
    Weekly Patterns:
    {% if avgFeedingsPerDay %}- Avg feedings/day: {{avgFeedingsPerDay}}{% endif %}
    {% if avgSleepHoursPerDay %}- Avg sleep/day: {{avgSleepHoursPerDay}}h{% endif %}
    {% if avgDiaperChangesPerDay %}- Avg diapers/day: {{avgDiaperChangesPerDay}}{% endif %}
    {% endif %}

    {% if hasTummyTimeActivity %}
    - Parents have been doing tummy time activities
    {% endif %}

    Based on {{babyName}}'s age and recent activities, suggest 2-3 milestones that are:
    1. Age-appropriate (within the typical range for {{ageInWeeks}} weeks)
    2. Contextually relevant (related to their recent activities or data patterns)
    3. Varied in type (mix of physical, cognitive, social, language, self_care)
    4. Observable by parents in daily care

    For each milestone suggestion:
    - **title**: Clear, concise title (max 6 words)
    - **type**: One of: 'physical', 'cognitive', 'social', 'language', 'self_care'
    - **description**: Brief description of what to watch for (max 12 words)
    - **ageLabel**: Context like "Week {{ageInWeeks}}" or "Day {{ageInDays}}"
    - **relevance**: Why relevant NOW based on data (max 15 words)

    Examples of contextual reasoning:
    - If diaper colors changed recently → suggest "First Yellow Stool" milestone
    - If baby is 2+ weeks → suggest "First Social Smile"
    - If tummy time activities present → suggest "Lifts Head During Tummy Time"
    - If sleep patterns are consolidating → suggest "Longer Sleep Stretches"
    - If feeding intervals increasing → suggest "Eating More Efficiently"

    {{ ctx.output_format }}
  "#
}

// ============================================================================
// Tests
// ============================================================================

test contextual_milestones_week_1 {
  functions [GenerateContextualMilestones]
  args {
    babyName "Riley"
    ageInDays 7
    ageInWeeks 1
    currentWeightOz 118
    birthWeightOz 115
    height 52
    feedingCount24h 10
    avgFeedingInterval 2.4
    sleepCount24h 8
    totalSleepHours24h 16.0
    diaperCount24h 8
    avgFeedingsPerDay 10.0
    avgSleepHoursPerDay 16.0
    avgDiaperChangesPerDay 8.0
    recentDiaperColors "black, yellow"
    hasTummyTimeActivity false
  }
}

test contextual_milestones_week_4 {
  functions [GenerateContextualMilestones]
  args {
    babyName "Alex"
    ageInDays 28
    ageInWeeks 4
    currentWeightOz 135
    birthWeightOz 120
    height 55
    feedingCount24h 8
    avgFeedingInterval 3.0
    sleepCount24h 6
    totalSleepHours24h 14.5
    diaperCount24h 7
    avgFeedingsPerDay 8.5
    avgSleepHoursPerDay 15.0
    avgDiaperChangesPerDay 7.5
    recentDiaperColors "yellow, brown"
    hasTummyTimeActivity true
  }
}

test contextual_milestones_week_8 {
  functions [GenerateContextualMilestones]
  args {
    babyName "Jordan"
    ageInDays 56
    ageInWeeks 8
    currentWeightOz 165
    birthWeightOz 120
    height 58
    feedingCount24h 7
    avgFeedingInterval 3.4
    sleepCount24h 5
    totalSleepHours24h 13.0
    diaperCount24h 6
    avgFeedingsPerDay 7.0
    avgSleepHoursPerDay 14.0
    avgDiaperChangesPerDay 6.5
    recentDiaperColors "yellow, green"
    hasTummyTimeActivity true
  }
}

