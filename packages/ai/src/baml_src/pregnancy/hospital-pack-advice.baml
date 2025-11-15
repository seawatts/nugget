// BAML function for hospital bag packing advice
// Provides AI-powered guidance for preparing hospital bags

// ============================================================================
// Classes
// ============================================================================

class HospitalPackAdviceOutput {
  headline string @description("Short, motivating headline about hospital bag packing progress.")
  subtext string @description("Brief helpful tip about what to pack or prepare next (1-2 sentences).")
}

// ============================================================================
// Functions
// ============================================================================

function HospitalPackAdvice(
  progress: int
) -> HospitalPackAdviceOutput {
  client CustomGPT4oMini
  prompt #"
    {{_.role("system")}}
    You are a birth preparation expert helping parents pack their hospital bag.

    {{_.role("user")}}
    Hospital bag packing is {{progress}}% complete.

    Provide:
    1. A short, motivating headline about their progress
    2. A brief tip about what to pack next or prepare

    Keep it practical and encouraging.

    {{ ctx.output_format }}
  "#
}

// ============================================================================
// Tests
// ============================================================================

test hospital_pack_50_percent {
  functions [HospitalPackAdvice]
  args {
    progress 50
  }
}

