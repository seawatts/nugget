// Milestones rules program for baby development tracking
// Defines predefined milestones and AI-generated contextual suggestions

import type { BamlAsyncClient } from '@nugget/ai';
import { Program, postpartum, Scope, Screen, Slot, scope } from './dynamic';

// Factory function to create the milestones program with BAML client
export function createMilestonesProgram(_b: BamlAsyncClient) {
  const P = new Program();

  /* ========== Predefined Milestones - Day-based (Days 0-14) ========== */

  // Day 1: First Meconium Diaper
  P.add(
    P.rule()
      .slot(Screen.Milestones, Slot.Header)
      .when(scope(Scope.Postpartum), postpartum.day.eq(1))
      .show({
        props: {
          ageLabel: 'Day 1',
          description: "Baby's first tarry, black stool - a healthy sign!",
          suggestedDay: 1,
          title: 'First Meconium Diaper',
          type: 'physical',
        },
        template: 'Card.Milestone',
      })
      .priority(90)
      .build(),
  );

  // Day 2-3: First Wet Diaper
  [2, 3].forEach((day) => {
    P.add(
      P.rule()
        .slot(Screen.Milestones, Slot.Header)
        .when(scope(Scope.Postpartum), postpartum.day.eq(day))
        .show({
          props: {
            ageLabel: `Day ${day}`,
            description: 'Clear or pale yellow urine indicates good hydration.',
            suggestedDay: day,
            title: 'First Wet Diaper',
            type: 'physical',
          },
          template: 'Card.Milestone',
        })
        .priority(85)
        .build(),
    );
  });

  // Day 3-5: First Yellow Stool (Milk Coming In)
  [3, 4, 5].forEach((day) => {
    P.add(
      P.rule()
        .slot(Screen.Milestones, Slot.Header)
        .when(scope(Scope.Postpartum), postpartum.day.eq(day))
        .show({
          props: {
            ageLabel: `Day ${day}`,
            description:
              'Stool transitions from black to yellow - milk is here!',
            suggestedDay: day,
            title: 'First Yellow Stool',
            type: 'physical',
          },
          template: 'Card.Milestone',
        })
        .priority(88)
        .build(),
    );
  });

  // Day 7: First Week Complete
  P.add(
    P.rule()
      .slot(Screen.Milestones, Slot.Header)
      .when(scope(Scope.Postpartum), postpartum.day.eq(7))
      .show({
        props: {
          ageLabel: 'Day 7',
          description: "You've made it through the first week - celebrate!",
          suggestedDay: 7,
          title: 'First Week Complete',
          type: 'self_care',
        },
        template: 'Card.Milestone',
      })
      .priority(80)
      .build(),
  );

  /* ========== Predefined Milestones - Week-based (Weeks 1-12) ========== */

  // Week 1: Alert and Responsive
  P.add(
    P.rule()
      .slot(Screen.Milestones, Slot.Header)
      .when(scope(Scope.Postpartum), postpartum.week.eq(1))
      .show({
        props: {
          ageLabel: 'Week 1',
          description:
            'Baby becomes more alert and responsive to sounds and faces.',
          suggestedDay: 7,
          title: 'More Alert and Responsive',
          type: 'cognitive',
        },
        template: 'Card.Milestone',
      })
      .priority(82)
      .build(),
  );

  // Week 1: Startle Reflex
  P.add(
    P.rule()
      .slot(Screen.Milestones, Slot.Header)
      .when(scope(Scope.Postpartum), postpartum.week.eq(1))
      .show({
        props: {
          ageLabel: 'Week 1',
          description:
            'Baby shows strong startle (Moro) reflex to sudden sounds or movements.',
          suggestedDay: 7,
          title: 'Demonstrates Startle Reflex',
          type: 'physical',
        },
        template: 'Card.Milestone',
      })
      .priority(81)
      .build(),
  );

  // Week 1: Recognizes Parent Smell
  P.add(
    P.rule()
      .slot(Screen.Milestones, Slot.Header)
      .when(scope(Scope.Postpartum), postpartum.week.eq(1))
      .show({
        props: {
          ageLabel: 'Week 1',
          description: "Baby can recognize and be soothed by parent's scent.",
          suggestedDay: 7,
          title: "Recognizes Parent's Scent",
          type: 'social',
        },
        template: 'Card.Milestone',
      })
      .priority(80)
      .build(),
  );

  // Week 2: First Social Smile
  P.add(
    P.rule()
      .slot(Screen.Milestones, Slot.Header)
      .when(scope(Scope.Postpartum), postpartum.week.eq(2))
      .show({
        props: {
          ageLabel: 'Week 2',
          description: 'Baby smiles in response to your voice or face.',
          suggestedDay: 14,
          title: 'First Social Smile',
          type: 'social',
        },
        template: 'Card.Milestone',
      })
      .priority(85)
      .build(),
  );

  // Week 3: Recognizes Parent's Voice
  P.add(
    P.rule()
      .slot(Screen.Milestones, Slot.Header)
      .when(scope(Scope.Postpartum), postpartum.week.eq(3))
      .show({
        props: {
          ageLabel: 'Week 3',
          description: 'Baby turns toward familiar voices and sounds.',
          suggestedDay: 21,
          title: "Recognizes Parent's Voice",
          type: 'cognitive',
        },
        template: 'Card.Milestone',
      })
      .priority(82)
      .build(),
  );

  // Week 4: Follows Objects with Eyes
  P.add(
    P.rule()
      .slot(Screen.Milestones, Slot.Header)
      .when(scope(Scope.Postpartum), postpartum.week.eq(4))
      .show({
        props: {
          ageLabel: 'Week 4',
          description: 'Baby tracks moving objects with their eyes.',
          suggestedDay: 28,
          title: 'Follows Objects with Eyes',
          type: 'cognitive',
        },
        template: 'Card.Milestone',
      })
      .priority(83)
      .build(),
  );

  // Week 6: Holds Head Up During Tummy Time
  P.add(
    P.rule()
      .slot(Screen.Milestones, Slot.Header)
      .when(scope(Scope.Postpartum), postpartum.week.eq(6))
      .show({
        props: {
          ageLabel: 'Week 6',
          description:
            'Baby can lift and hold head up briefly during tummy time.',
          suggestedDay: 42,
          title: 'Holds Head Up During Tummy Time',
          type: 'physical',
        },
        template: 'Card.Milestone',
      })
      .priority(84)
      .build(),
  );

  // Week 7: First Laugh
  P.add(
    P.rule()
      .slot(Screen.Milestones, Slot.Header)
      .when(scope(Scope.Postpartum), postpartum.week.eq(7))
      .show({
        props: {
          ageLabel: 'Week 7',
          description: 'Baby giggles or laughs out loud in response to play.',
          suggestedDay: 49,
          title: 'First Laugh',
          type: 'social',
        },
        template: 'Card.Milestone',
      })
      .priority(86)
      .build(),
  );

  // Week 8: Coos and Makes Sounds
  P.add(
    P.rule()
      .slot(Screen.Milestones, Slot.Header)
      .when(scope(Scope.Postpartum), postpartum.week.eq(8))
      .show({
        props: {
          ageLabel: 'Week 8',
          description:
            'Baby makes cooing sounds and experiments with vocalization.',
          suggestedDay: 56,
          title: 'Coos and Makes Sounds',
          type: 'language',
        },
        template: 'Card.Milestone',
      })
      .priority(85)
      .build(),
  );

  // Week 10: Brings Hands Together
  P.add(
    P.rule()
      .slot(Screen.Milestones, Slot.Header)
      .when(scope(Scope.Postpartum), postpartum.week.eq(10))
      .show({
        props: {
          ageLabel: 'Week 10',
          description: 'Baby discovers their hands and brings them together.',
          suggestedDay: 70,
          title: 'Brings Hands Together',
          type: 'physical',
        },
        template: 'Card.Milestone',
      })
      .priority(81)
      .build(),
  );

  // Week 12: Reaches for Objects
  P.add(
    P.rule()
      .slot(Screen.Milestones, Slot.Header)
      .when(scope(Scope.Postpartum), postpartum.week.eq(12))
      .show({
        props: {
          ageLabel: 'Week 12',
          description: 'Baby reaches for and grasps at objects within reach.',
          suggestedDay: 84,
          title: 'Reaches for Objects',
          type: 'physical',
        },
        template: 'Card.Milestone',
      })
      .priority(83)
      .build(),
  );

  /* ========== AI-Generated Contextual Milestones ========== */
  // TODO: Add AI-generated contextual milestones after BAML client is regenerated
  // Will use GenerateContextualMilestones BAML function to provide personalized
  // milestone suggestions based on baby's activities and patterns

  return P;
}

// Export the program builder
export { Program };
