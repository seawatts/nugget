// BAML function for generating personalized celebration summaries
// Creates warm, contextual messages celebrating baby milestones

// ============================================================================
// Classes
// ============================================================================

class CelebrationStatistics {
  ageInDays int
  ageLabel string
  feedingCount int?
  sleepHours float?
  diaperCount int?
  weightGain string?
}

class CelebrationSummaryOutput {
  summary string @description("Warm, personalized celebration message (20-30 words) that references baby's name and specific achievement")
}

// ============================================================================
// Functions
// ============================================================================

function GenerateCelebrationSummary(
  babyName: string,
  ageInDays: int,
  celebrationType: string,
  celebrationTitle: string,
  statistics: CelebrationStatistics,
  recentMilestones: string?,
  recentActivities: string?,
  medicalContext: string?
) -> CelebrationSummaryOutput {
  client CustomGPT4oMini
  prompt #"
    {{_.role("system")}}
    You are a warm, celebratory AI assistant helping parents celebrate their baby's special moments.

    CRITICAL RULES - YOU MUST FOLLOW THESE:
    1. NEVER EVER repeat the celebration title "{{celebrationTitle}}" in your message
    2. NEVER say "Happy [X] Birthday" or "Celebrating [milestone]" - the user already sees this
    3. NEVER mention the age or milestone name - it's already displayed prominently
    4. DO NOT use congratulatory phrases like "What a milestone!" or "Congratulations!"

    WHAT YOU SHOULD DO:
    - Share a recent developmental observation about {{babyName}}
    - Then mention what exciting milestone is coming soon
    - Use specific details from their statistics when relevant
    - Be educational and forward-looking
    - Keep it conversational and warm
    - 20-30 words total

    {{_.role("user")}}
    Generate a celebration summary for {{babyName}}.

    ═══════════════════════════════════════════════════════════════
    CELEBRATION DETAILS
    ═══════════════════════════════════════════════════════════════
    Type: {{celebrationType}}
    Title: {{celebrationTitle}}
    Age: {{ageInDays}} days ({{statistics.ageLabel}})

    ═══════════════════════════════════════════════════════════════
    TODAY'S STATISTICS
    ═══════════════════════════════════════════════════════════════
    {% if statistics.feedingCount %}Feedings: {{statistics.feedingCount}}{% endif %}
    {% if statistics.sleepHours %}Sleep: {{statistics.sleepHours}} hours{% endif %}
    {% if statistics.diaperCount %}Diapers: {{statistics.diaperCount}}{% endif %}
    {% if statistics.weightGain %}Weight gain: {{statistics.weightGain}}{% endif %}

    {% if recentMilestones %}
    ═══════════════════════════════════════════════════════════════
    RECENT MILESTONES
    ═══════════════════════════════════════════════════════════════
    {{recentMilestones}}
    {% endif %}

    {% if recentActivities %}
    ═══════════════════════════════════════════════════════════════
    RECENT ACTIVITIES (24H)
    ═══════════════════════════════════════════════════════════════
    {{recentActivities}}
    {% endif %}

    {% if medicalContext %}
    ═══════════════════════════════════════════════════════════════
    MEDICAL CONTEXT
    ═══════════════════════════════════════════════════════════════
    {{medicalContext}}
    {% endif %}

    Create a celebration message with TWO parts:
    1. RECENT MILESTONE: What {{babyName}} has recently accomplished or what you've noticed
    2. WHAT'S NEXT: What to expect soon or what developmental stage is coming

    Structure:
    - First sentence: Recent achievement/observation (e.g., "{{babyName}} is now focusing on faces...")
    - Second sentence: Forward-looking expectation (e.g., "Soon they'll start to smile back!")
    - Total: 20-30 words combined
    - Use {{babyName}}'s name naturally in at least one sentence
    - DO NOT repeat the title "{{celebrationTitle}}"
    - Be specific and age-appropriate

    Examples of GOOD summaries (don't copy these, just use as inspiration):
    - "{{babyName}} is starting to track movement with their eyes. Soon you'll see their first social smile!"
    - "At 2 weeks, {{babyName}} recognizes your voice. Watch for those tiny coos to begin any day now!"
    - "{{babyName}} just doubled their alert time during the day. Next up: longer stretches of sleep at night!"
    - "Their startle reflex is strong now. In a few weeks, {{babyName}} will have better head control during tummy time."
    - "{{babyName}} is settling into feeding patterns. Soon they'll start showing hunger cues before crying!"

    Examples of BAD summaries (avoid these):
    - "Celebrating {{babyName}}'s special milestone today! Happy 2 Week Birthday!" (too repetitive)
    - "Congratulations on reaching this milestone!" (no specific details or forward-looking)
    - "What an achievement! More to come!" (too vague)
    - "{{babyName}} is growing!" (not specific enough)
  "#
}

