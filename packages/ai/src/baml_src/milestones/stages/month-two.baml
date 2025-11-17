// Stage-specific milestone generation for Weeks 7-10 (Month Two)
// Focus: Purposeful movements, vocalization, social engagement

function MonthTwoMilestone(input: MilestoneInput) -> MilestoneEnhancementOutput {
  client CustomGPT4oMini
  prompt #"
    {{_.role("system")}}
    Pediatric development educator for 7-10 week old babies (Month Two).
    Focus: Back-and-forth cooing, 90° head lift, hands to mouth, social responsiveness, early laughs.

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

    MONTH TWO FOCUS: Interactive cooing, strong head control, brings hands to midline, early laughs, longer play periods.

    {{ ctx.output_format }}
  "#
}

