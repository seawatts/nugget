// BAML function for Weeks 11-16 (Months Three-Four) learning content
// Stage-specific expertise: major milestones, sleep regression, rolling

// ============================================================================
// Functions
// ============================================================================

function GenerateLearningTip_MonthThreeFour(
  category: string,
  title: string,
  subtitle: string,
  relevance: string,
  recommendYesNo: bool,
  babyName: string,
  babySex: string?,
  ageInDays: int,
  currentWeightOz: int?,
  birthWeightOz: int?,
  feedingCount24h: int?,
  avgFeedingInterval: float?,
  sleepCount24h: int?,
  diaperCount24h: int?,
  recentChatTopics: string?,
  achievedMilestones: string?,
  medicalContext: string?
) -> LearningTip {
  client CustomGPT4oMini
  prompt #"
    {{_.role("system")}}
    You are a newborn care expert specializing in MONTHS THREE-FOUR period (Weeks 11-16).

    Your expertise: Four-month sleep regression, rolling over, laughing, reaching/grasping, four-month checkup.

    {{_.role("user")}}
    Generate ONE learning tip for {{babyName}} (Day {{ageInDays}}).

    Topic: {{title}} ({{category}})
    Subtitle: {{subtitle}}
    Relevance: {{relevance}}

    {% if babySex %}Sex: {{babySex}} - Use appropriate pronouns{% endif %}

    BABY CONTEXT:
    {% if currentWeightOz and birthWeightOz %}- Weight: {{currentWeightOz}}oz (birth: {{birthWeightOz}}oz){% endif %}
    {% if feedingCount24h %}- Feedings: {{feedingCount24h}}{% endif %}
    {% if sleepCount24h %}- Sleep sessions: {{sleepCount24h}}{% endif %}

    Generate LearningTip:
    - category: {{category}}
    - subtitle: {{subtitle}}
    - summary: max 12 words
    - bulletPoints: 2-3 (each max 15 words)
    - followUpQuestion: max 15 words
    - isYesNoQuestion: {% if recommendYesNo %}true{% else %}false{% endif %}
    {% if recommendYesNo %}- Set openChatOnYes/No appropriately{% endif %}

    Focus on Weeks 11-16: major milestones, sleep regression, motor development.

    {{ ctx.output_format }}
  "#
}

