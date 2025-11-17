// BAML function for planning milestone suggestions
// Phase 1: Determines WHAT milestones to suggest based on baby's age and context
// Phase 2: Stage-specific prompts will generate the actual milestone content

// ============================================================================
// Classes
// ============================================================================

class MilestonePlanItem {
  title string @description("Milestone title (e.g., 'First Social Smile', 'Lifts Head During Tummy Time')")
  type string @description("Milestone type: 'physical', 'cognitive', 'social', 'language', or 'self_care'")
  ageLabel string @description("Age context (e.g., 'Week 2', 'Day 10')")
  relevance string @description("Why this milestone is relevant NOW based on baby's data (1 sentence, max 25 words)")
  priority int @description("Priority 1-5 (5=critical developmental marker, 1=nice-to-track)")
  expectedInStage bool @description("Whether this milestone is expected/typical for current age stage")
  avoidDuplicateOf string[] @description("Recently suggested or achieved milestone IDs to avoid")
  recommendYesNo bool @description("Whether this topic should use a yes/no question (true for milestones)")
}

class MilestonePlan {
  items MilestonePlanItem[] @description("2-3 contextually relevant milestone suggestions")
  reasoning string @description("Brief explanation of why these milestones were chosen (2-3 sentences)")
  coveredTypes string[] @description("Milestone types covered in this plan for variety")
  developmentalFocus string @description("Main developmental focus area for this stage (e.g., 'reflexes and alertness', 'social engagement')")
}

// ============================================================================
// Functions
// ============================================================================

