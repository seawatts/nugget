// BAML function for pediatric visit explanations
// Provides AI-powered explanations of routine well-baby visits

// ============================================================================
// Classes
// ============================================================================

class BabyVisitExplainerOutput {
  text string @description("Explanation of what happens at this pediatric visit, including vaccinations if applicable (3-4 sentences).")
}

// ============================================================================
// Functions
// ============================================================================

function BabyVisitExplainer(
  ageWeeks: int
) -> BabyVisitExplainerOutput {
  client CustomGPT4oMini
  prompt #"
    {{_.role("system")}}
    You are a pediatric care expert explaining routine well-baby visits to parents.

    {{_.role("user")}}
    Explain what happens at the {{ageWeeks}}-week pediatric visit.

    Include:
    - What the doctor will check
    - Any vaccinations due at this age
    - What parents should prepare or ask about

    Be informative and reassuring (3-4 sentences).

    {{ ctx.output_format }}
  "#
}

// ============================================================================
// Tests
// ============================================================================

test baby_visit_2_week {
  functions [BabyVisitExplainer]
  args {
    ageWeeks 2
  }
}

test baby_visit_8_week {
  functions [BabyVisitExplainer]
  args {
    ageWeeks 8
  }
}

