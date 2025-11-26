// BAML function for daily parent wellness question
// Generates one personalized question per day with 2-4 multiple choice answers
// Focuses on parent mood/feelings with context from baby data and previous responses

// ============================================================================
// Classes
// ============================================================================

class DailyWellnessQuestionOutput {
  question string @description("The daily wellness question for the parent")
  answerChoices string[] @description("Array of 2-4 answer options for the question")
}

// ============================================================================
// Functions
// ============================================================================

function DailyWellnessQuestion(
  // Baby context
  babyName: string,
  babyAgeInDays: int,
  babyAgeInWeeks: int,

  // Recent activity (24h)
  feedingCount24h: int?,
  sleepHours24h: float?,
  diaperCount24h: int?,

  // Previous responses (last 7-14 days)
  previousResponses: string?,

  // Goal tracking context
  currentStreak: int?,
  weeklyCompletionCount: int?,

  // Time context
  daysSinceLastResponse: int?
) -> DailyWellnessQuestionOutput {
  client CustomGPT4oMini
  prompt #"
    {{_.role("system")}}
    You are a compassionate, supportive AI assistant helping parents track their daily well-being. Your goal is to create ONE simple, caring question per day that helps parents check in with themselves.

    Your questions should:
    - Focus on parent mood, feelings, energy, or support needs
    - Be quick to answer (2-4 seconds max)
    - Feel like a caring friend checking in, not a medical assessment
    - Be validating and normalize all feelings (good days and hard days are both normal)
    - Consider the baby's age and recent patterns when relevant
    - Avoid repetition from recent questions
    - Be specific to their current situation when helpful

    Question examples:
    - "How are you feeling today?"
    - "How's your energy level?"
    - "How supported do you feel right now?"
    - "How did you sleep last night?"
    - "What's one thing that went well today?"
    - "How are you managing today?"

    Answer choices should:
    - Be 2-4 options (usually 3 is ideal)
    - Be simple, clear, and easy to understand
    - Cover a range of feelings/experiences
    - Not be judgmental (all answers are valid)
    - Be specific enough to be meaningful but broad enough to apply to most parents

    Answer choice examples:
    - For "How are you feeling?": ["Good", "Okay", "Struggling"]
    - For "How's your energy?": ["Energized", "Moderate", "Low", "Exhausted"]
    - For "How supported do you feel?": ["Very supported", "Somewhat supported", "Not very supported"]
    - For "How did you sleep?": ["Great", "Okay", "Not well"]

    {{_.role("user")}}
    Generate ONE daily wellness question for a parent.

    Baby Context:
    - Name: {{babyName}}
    - Age: {{babyAgeInDays}} days ({{babyAgeInWeeks}} weeks)

    {% if feedingCount24h or sleepHours24h or diaperCount24h %}
    Recent Activity (Last 24 hours):
    {% if feedingCount24h %}- Feedings: {{feedingCount24h}}{% endif %}
    {% if sleepHours24h %}- Baby sleep: {{sleepHours24h}} hours{% endif %}
    {% if diaperCount24h %}- Diaper changes: {{diaperCount24h}}{% endif %}
    {% endif %}

    {% if previousResponses %}
    Previous Questions & Answers (for context, avoid repetition):
    {{previousResponses}}
    {% endif %}

    {% if currentStreak %}
    Current streak: {{currentStreak}} days
    {% endif %}

    {% if weeklyCompletionCount %}
    This week: {{weeklyCompletionCount}}/7 days completed
    {% endif %}

    {% if daysSinceLastResponse and daysSinceLastResponse > 1 %}
    Note: It's been {{daysSinceLastResponse}} days since last response - make the question welcoming and encouraging.
    {% endif %}

    Create a question that:
    1. Is relevant to their current situation (consider baby age and recent activity)
    2. Hasn't been asked recently (check previous responses)
    3. Feels supportive and caring
    4. Can be answered quickly with 2-4 simple choices
    5. Helps them reflect on their well-being

    Return the question and 2-4 answer choices.

    {{ ctx.output_format }}
  "#
}

// ============================================================================
// Tests
// ============================================================================

test daily_wellness_new_parent {
  functions [DailyWellnessQuestion]
  args {
    babyName "Riley"
    babyAgeInDays 5
    babyAgeInWeeks 0
    feedingCount24h 10
    sleepHours24h 16.5
    diaperCount24h 8
    previousResponses null
    currentStreak 0
    weeklyCompletionCount 0
    daysSinceLastResponse null
  }
}

test daily_wellness_with_history {
  functions [DailyWellnessQuestion]
  args {
    babyName "Riley"
    babyAgeInDays 45
    babyAgeInWeeks 6
    feedingCount24h 8
    sleepHours24h 14.0
    diaperCount24h 6
    previousResponses "Yesterday: 'How are you feeling today?' - Answered: 'Okay'\n2 days ago: 'How's your energy level?' - Answered: 'Low'"
    currentStreak 2
    weeklyCompletionCount 2
    daysSinceLastResponse 0
  }
}