function MilestonePlanner(
  // Baby basics
  babyName: string,
  babySex: string?,
  ageInDays: int,
  ageInWeeks: int,

  // Growth metrics
  currentWeightOz: int?,
  birthWeightOz: int?,
  height: int?,

  // Recent activity (24h)
  feedingCount24h: int?,
  avgFeedingInterval: float?,
  sleepCount24h: int?,
  totalSleepHours24h: float?,
  diaperCount24h: int?,

  // Weekly patterns
  avgFeedingsPerDay: float?,
  avgSleepHoursPerDay: float?,
  avgDiaperChangesPerDay: float?,

  // Rich context
  recentChatTopics: string?,
  achievedMilestones: string?,
  recentlySuggestedMilestones: string?,
  activitySummary: string?,
  hasTummyTimeActivity: bool?,
  medicalContext: string?
) -> MilestonePlan {
  client CustomGPT4oMini
  prompt #"
    {{_.role("system")}}
    You are a pediatric development planner for a milestone tracking app. Your job is to PLAN which milestones to suggest, not generate the full milestone content.

    Your task:
    1. Analyze baby's age and determine appropriate developmental stage
    2. Identify 2-3 milestones that are contextually relevant RIGHT NOW
    3. Avoid duplicating recently suggested or achieved milestones
    4. Mix milestone types (physical, cognitive, social, language, self_care)
    5. Prioritize milestones baby might be showing signs of or approaching

    Base recommendations on:
    - CDC "Learn the Signs. Act Early" milestones
    - AAP Bright Futures developmental surveillance guidelines
    - WHO Multicentre Growth Reference Study

    {{_.role("user")}}
    Plan 2-3 milestone suggestions for {{babyName}} ({{ageInDays}} days old, {{ageInWeeks}} weeks).

    {% if babySex %}Sex: {{babySex}}{% endif %}

    ═══════════════════════════════════════════════════════════════
    BABY METRICS & RECENT ACTIVITY
    ═══════════════════════════════════════════════════════════════
    {% if currentWeightOz and birthWeightOz %}
    Weight: {{currentWeightOz}}oz (birth: {{birthWeightOz}}oz, change: {{currentWeightOz - birthWeightOz}}oz)
    {% endif %}
    {% if height %}Height: {{height}}cm{% endif %}

    Last 24 hours:
    {% if feedingCount24h %}- Feedings: {{feedingCount24h}}{% if avgFeedingInterval %} (avg {{avgFeedingInterval}}h intervals){% endif %}{% endif %}
    {% if sleepCount24h %}- Sleep: {{sleepCount24h}} sessions{% if totalSleepHours24h %} ({{totalSleepHours24h}}h total){% endif %}{% endif %}
    {% if diaperCount24h %}- Diapers: {{diaperCount24h}} changes{% endif %}
    {% if hasTummyTimeActivity %}- Parents have been doing tummy time activities{% endif %}

    {% if avgFeedingsPerDay or avgSleepHoursPerDay or avgDiaperChangesPerDay %}
    Weekly patterns:
    {% if avgFeedingsPerDay %}- Avg feedings/day: {{avgFeedingsPerDay}}{% endif %}
    {% if avgSleepHoursPerDay %}- Avg sleep/day: {{avgSleepHoursPerDay}}h{% endif %}
    {% if avgDiaperChangesPerDay %}- Avg diapers/day: {{avgDiaperChangesPerDay}}{% endif %}
    {% endif %}

    {% if recentChatTopics %}
    ═══════════════════════════════════════════════════════════════
    RECENT CHAT TOPICS (LAST 7 DAYS)
    ═══════════════════════════════════════════════════════════════
    {{recentChatTopics}}

    IMPORTANT: If parents have been asking about developmental signs, prioritize related milestones.
    {% endif %}

    {% if achievedMilestones %}
    ═══════════════════════════════════════════════════════════════
    ACHIEVED MILESTONES
    ═══════════════════════════════════════════════════════════════
    {{achievedMilestones}}

    CRITICAL: Do NOT suggest milestones already achieved. Suggest next developmental steps instead.
    {% endif %}

    {% if recentlySuggestedMilestones %}
    ═══════════════════════════════════════════════════════════════
    RECENTLY SUGGESTED MILESTONES (LAST 14 DAYS)
    ═══════════════════════════════════════════════════════════════
    {{recentlySuggestedMilestones}}

    CRITICAL: AVOID re-suggesting these unless significant time has passed.
    {% endif %}

    {% if activitySummary %}
    ═══════════════════════════════════════════════════════════════
    DETAILED ACTIVITY SUMMARY (LAST 3 DAYS)
    ═══════════════════════════════════════════════════════════════
    {{activitySummary}}
    {% endif %}

    {% if medicalContext %}
    ═══════════════════════════════════════════════════════════════
    MEDICAL CONTEXT
    ═══════════════════════════════════════════════════════════════
    {{medicalContext}}
    {% endif %}

    DEVELOPMENTAL STAGE MILESTONES:
    {% if ageInDays >= 1 and ageInDays <= 3 %}
    Stage: Immediate Postbirth (Days 1-3)
    Focus: Reflexes, alertness, feeding coordination
    Key milestones: First wet diaper, first meconium, alert periods, rooting reflex, grasp reflex, startle reflex
    {% elif ageInDays >= 4 and ageInDays <= 7 %}
    Stage: First Week (Days 4-7)
    Focus: Increasing alertness, feeding efficiency, diaper transitions
    Key milestones: Yellow stool transition, longer alert periods, tracks movement briefly, responds to sounds
    {% elif ageInDays >= 8 and ageInDays <= 14 %}
    Stage: Second Week (Days 8-14)
    Focus: Social awareness emerging, visual tracking, head control beginning
    Key milestones: Tracks faces, brief head lift during tummy time, responds to voice, makes eye contact
    {% elif ageInDays >= 15 and ageInDays <= 21 %}
    Stage: Third Week (Days 15-21)
    Focus: Early social smiles, improved tracking, longer alert periods
    Key milestones: First social smile, tracks moving objects, recognizes caregiver, coos occasionally
    {% elif ageInDays >= 22 and ageInDays <= 42 %}
    Stage: Month One (Weeks 4-6)
    Focus: Social smiling, head control improving, vocalization starting
    Key milestones: Social smiling, holds head up 45° during tummy time, follows objects 180°, coos and gurgles
    {% elif ageInDays >= 43 and ageInDays <= 70 %}
    Stage: Month Two (Weeks 7-10)
    Focus: Purposeful movements, vocalization, social engagement
    Key milestones: Coos back and forth, lifts head 90° during tummy time, brings hands to mouth, laughs
    {% elif ageInDays >= 71 and ageInDays <= 112 %}
    Stage: Months Three-Four (Weeks 11-16)
    Focus: Rolling, reaching, grasping, laughing
    Key milestones: Rolls over, reaches for objects, grasps toys, laughs out loud, pushes up on arms
    {% endif %}

    PLANNING GUIDELINES:

    1. **Priority Scoring (1-5)**:
       - 5 = Critical developmental marker for this age (e.g., no alert periods by week 2)
       - 4 = Important milestone expected in this stage
       - 3 = Milestone baby may be approaching based on activities
       - 2 = Age-appropriate but not urgent
       - 1 = Future milestone to be aware of

    2. **Type Variety**:
       - Mix types: physical, cognitive, social, language, self_care
       - Don't suggest 3 physical milestones unless stage specifically focuses on motor development

    3. **Contextual Relevance**:
       - If parents are doing tummy time → suggest tummy time milestones
       - If baby's age indicates social smiling stage → prioritize social milestones
       - If recent chats mention specific behaviors → suggest related milestones

    4. **Expected vs. Advanced**:
       - Set expectedInStage: true for milestones typical at this age
       - Set expectedInStage: false for advanced/upcoming milestones

    5. **Deduplication**:
       - Check achievedMilestones and NEVER suggest those
       - Check recentlySuggestedMilestones and avoid unless >2 weeks old
       - Use avoidDuplicateOf to list IDs

    For each planned milestone, provide:
    - **title**: Specific, observable milestone (e.g., "Lifts Head During Tummy Time", not "Head Control")
    - **type**: One of: physical, cognitive, social, language, self_care
    - **ageLabel**: Context like "Week {{ageInWeeks}}" or "Day {{ageInDays}}"
    - **relevance**: Why suggest THIS milestone NOW (reference activities/age/patterns)
    - **priority**: 1-5 score
    - **expectedInStage**: true if typical for current age
    - **avoidDuplicateOf**: List of recently covered milestone IDs

    Also provide:
    - **reasoning**: 2-3 sentences explaining milestone choices
    - **coveredTypes**: List of types in your plan
    - **developmentalFocus**: Main focus area (e.g., "social engagement and visual tracking")

    {{ ctx.output_format }}
  "#
}

// ============================================================================
// Tests
// ============================================================================

test milestone_planner_week_2 {
  functions [MilestonePlanner]
  args {
    babyName "Riley"
    babySex "F"
    ageInDays 14
    ageInWeeks 2
    feedingCount24h 9
    sleepCount24h 7
    diaperCount24h 8
    hasTummyTimeActivity true
    achievedMilestones "First meconium diaper, First wet diaper"
  }
}

test milestone_planner_month_one {
  functions [MilestonePlanner]
  args {
    babyName "Jordan"
    babySex "M"
    ageInDays 28
    ageInWeeks 4
    feedingCount24h 8
    sleepCount24h 6
    diaperCount24h 7
    hasTummyTimeActivity true
    achievedMilestones "Tracks faces, Brief head lift during tummy time"
    recentChatTopics "Parents asked about when baby will start smiling socially"
  }
}

