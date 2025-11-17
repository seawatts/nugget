// BAML function for Days 8-14 (Second Week) learning content
// Stage-specific expertise: reading cues, feeding efficiency, two-week checkup prep

// ============================================================================
// Functions
// ============================================================================

function GenerateLearningTip_SecondWeek(
  // Plan item from planner
  category: string,
  title: string,
  subtitle: string,
  relevance: string,
  recommendYesNo: bool,

  // Baby context
  babyName: string,
  babySex: string?,
  ageInDays: int,
  currentWeightOz: int?,
  birthWeightOz: int?,

  // Recent activity
  feedingCount24h: int?,
  avgFeedingInterval: float?,
  sleepCount24h: int?,
  diaperCount24h: int?,

  // Context for personalization
  recentChatTopics: string?,
  achievedMilestones: string?,
  medicalContext: string?
) -> LearningTip {
  client CustomGPT4oMini
  prompt #"
    {{_.role("system")}}
    You are a newborn care expert specializing in the SECOND WEEK period (Days 8-14).

    Your expertise covers:
    - READING BABY CUES: Hunger, tired, overstimulation signals
    - DEVELOPMENTAL OBSERVATIONS: Alertness, tracking, focus
    - FEEDING EFFICIENCY: Longer but less frequent feeds, effective latch
    - BONDING ACTIVITIES: Tummy time introduction, skin-to-skin
    - TWO-WEEK CHECKUP: What to expect, questions to ask, tracking to prepare
    - WEIGHT GAIN: Should be back to birth weight or gaining
    - SLEEP CUES: Recognizing tiredness before overtiredness
    - DEVELOPMENTAL TRACKING: What to watch for at this age

    Ground all information in AAP, CDC, and WHO guidelines.

    {{_.role("user")}}
    Generate ONE learning tip for {{babyName}} (Day {{ageInDays}}).

    PLANNED TOPIC:
    - Category: {{category}}
    - Title: {{title}}
    - Subtitle: {{subtitle}}
    - Relevance: {{relevance}}
    - Recommend Yes/No Question: {{recommendYesNo}}

    {% if babySex %}
    Sex: {{babySex}}
    {% if babySex == "M" or babySex == "male" %}
    Use: he, him, his
    {% elif babySex == "F" or babySex == "female" %}
    Use: she, her, hers
    {% else %}
    Use: they, them, their
    {% endif %}
    {% else %}
    Use: they, them, their
    {% endif %}

    BABY CONTEXT:
    {% if currentWeightOz and birthWeightOz %}- Weight: {{currentWeightOz}}oz (birth: {{birthWeightOz}}oz, change: {{currentWeightOz - birthWeightOz}}oz){% endif %}
    {% if feedingCount24h %}- Feedings (24h): {{feedingCount24h}}{% if avgFeedingInterval %} (avg {{avgFeedingInterval}}h intervals){% endif %}{% endif %}
    {% if sleepCount24h %}- Sleep sessions (24h): {{sleepCount24h}}{% endif %}
    {% if diaperCount24h %}- Diapers (24h): {{diaperCount24h}}{% endif %}

    {% if recentChatTopics %}Recent parent questions: {{recentChatTopics}}{% endif %}
    {% if achievedMilestones %}Achieved milestones: {{achievedMilestones}}{% endif %}
    {% if medicalContext %}Medical context: {{medicalContext}}{% endif %}

    Generate a LearningTip with:

    1. **category**: {{category}}
    2. **subtitle**: {{subtitle}}
    3. **summary**: One sentence (max 12 words)
    4. **bulletPoints**: 2-3 actionable points (each max 15 words)
       - Focus on Days 8-14 specific guidance
       - Build confidence in recognizing cues

    5. **followUpQuestion**: ONE question (max 15 words)
       {% if recommendYesNo %}
       REQUIRED: YES/NO question
       - Set isYesNoQuestion: true
       - Examples for Days 8-14:
         * "Is {{babyName}} back to birth weight or gaining?"
         * "Does {{babyName}} make eye contact during feedings?"
         * "Is {{babyName}} showing clear hunger cues before crying?"
         * "Have you noticed {{babyName}} tracking your face?"
       {% else %}
       Open-ended question
       - Set isYesNoQuestion: false
       {% endif %}

    6. **isYesNoQuestion**: {% if recommendYesNo %}true{% else %}false{% endif %}

    7. **openChatOnYes/No**:
       {% if recommendYesNo %}
       Set appropriately based on which answer indicates concern
       {% else %}
       null
       {% endif %}

    CRITICAL GUIDELINES FOR DAYS 8-14:
    - Build parent confidence in reading cues
    - Prepare for two-week checkup
    - Emphasize developmental observations
    - Normalize variations in patterns
    - Encourage bonding activities like tummy time

    {{ ctx.output_format }}
  "#
}

// ============================================================================
// Tests
// ============================================================================

test second_week_cues {
  functions [GenerateLearningTip_SecondWeek]
  args {
    category "development"
    title "Reading Your Baby's Hunger Cues"
    subtitle "Before the Cry"
    relevance "Alex is feeding 9 times/day, learning to recognize early cues"
    recommendYesNo false
    babyName "Alex"
    ageInDays 10
    feedingCount24h 9
  }
}

