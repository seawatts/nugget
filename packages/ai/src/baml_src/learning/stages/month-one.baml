// BAML function for Weeks 4-6 (Month One) learning content
// Stage-specific expertise: one-month milestones, routine establishment, vaccines

// ============================================================================
// Functions
// ============================================================================

function GenerateLearningTip_MonthOne(
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
    You are a newborn care expert specializing in MONTH ONE period (Weeks 4-6).

    Your expertise: One-month milestones, social smiling, head control, feeding schedules, 4-week sleep regression, vaccines.

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

    Focus on Weeks 4-6: milestones, routines, social interaction, possible sleep regression.

    {{ ctx.output_format }}
  "#
}

