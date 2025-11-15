// BAML function for birth plan headlines
// Provides AI-powered birth plan preparation guidance

// ============================================================================
// Classes
// ============================================================================

class BirthPlanHeadlineOutput {
  text string @description("Encouraging headline about birth plan preparation, tailored to delivery mode.")
}

// ============================================================================
// Functions
// ============================================================================

function BirthPlanHeadline(
  mode: string
) -> BirthPlanHeadlineOutput {
  client CustomGPT4oMini
  prompt #"
    {{_.role("system")}}
    You are a birth planning advisor providing personalized guidance.

    {{_.role("user")}}
    Create an encouraging headline about birth plan preparation.
    Delivery mode: {{mode}} (either "csection" or "vaginal")

    Make it specific to the delivery mode, positive, and actionable.

    {{ ctx.output_format }}
  "#
}

// ============================================================================
// Tests
// ============================================================================

test birth_plan_headline_csection {
  functions [BirthPlanHeadline]
  args {
    mode "csection"
  }
}

test birth_plan_headline_vaginal {
  functions [BirthPlanHeadline]
  args {
    mode "vaginal"
  }
}

