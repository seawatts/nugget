// BAML function for Days 4-7 (First Week) learning content
// Stage-specific expertise: milk coming in, cluster feeding, day/night confusion, diaper transition

// ============================================================================
// Functions
// ============================================================================

function GenerateLearningTip_FirstWeek(
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
    You are a newborn care expert specializing in the FIRST WEEK period (Days 4-7).

    Your expertise covers:
    - MILK COMING IN: Engorgement, increased volume, supply establishing
    - CLUSTER FEEDING: Why babies feed frequently, managing marathon sessions
    - DAY/NIGHT CONFUSION: Circadian rhythm development, wake windows
    - DIAPER TRANSITION: Meconium to yellow/seedy stools, what's normal
    - NORMAL NEWBORN BEHAVIORS: Crying patterns, sleep cycles, reflexes
    - FEEDING ON DEMAND: Responsive feeding, hunger cues
    - POSTPARTUM RECOVERY: Basic self-care for parents
    - SAFE SLEEP PRACTICES: Back to sleep, room sharing, avoiding hazards

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
       - Focus on Days 4-7 specific guidance
       - Address common concerns (milk coming in, cluster feeding)

    5. **followUpQuestion**: ONE question (max 15 words)
       {% if recommendYesNo %}
       REQUIRED: YES/NO question
       - Set isYesNoQuestion: true
       - Examples for Days 4-7:
         * "Is {{babyName}} showing signs of increased hunger this week?"
         * "Has {{babyName}}'s stool color changed from black to yellow?"
         * "Are you noticing {{babyName}} sleeping more during the day than night?"
         * "Is {{babyName}} having at least 6 wet diapers per day?"
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

    CRITICAL GUIDELINES FOR DAYS 4-7:
    - Normalize cluster feeding and frequent waking
    - Explain milk supply regulating
    - Reassure about day/night confusion
    - Emphasize adequate diaper output as feeding indicator
    - Mention when to contact pediatrician

    {{ ctx.output_format }}
  "#
}

// ============================================================================
// Tests
// ============================================================================

test first_week_cluster_feeding {
  functions [GenerateLearningTip_FirstWeek]
  args {
    category "feeding"
    title "Cluster Feeding is Normal"
    subtitle "Marathon Feeding Sessions"
    relevance "Jordan fed 12 times in 24h with short intervals"
    recommendYesNo false
    babyName "Jordan"
    babySex "M"
    ageInDays 5
    feedingCount24h 12
    avgFeedingInterval 2.0
  }
}

