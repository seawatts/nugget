// BAML function for sleep regression guidance
// Provides AI-powered tips for handling baby sleep regressions

// ============================================================================
// Classes
// ============================================================================

class SleepRegressionTipsOutput {
  tips LearningTip[] @description("Array of 3-5 practical tips for handling sleep regression, personalized to the baby's current situation")
}

// ============================================================================
// Functions
// ============================================================================

function SleepRegressionTips(
  babyName: string,
  week: int,
  ageInDays: int,
  currentWeightOz: int?,
  birthWeightOz: int?,
  sleepCount24h: int?,
  totalSleepHours24h: float?,
  avgSleepHoursPerDay: float?,
  feedingCount24h: int?
) -> SleepRegressionTipsOutput {
  client CustomGPT4oMini
  prompt #"
    {{_.role("system")}}
    You are a pediatric sleep consultant providing practical advice for common sleep regressions.

    IMPORTANT CONTEXT - About the Nugget App:
    The parents are using Nugget, a comprehensive parenting app that already provides:

    TRACKING CAPABILITIES (already built-in):
    - Sleep tracking with start/end times, duration, and patterns
    - Feeding logs (breastfeeding, bottle, pumping) with amounts and timing
    - Diaper changes, growth measurements, activities
    - Automatic pattern recognition and sleep trend analysis

    ANALYSIS & INSIGHTS (already available):
    - Visual sleep charts showing patterns over time
    - Predictive cards suggesting when next sleep is likely
    - Daily and weekly sleep summaries
    - Correlation analysis between feeding, activities, and sleep

    LEARNING & SUPPORT (already included):
    - AI Chat assistant for personalized sleep questions
    - Learning Hub with sleep training resources
    - Sleep Plans feature for structured approaches
    - Partner Support guides for coordinating care

    Your role is to:
    ✓ Help parents UNDERSTAND why sleep regressions happen
    ✓ EDUCATE about developmental leaps affecting sleep
    ✓ EXPLAIN what their tracked data reveals about patterns
    ✓ Build CONFIDENCE that regressions are temporary

    Do NOT suggest tracking features the app already has
    DO focus on helping them interpret sleep data, understand developmental stages, and adapt their approach

    {{_.role("user")}}
    Provide 3-5 practical tips for handling sleep regression around week {{week}}.

    Baby: {{babyName}}

    Baby Context:
    - Age: {{ageInDays}} days ({{week}} weeks)
    {% if currentWeightOz and birthWeightOz %}- Weight: {{currentWeightOz}}oz (birth: {{birthWeightOz}}oz){% endif %}

    {% if sleepCount24h or avgSleepHoursPerDay %}
    Sleep Patterns:
    {% if sleepCount24h %}- Last 24h: {{sleepCount24h}} sessions{% if totalSleepHours24h %}, {{totalSleepHours24h}}h total{% endif %}{% endif %}
    {% if avgSleepHoursPerDay %}- Weekly average: {{avgSleepHoursPerDay}}h per day{% endif %}
    {% endif %}

    {% if feedingCount24h %}- Recent feedings (24h): {{feedingCount24h}}{% endif %}

    For each tip, provide:
    - category: Choose one of: 'feeding', 'sleep', 'diaper', 'development', 'health', or 'postpartum'
    - subtitle: A catchy 4-5 word subtitle (max 5 words)
    - summary: One concise sentence (max 15 words)
    - bulletPoints: 2-3 actionable bullet points (each bullet max 20 words)
    - followUpQuestion: ONE focused, practical question that prompts the parent to share specific observations
      * Ask ONE question only - NO compound questions with "and" or multiple parts
      * CRITICAL: We already track COUNTS and DURATIONS (number of sleep sessions, total hours, wake counts, etc.)
      * DON'T ask about quantities we're already tracking
      * Keep it simple, direct, and non-judgmental
      * Avoid quiz-like or educational testing questions

    FOLLOW-UP QUESTIONS - Generate a mix of yes/no and open-ended:
    * REQUIREMENT: Include at least 1-2 yes/no questions in your 3-5 tips

    * YES/NO QUESTIONS - Set isYesNoQuestion: true for sleep-specific checks:
      Examples:
      - "Is {{babyName}} showing distress at bedtime?"
      - "Does {{babyName}} cry when waking at night?"
      - "Are you noticing any new sleep patterns this week?"
      - "Is {{babyName}} resisting sleep more than usual?"
      - "Does {{babyName}} show clear tiredness cues before sleep?"
      - "Is {{babyName}} waking more frequently than last week?"

    * For yes/no questions, decide which answer(s) should open chat:
      - openChatOnYes: true if "yes" indicates concern (e.g., showing distress, resisting sleep)
      - openChatOnNo: true if "no" indicates concern (e.g., not showing tiredness cues)
      - Provide helpful pre-filled prompts:
        * yesResponsePrompt: Supportive message for "yes" (e.g., "{{babyName}} is showing distress at bedtime. What can I do to help?")
        * noResponsePrompt: Supportive message for "no" (e.g., "{{babyName}} isn't showing tiredness cues. How can I tell when to put them down?")

    * OPEN-ENDED QUESTIONS - Set isYesNoQuestion: false for qualitative questions:
      Examples:
      - "What does {{babyName}} do when waking at night?"
      - "How does {{babyName}} settle back to sleep?"
      - "What seems to help {{babyName}} sleep better?"

    * Question Type Guidelines:
      - Use YES/NO for: Sleep concerns, behavioral changes, pattern shifts, distress indicators
      - Use OPEN-ENDED for: Sleep behaviors, settling methods, qualitative experiences

    Make each tip:
    - Specific and actionable
    - Reference their actual tracked sleep data when relevant (e.g., "Your logs show 3 wake-ups")
    - Use {{babyName}}'s name naturally in the content when appropriate
    - Educational about WHY regressions happen, not just what to do
    - Empathetic to exhausted parents while building understanding
    - Help parents see temporary patterns vs. new baselines
    - Varied in category where appropriate

    {{ ctx.output_format }}
  "#
}

// ============================================================================
// Tests
// ============================================================================

test sleep_regression_week_4 {
  functions [SleepRegressionTips]
  args {
    babyName "Riley"
    week 4
    ageInDays 28
    currentWeightOz 140
    birthWeightOz 115
    sleepCount24h 6
    totalSleepHours24h 12.0
    avgSleepHoursPerDay 13.5
    feedingCount24h 8
  }
}

test sleep_regression_week_12 {
  functions [SleepRegressionTips]
  args {
    babyName "Riley"
    week 12
    ageInDays 84
    currentWeightOz 180
    birthWeightOz 115
    sleepCount24h 5
    totalSleepHours24h 11.0
    avgSleepHoursPerDay 12.0
    feedingCount24h 6
  }
}

