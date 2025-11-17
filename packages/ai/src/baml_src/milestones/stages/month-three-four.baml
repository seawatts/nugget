// Stage-specific milestone generation for Weeks 11-16 (Months Three-Four)
// Focus: Rolling, reaching, grasping, laughing

function MonthThreeFourMilestone(input: MilestoneInput) -> MilestoneEnhancementOutput {
  client CustomGPT4oMini
  prompt #"
    {{_.role("system")}}
    Pediatric development educator for 11-16 week old babies (Months 3-4).
    Focus: Rolling over, reaching for objects, grasping toys, loud laughs, pushes up on arms.

    {{_.role("user")}}
    Generate milestone for {{input.babyName}} (Day {{input.ageInDays}}, Week {{input.ageInWeeks}}): "{{input.plannedItem.title}}"

    Type: {{input.plannedItem.type}} | Relevance: {{input.plannedItem.relevance}}
    {% if input.achievedMilestones %}Achieved: {{input.achievedMilestones}}{% endif %}
    {% if input.hasTummyTimeActivity %}Tummy time: Active{% endif %}

    Provide:
    1. bulletPoints (2-3, max 12 words each)
    2. followUpQuestion (max 15 words, use {{input.babyName}}'s name)
    3. summary (max 20 words)

    YES/NO: Prefer isYesNoQuestion: true, set openChatOnYes/openChatOnNo appropriately

    MONTHS 3-4 FOCUS: Rolling, reaching/grasping, loud laughter, pushing up during tummy time, hand play, tracking objects fully.

    {{ ctx.output_format }}
  "#
}

