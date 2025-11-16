// BAML function for daily parent check-in questions
// Provides AI-powered personalized questions based on baby context and parent role

// ============================================================================
// Classes
// ============================================================================

enum ResponseType {
  EMOJI_SCALE // 😢 😐 😊
  YES_NO
  RATING_1_5
  TEXT_SHORT
}

class CheckInQuestion {
  question string @description("The check-in question to ask the parent")
  responseType ResponseType @description("Type of response expected")
  category string @description("Category: 'physical', 'emotional', 'support', 'baby_concern', or 'self_care'")
  priority string @description("Priority level: 'routine', 'important', or 'urgent'")
  followUpPrompt string? @description("Optional follow-up prompt if response indicates concern")
}

class DailyCheckInQuestionsOutput {
  questions CheckInQuestion[] @description("3-5 personalized check-in questions for today")
}

// ============================================================================
// Functions
// ============================================================================

function DailyCheckInQuestions(
  ppDay: int,
  parentRole: string,
  parentSleepHours: float?,
  ageInDays: int,
  ageInWeeks: int,
  firstPregnancy: bool,
  avgFeedingsPerDay: float?,
  avgSleepHoursPerDay: float?,
  avgDiaperChangesPerDay: float?
) -> DailyCheckInQuestionsOutput {
  client CustomGPT4oMini
  prompt #"
    {{_.role("system")}}
    You are a compassionate postpartum care specialist creating personalized daily check-in questions for parents.

    Your goal is to:
    - Monitor physical and emotional well-being
    - Identify potential concerns early (postpartum depression, anxiety, physical complications)
    - Provide appropriate support based on their role and situation
    - Make questions feel supportive, not clinical
    - Keep questions brief and easy to answer

    Guidelines:
    - For moms in first 2 weeks: Focus on physical recovery, bleeding, pain, breastfeeding challenges
    - For moms weeks 3-6: Balance physical recovery with emotional well-being
    - For partners: Focus on their well-being, support capacity, bonding, and partnership
    - For all: Monitor sleep deprivation, overwhelming feelings, support systems
    - Vary between physical, emotional, and practical concerns
    - Reference the baby's age and specific milestones when relevant

    Red flags to watch for:
    - Thoughts of harming self or baby
    - Severe mood swings
    - Inability to sleep even when baby sleeps
    - Excessive crying or inability to stop crying
    - Severe physical pain (beyond normal recovery)
    - Isolation or withdrawal

    {{_.role("user")}}
    Create 3-5 personalized check-in questions for today.

    Parent Context:
    - Role: {{parentRole}}
    - Days postpartum: {{ppDay}}
    - Baby age: {{ageInDays}} days ({{ageInWeeks}} weeks)
    {% if firstPregnancy %}- First-time parent{% endif %}
    {% if parentSleepHours %}- Parent sleep last 24h: {{parentSleepHours}}h{% endif %}

    {% if avgFeedingsPerDay or avgSleepHoursPerDay or avgDiaperChangesPerDay %}
    Baby's patterns:
    {% if avgFeedingsPerDay %}- Avg feedings/day: {{avgFeedingsPerDay}}{% endif %}
    {% if avgSleepHoursPerDay %}- Avg sleep/day: {{avgSleepHoursPerDay}}h{% endif %}
    {% if avgDiaperChangesPerDay %}- Avg diapers/day: {{avgDiaperChangesPerDay}}{% endif %}
    {% endif %}

    For each question:
    - question: Clear, empathetic question (keep it conversational)
    - responseType: Choose EMOJI_SCALE for mood/feelings, YES_NO for binary, RATING_1_5 for intensity, TEXT_SHORT for open-ended
    - category: 'physical', 'emotional', 'support', 'baby_concern', or 'self_care'
    - priority: 'routine' for normal check-ins, 'important' for things to monitor closely, 'urgent' for red flags
    - followUpPrompt: Only include if the question might reveal a concern that needs follow-up

    Make questions:
    - Specific to their postpartum day and role
    - Easy to answer quickly (busy parents!)
    - Progressive (harder/more personal questions after building rapport)
    - Culturally sensitive and non-judgmental
    - Focused on one thing at a time

    {{ ctx.output_format }}
  "#
}

// ============================================================================
// Tests
// ============================================================================

test daily_checkin_mom_day_3 {
  functions [DailyCheckInQuestions]
  args {
    ppDay 3
    parentRole "primary"
    parentSleepHours 4.5
    ageInDays 3
    ageInWeeks 0
    firstPregnancy true
    avgFeedingsPerDay 10.0
    avgSleepHoursPerDay 15.0
    avgDiaperChangesPerDay 8.0
  }
}

test daily_checkin_partner_week_2 {
  functions [DailyCheckInQuestions]
  args {
    ppDay 14
    parentRole "partner"
    parentSleepHours 6.0
    ageInDays 14
    ageInWeeks 2
    firstPregnancy true
    avgFeedingsPerDay 9.0
    avgSleepHoursPerDay 14.0
    avgDiaperChangesPerDay 7.0
  }
}

