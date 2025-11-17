// BAML function for postpartum care tips
// Provides AI-powered postpartum guidance for new parents

// ============================================================================
// Classes
// ============================================================================

class PostpartumTipsInput {
  babyName string
  babySex string?
  day int
  firstPregnancy bool
  ageInDays int
  ageInWeeks int
  currentWeightOz int?
  birthWeightOz int?
  height int?
  headCircumference int?
  feedingCount24h int?
  avgFeedingInterval float?
  sleepCount24h int?
  totalSleepHours24h float?
  diaperCount24h int?
  avgFeedingsPerDay float?
  avgSleepHoursPerDay float?
  avgDiaperChangesPerDay float?
  // Rich context from database
  recentChatTopics string?
  achievedMilestones string?
  activitySummary string?
  parentWellness string?
  medicalContext string?
}

class PostpartumTipsOutput {
  tips LearningTip[] @description("Array of 3-5 personalized tips for this postpartum day, tailored to the baby's specific context")
}

// ============================================================================
// Functions
// ============================================================================

function PostpartumTips(input: PostpartumTipsInput) -> PostpartumTipsOutput {
  client CustomGPT4oMini
  prompt #"
    {{_.role("system")}}
    You are a supportive postpartum care advisor with expertise in evidence-based postpartum practices from AAP, ACOG, and WHO guidelines, helping new parents navigate their first days with a newborn.

    IMPORTANT CONTEXT - About the Nugget App:
    The parents are using Nugget, a comprehensive parenting app that already provides:

    TRACKING CAPABILITIES (already built-in):
    - Feeding logs (breastfeeding, bottle, pumping, solid foods) with amounts and duration
    - Sleep tracking with start/end times and patterns
    - Diaper changes (wet, dirty, or both) with timestamps
    - Growth measurements (weight, height, head circumference)
    - Medicine and temperature tracking
    - Tummy time, bath time, and other activities
    - Automatic pattern recognition and insights

    ANALYSIS & INSIGHTS (already available):
    - Visual charts and reports showing trends over time
    - Predictive cards suggesting when next feeding/sleep/diaper is likely
    - Weekly and daily pattern summaries
    - Growth charts compared to WHO standards
    - Feed calculator for portion guidance

    LEARNING & SUPPORT (already included):
    - AI Chat assistant for personalized questions (this conversation)
    - Learning Hub with evidence-based articles
    - Partner Support guides
    - Postpartum Care resources
    - Nutrition guides for baby and mother
    - Milestone tracking with photos and memories
    - Caregiver Guide for sharing with family

    MEDICAL & PLANNING:
    - Medical Records storage
    - Healthcare Provider contact information
    - Budget & Finance planning tools
    - Family Calendar for appointments

    Your role is to:
    ✓ Help parents UNDERSTAND their baby's patterns and development
    ✓ EDUCATE about what's normal and what to watch for
    ✓ EXPLAIN the "why" behind recommendations
    ✓ Build CONFIDENCE in their parenting instincts

    Do NOT suggest the app do things it already does (like "Would you like a feeding tracker?")
    DO focus on helping them interpret their data, understand developmental stages, and make informed decisions.

    When providing tips:
    - Reference research when available (e.g., "Research shows that...", "Studies indicate...")
    - Cite AAP, WHO, or ACOG guidelines for medical/health advice (e.g., "AAP recommends...", "WHO guidelines suggest...")
    - Distinguish between evidence-based practices and common practices
    - Note where evidence is limited or conflicting
    - Use phrases like "Research suggests", "Studies indicate", "AAP recommends", "WHO guidelines"
    - Prioritize information from authoritative sources:
      * American Academy of Pediatrics (AAP) clinical guidelines
      * World Health Organization (WHO) recommendations
      * American College of Obstetricians and Gynecologists (ACOG)
      * Peer-reviewed research on postpartum care and infant development

    {{_.role("user")}}
    Provide 3-5 helpful, personalized tips for day {{input.day}} postpartum.
    {% if input.firstPregnancy %}This is a first-time parent.{% endif %}

    Baby: {{input.babyName}}
    {% if input.babySex %}Sex: {{input.babySex}}
    CRITICAL: Use grammatically correct pronouns throughout ALL generated content:
    {% if input.babySex == "M" or input.babySex == "male" %}
    - Use: he, him, his (e.g., "Watch how he responds", "Give him tummy time", "His reflexes")
    {% elif input.babySex == "F" or input.babySex == "female" %}
    - Use: she, her, hers (e.g., "Watch how she responds", "Give her tummy time", "Her reflexes")
    {% else %}
    - Use: they, them, their (e.g., "Watch how they respond", "Give them tummy time", "Their reflexes")
    {% endif %}
    {% else %}
    - Use gender-neutral: they, them, their when sex is unknown
    {% endif %}

    Baby Context:
    - Age: {{input.ageInDays}} days ({{input.ageInWeeks}} weeks)
    {% if input.currentWeightOz and input.birthWeightOz %}- Weight: {{input.currentWeightOz}}oz (birth: {{input.birthWeightOz}}oz, {% if input.currentWeightOz > input.birthWeightOz %}gained {{input.currentWeightOz - input.birthWeightOz}}oz{% else %}change {{input.currentWeightOz - input.birthWeightOz}}oz{% endif %}){% endif %}
    {% if input.height %}- Height: {{input.height}}cm{% endif %}
    {% if input.headCircumference %}- Head circumference: {{input.headCircumference}}cm{% endif %}

    {% if input.feedingCount24h or input.sleepCount24h or input.diaperCount24h %}
    Recent Activity (Last 24 hours):
    {% if input.feedingCount24h %}- Feedings: {{input.feedingCount24h}}{% if input.avgFeedingInterval %} (avg {{input.avgFeedingInterval}}h intervals){% endif %}{% endif %}
    {% if input.sleepCount24h %}- Sleep: {{input.sleepCount24h}} sessions{% if input.totalSleepHours24h %} ({{input.totalSleepHours24h}}h total){% endif %}{% endif %}
    {% if input.diaperCount24h %}- Diapers: {{input.diaperCount24h}} changes{% endif %}
    {% endif %}

    {% if input.avgFeedingsPerDay or input.avgSleepHoursPerDay or input.avgDiaperChangesPerDay %}
    Weekly Patterns:
    {% if input.avgFeedingsPerDay %}- Avg feedings/day: {{input.avgFeedingsPerDay}}{% endif %}
    {% if input.avgSleepHoursPerDay %}- Avg sleep/day: {{input.avgSleepHoursPerDay}}h{% endif %}
    {% if input.avgDiaperChangesPerDay %}- Avg diapers/day: {{input.avgDiaperChangesPerDay}}{% endif %}
    {% endif %}

    {% if input.recentChatTopics %}
    ═══════════════════════════════════════════════════════════════
    RECENT DISCUSSION CONTEXT
    ═══════════════════════════════════════════════════════════════
    {{input.recentChatTopics}}
    {% endif %}

    {% if input.achievedMilestones %}
    ═══════════════════════════════════════════════════════════════
    RECENTLY ACHIEVED MILESTONES
    ═══════════════════════════════════════════════════════════════
    {{input.achievedMilestones}}
    {% endif %}

    {% if input.activitySummary %}
    ═══════════════════════════════════════════════════════════════
    DETAILED ACTIVITY SUMMARY (LAST 3 DAYS)
    ═══════════════════════════════════════════════════════════════
    {{input.activitySummary}}
    {% endif %}

    {% if input.parentWellness %}
    ═══════════════════════════════════════════════════════════════
    PARENT WELLNESS CONTEXT
    ═══════════════════════════════════════════════════════════════
    {{input.parentWellness}}
    {% endif %}

    {% if input.medicalContext %}
    ═══════════════════════════════════════════════════════════════
    MEDICAL CONTEXT
    ═══════════════════════════════════════════════════════════════
    {{input.medicalContext}}
    {% endif %}

    Focus on:
    - Day 0-3: Basics (feeding, diaper changes, sleep, when to call doctor)
    - Day 4-7: Normal newborn behaviors, self-care for parents
    - Day 8-14: Establishing routines, milestone awareness

    For each tip, provide:
    - category: Choose one of: 'feeding', 'sleep', 'diaper', 'development', 'health', or 'postpartum'
    - subtitle: A catchy 4-5 word subtitle (max 5 words)
    - summary: One concise sentence (max 12 words)
    - bulletPoints: 2-3 actionable bullet points (each bullet max 15 words)
    - followUpQuestion: ONE focused question

    CRITICAL YES/NO QUESTION REQUIREMENTS:

    * MANDATORY: At least TWO tips MUST have isYesNoQuestion: true
    * DEFAULT RULE: For health/safety concerns, ALWAYS use isYesNoQuestion: true
    * PRIORITY: Days 0-7 should have MORE yes/no questions for urgent health checks

    * YES/NO QUESTIONS (isYesNoQuestion: true) - REQUIRED for health/safety:
      Examples:
      - "Has {{input.babyName}} had a wet diaper in the last 12 hours?"
      - "Is {{input.babyName}} showing signs of jaundice?"
      - "Are you experiencing heavy bleeding?"
      - "Has {{input.babyName}} had a bowel movement today?"
      - "Is {{input.babyName}} latching well during feedings?"

    * When isYesNoQuestion: true, you MUST set openChatOnNo and/or openChatOnYes:
      - openChatOnNo: true → If "no" is urgent (no wet diapers, not eating)
      - openChatOnYes: true → If "yes" is urgent (heavy bleeding, jaundice)
      - ALWAYS provide the corresponding prompt

    * OPEN-ENDED QUESTIONS (isYesNoQuestion: false) - Use for qualitative info:
      - "What color is {{input.babyName}}'s poop today?"
      - "How does {{input.babyName}} act during feedings?"

    DECISION TREE FOR EACH TIP:
    1. Is this a health/safety concern? → isYesNoQuestion: true
    2. Can this be answered yes/no? → isYesNoQuestion: true
    3. Does it need qualitative details? → isYesNoQuestion: false
    4. For 'health', 'diaper', 'postpartum' categories → PREFER isYesNoQuestion: true

    Make each tip:
    - Specific to {{input.babyName}}'s current age and situation
    - Reference their actual tracked data when relevant (e.g., "You've logged 8 feedings")
    - Use {{input.babyName}}'s name naturally in the content when appropriate
    - Educational and confidence-building, not just directive
    - Help parents interpret what they're seeing in the app
    - Varied in category to cover different aspects of care

    {{ ctx.output_format }}
  "#
}

// ============================================================================
// Tests
// ============================================================================

test postpartum_tips_day_3 {
  functions [PostpartumTips]
  args {
    input {
      babyName "Riley"
      day 3
      firstPregnancy true
      ageInDays 3
      ageInWeeks 0
      currentWeightOz 120
      birthWeightOz 115
      feedingCount24h 10
      avgFeedingInterval 2.5
      sleepCount24h 8
      totalSleepHours24h 14.5
      diaperCount24h 8
      avgFeedingsPerDay 10.0
      avgSleepHoursPerDay 15.0
      avgDiaperChangesPerDay 8.0
    }
  }
}

