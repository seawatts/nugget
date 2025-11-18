// Stage-specific milestone generation for Days 4-7 (First Week)
// Focus: Increasing alertness, feeding efficiency, diaper transitions

function FirstWeekMilestone(input: MilestoneInput) -> MilestoneEnhancementOutput {
  client CustomGPT4oMini
  prompt #"
    {{_.role("system")}}
    You are a pediatric development educator specializing in the first week of life (Days 4-7).
    Your role: Generate milestone content focused on increasing alertness, feeding patterns, and developmental signs.

    STAGE FOCUS: Days 4-7 (First Week)
    - Alertness: Longer alert periods (30-60 min)
    - Feeding: More efficient feeding, establishing rhythm
    - Elimination: Stool color transition (meconium → yellow/green)
    - Sensory: Brief visual tracking, responds to voices
    - Social: Beginning to focus on faces at close range

    Evidence base: CDC, AAP, WHO infant development standards

    {{_.role("user")}}
    Generate milestone content for {{input.babyName}} (Day {{input.ageInDays}}, Week {{input.ageInWeeks}}) on topic: "{{input.plannedItem.title}}"

    {% if input.babySex %}Sex: {{input.babySex}}{% endif %}

    ═══════════════════════════════════════════════════════════════
    PLANNER CONTEXT
    ═══════════════════════════════════════════════════════════════
    Milestone type: {{input.plannedItem.type}}
    Relevance: {{input.plannedItem.relevance}}
    Expected in stage: {{input.plannedItem.expectedInStage}}

    {% if input.currentWeightOz and input.birthWeightOz %}
    ═══════════════════════════════════════════════════════════════
    BABY METRICS
    ═══════════════════════════════════════════════════════════════
    Weight: {{input.currentWeightOz}}oz (birth: {{input.birthWeightOz}}oz, change: {{input.currentWeightOz - input.birthWeightOz}}oz)
    {% if input.height %}Height: {{input.height}}cm{% endif %}
    {% endif %}

    {% if input.feedingCount24h or input.sleepCount24h or input.diaperCount24h %}
    ═══════════════════════════════════════════════════════════════
    RECENT ACTIVITY (24H)
    ═══════════════════════════════════════════════════════════════
    {% if input.feedingCount24h %}- Feedings: {{input.feedingCount24h}}{% if input.avgFeedingInterval %} (avg {{input.avgFeedingInterval}}h intervals){% endif %}{% endif %}
    {% if input.sleepCount24h %}- Sleep: {{input.sleepCount24h}} sessions{% if input.totalSleepHours24h %} ({{input.totalSleepHours24h}}h total){% endif %}{% endif %}
    {% if input.diaperCount24h %}- Diapers: {{input.diaperCount24h}} changes{% endif %}
    {% if input.hasTummyTimeActivity %}- Parents are doing tummy time{% endif %}
    {% endif %}

    {% if input.recentChatTopics %}
    ═══════════════════════════════════════════════════════════════
    RECENT CHAT TOPICS
    ═══════════════════════════════════════════════════════════════
    {{input.recentChatTopics}}
    {% endif %}

    {% if input.achievedMilestones %}
    ═══════════════════════════════════════════════════════════════
    ACHIEVED MILESTONES
    ═══════════════════════════════════════════════════════════════
    {{input.achievedMilestones}}
    {% endif %}

    {% if input.activitySummary %}
    ═══════════════════════════════════════════════════════════════
    ACTIVITY SUMMARY
    ═══════════════════════════════════════════════════════════════
    {{input.activitySummary}}
    {% endif %}

    Generate ONE milestone enhancement:

    1. **subtitle** (max 5 words):
       - Catchy and memorable for parents

    2. **summary** (max 20 words):
       - Warm, supportive sentence with {{input.babyName}}'s name
       - Emphasize normal developmental variation

    3. **bulletPoints** (2-3 points, each max 12 words):
       - Observable behavior for this milestone
       - Developmental significance (brief evidence note)
       - How parents can support or observe

    4. **followUpQuestion** (max 15 words):
       - ONE question using {{input.babyName}}'s name
       - Focus on specific observable signs

    CRITICAL YES/NO QUESTION REQUIREMENTS:

    * DEFAULT: Prefer isYesNoQuestion: true for milestone tracking

    * When isYesNoQuestion: true, MUST provide:
      - openChatOnYes: true (for celebration/exploration)
      - openChatOnNo: true (for reassurance/guidance)

    FIRST WEEK SPECIFICS:
    - Acknowledge transition from hospital/birth center
    - Note stool color changes (meconium → transitional → yellow/green)
    - Emphasize normal weight loss recovery (back to birth weight by 10-14 days)
    - Focus on feeding cues becoming clearer
    - Reassure about "day/night confusion" being normal

    TONE: Warm, evidence-based, supportive, non-judgmental

    {{ ctx.output_format }}
  "#
}

