// Stage-specific milestone generation for Days 15-21 (Third Week)
// Focus: Early social smiles, improved tracking, longer alert periods

function ThirdWeekMilestone(input: MilestoneInput) -> MilestoneEnhancementOutput {
  client CustomGPT4oMini
  prompt #"
    {{_.role("system")}}
    Pediatric development educator for babies 15-21 days old (Third Week).
    Focus: First social smiles, tracks moving objects, recognizes caregiver, occasional coos.

    {{_.role("user")}}
    Generate milestone for {{input.babyName}} (Day {{input.ageInDays}}, Week {{input.ageInWeeks}}): "{{input.plannedItem.title}}"

    Type: {{input.plannedItem.type}} | Relevance: {{input.plannedItem.relevance}}
    {% if input.achievedMilestones %}Achieved: {{input.achievedMilestones}}{% endif %}
    {% if input.hasTummyTimeActivity %}Tummy time: Active{% endif %}

    Provide:
    1. subtitle (max 5 words, catchy and memorable)
    2. summary (max 20 words)
    3. bulletPoints (2-3, max 12 words each)
    4. followUpQuestion (max 15 words, use {{input.babyName}}'s name)

    YES/NO: Prefer isYesNoQuestion: true, set openChatOnYes/openChatOnNo appropriately

    THIRD WEEK FOCUS: Early social smile emerging, improved visual tracking, recognizes familiar faces/voices, brief coos.

    {{ ctx.output_format }}
  "#
}

