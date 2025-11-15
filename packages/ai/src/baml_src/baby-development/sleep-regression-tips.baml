// BAML function for sleep regression guidance
// Provides AI-powered tips for handling baby sleep regressions

// ============================================================================
// Classes
// ============================================================================

class SleepRegressionTipsOutput {
  snippet string @description("Quick, practical tip for handling sleep regression at this age (2-3 sentences).")
}

// ============================================================================
// Functions
// ============================================================================

function SleepRegressionTips(
  week: int
) -> SleepRegressionTipsOutput {
  client CustomGPT4oMini
  prompt #"
    {{_.role("system")}}
    You are a pediatric sleep consultant providing practical advice for common sleep regressions.

    {{_.role("user")}}
    Provide a practical tip for handling sleep regression around week {{week}}.

    Keep it:
    - Specific and actionable
    - Evidence-based but realistic
    - Empathetic to exhausted parents

    {{ ctx.output_format }}
  "#
}

// ============================================================================
// Tests
// ============================================================================

test sleep_regression_week_4 {
  functions [SleepRegressionTips]
  args {
    week 4
  }
}

test sleep_regression_week_12 {
  functions [SleepRegressionTips]
  args {
    week 12
  }
}

