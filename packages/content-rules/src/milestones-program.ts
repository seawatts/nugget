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
          description:
            "Baby's first tarry, black stool - a healthy sign! This shows the digestive system is working.",
          suggestedDay: 1,
          title: 'First Meconium Diaper',
          type: 'physical',
        },
        template: 'Card.Milestone',
      })
      .priority(90)
      .build(),
  );

  // Day 1: First Successful Feeding
  P.add(
    P.rule()
      .slot(Screen.Milestones, Slot.Header)
      .when(scope(Scope.Postpartum), postpartum.day.eq(1))
      .show({
        props: {
          ageLabel: 'Day 1',
          description:
            'First successful latch or bottle feed. Baby is learning to coordinate sucking, swallowing, and breathing.',
          suggestedDay: 1,
          title: 'First Successful Feeding',
          type: 'physical',
        },
        template: 'Card.Milestone',
      })
      .priority(91)
      .build(),
  );

  // Day 1: Skin-to-Skin Contact
  P.add(
    P.rule()
      .slot(Screen.Milestones, Slot.Header)
      .when(scope(Scope.Postpartum), postpartum.day.eq(1))
      .show({
        props: {
          ageLabel: 'Day 1',
          description:
            'Skin-to-skin contact helps regulate temperature, heart rate, and promotes bonding. AAP recommends starting immediately after birth.',
          suggestedDay: 1,
          title: 'First Skin-to-Skin',
          type: 'social',
        },
        template: 'Card.Milestone',
      })
      .priority(89)
      .build(),
  );

  // Day 1: Rooting Reflex
  P.add(
    P.rule()
      .slot(Screen.Milestones, Slot.Header)
      .when(scope(Scope.Postpartum), postpartum.day.eq(1))
      .show({
        props: {
          ageLabel: 'Day 1',
          description:
            'Baby turns head toward touch on cheek and opens mouth - an important feeding reflex present from birth.',
          suggestedDay: 1,
          title: 'Rooting Reflex Demonstrated',
          type: 'physical',
        },
        template: 'Card.Milestone',
      })
      .priority(88)
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
            description:
              'Clear or pale yellow urine indicates good hydration. Expect at least 6 wet diapers daily by day 5.',
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

  // Day 2: Recognizes Parent's Voice
  P.add(
    P.rule()
      .slot(Screen.Milestones, Slot.Header)
      .when(scope(Scope.Postpartum), postpartum.day.eq(2))
      .show({
        props: {
          ageLabel: 'Day 2',
          description:
            'Baby begins to recognize familiar voices heard in the womb. May become calm or alert when hearing parent speak.',
          suggestedDay: 2,
          title: "Recognition of Parent's Voice",
          type: 'cognitive',
        },
        template: 'Card.Milestone',
      })
      .priority(84)
      .build(),
  );

  // Day 2: Startle Reflex to Sounds
  P.add(
    P.rule()
      .slot(Screen.Milestones, Slot.Header)
      .when(scope(Scope.Postpartum), postpartum.day.eq(2))
      .show({
        props: {
          ageLabel: 'Day 2',
          description:
            'Moro (startle) reflex is present - baby throws arms out in response to sudden noises or movement. This reflex protects newborns.',
          suggestedDay: 2,
          title: 'Startle Reflex to Sounds',
          type: 'physical',
        },
        template: 'Card.Milestone',
      })
      .priority(83)
      .build(),
  );

  // Day 2: First Extended Eye Opening
  P.add(
    P.rule()
      .slot(Screen.Milestones, Slot.Header)
      .when(scope(Scope.Postpartum), postpartum.day.eq(2))
      .show({
        props: {
          ageLabel: 'Day 2',
          description:
            'Baby has longer periods with eyes open during quiet alert state. Newborns can see 8-12 inches away - perfect for gazing at faces.',
          suggestedDay: 2,
          title: 'First Eye Opening Periods',
          type: 'cognitive',
        },
        template: 'Card.Milestone',
      })
      .priority(82)
      .build(),
  );

  // Day 2: First Weight Check
  P.add(
    P.rule()
      .slot(Screen.Milestones, Slot.Header)
      .when(scope(Scope.Postpartum), postpartum.day.eq(2))
      .show({
        props: {
          ageLabel: 'Day 2',
          description:
            'Initial weight loss (5-10%) is normal as baby adjusts. Your healthcare provider will monitor weight gain trajectory.',
          suggestedDay: 2,
          title: 'Weight Check Milestone',
          type: 'health',
        },
        template: 'Card.Milestone',
      })
      .priority(86)
      .build(),
  );

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
              'Stool transitions from black to yellow - milk is here! This shows baby is getting colostrum and transitional milk.',
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

  // Day 3: First Quiet Alert Period
  P.add(
    P.rule()
      .slot(Screen.Milestones, Slot.Header)
      .when(scope(Scope.Postpartum), postpartum.day.eq(3))
      .show({
        props: {
          ageLabel: 'Day 3',
          description:
            'Baby has periods of quiet alertness with eyes wide open, ready to interact. Perfect time for bonding and feeding.',
          suggestedDay: 3,
          title: 'First Alert Period',
          type: 'cognitive',
        },
        template: 'Card.Milestone',
      })
      .priority(87)
      .build(),
  );

  // Day 3: Day/Night Confusion Begins
  P.add(
    P.rule()
      .slot(Screen.Milestones, Slot.Header)
      .when(scope(Scope.Postpartum), postpartum.day.eq(3))
      .show({
        props: {
          ageLabel: 'Day 3',
          description:
            'Many babies confuse day and night in early weeks. Bright light during day and darkness at night helps establish circadian rhythm.',
          suggestedDay: 3,
          title: 'Day/Night Adjustment',
          type: 'cognitive',
        },
        template: 'Card.Milestone',
      })
      .priority(82)
      .build(),
  );

  // Day 3: Umbilical Cord Care
  P.add(
    P.rule()
      .slot(Screen.Milestones, Slot.Header)
      .when(scope(Scope.Postpartum), postpartum.day.eq(3))
      .show({
        props: {
          ageLabel: 'Day 3',
          description:
            'Cord stump care is important. Keep dry and clean - it typically falls off in 1-3 weeks. AAP recommends sponge baths until it falls off.',
          suggestedDay: 3,
          title: 'Umbilical Cord Care Milestone',
          type: 'health',
        },
        template: 'Card.Milestone',
      })
      .priority(86)
      .build(),
  );

  // Day 4: First Sustained Gaze
  P.add(
    P.rule()
      .slot(Screen.Milestones, Slot.Header)
      .when(scope(Scope.Postpartum), postpartum.day.eq(4))
      .show({
        props: {
          ageLabel: 'Day 4',
          description:
            'Baby can hold gaze for several seconds. This is an early sign of visual and cognitive development.',
          suggestedDay: 4,
          title: 'First Sustained Gaze',
          type: 'cognitive',
        },
        template: 'Card.Milestone',
      })
      .priority(84)
      .build(),
  );

  // Day 4: Responds to Touch
  P.add(
    P.rule()
      .slot(Screen.Milestones, Slot.Header)
      .when(scope(Scope.Postpartum), postpartum.day.eq(4))
      .show({
        props: {
          ageLabel: 'Day 4',
          description:
            'Baby calms when held and touched gently. Tactile stimulation is crucial for neurological development.',
          suggestedDay: 4,
          title: 'Responds to Touch and Comfort',
          type: 'social',
        },
        template: 'Card.Milestone',
      })
      .priority(83)
      .build(),
  );

  // Day 4: Early Head Control
  P.add(
    P.rule()
      .slot(Screen.Milestones, Slot.Header)
      .when(scope(Scope.Postpartum), postpartum.day.eq(4))
      .show({
        props: {
          ageLabel: 'Day 4',
          description:
            'Baby begins brief moments of head control when held upright. Neck muscles are strengthening day by day.',
          suggestedDay: 4,
          title: 'Beginning Head Control',
          type: 'physical',
        },
        template: 'Card.Milestone',
      })
      .priority(85)
      .build(),
  );

  // Day 4: Feeding Pattern Emerging
  P.add(
    P.rule()
      .slot(Screen.Milestones, Slot.Header)
      .when(scope(Scope.Postpartum), postpartum.day.eq(4))
      .show({
        props: {
          ageLabel: 'Day 4',
          description:
            'Baby may start showing more predictable feeding patterns. Newborns typically feed 8-12 times per day.',
          suggestedDay: 4,
          title: 'Feeding Pattern Emerging',
          type: 'physical',
        },
        template: 'Card.Milestone',
      })
      .priority(82)
      .build(),
  );

  // Day 5: First Focus on Faces
  P.add(
    P.rule()
      .slot(Screen.Milestones, Slot.Header)
      .when(scope(Scope.Postpartum), postpartum.day.eq(5))
      .show({
        props: {
          ageLabel: 'Day 5',
          description:
            "Baby shows preference for looking at faces over other objects. Faces are the most interesting things in a newborn's world!",
          suggestedDay: 5,
          title: 'First Focus on Faces',
          type: 'cognitive',
        },
        template: 'Card.Milestone',
      })
      .priority(86)
      .build(),
  );

  // Day 5: Calms to Parent's Voice
  P.add(
    P.rule()
      .slot(Screen.Milestones, Slot.Header)
      .when(scope(Scope.Postpartum), postpartum.day.eq(5))
      .show({
        props: {
          ageLabel: 'Day 5',
          description:
            'Baby calms or becomes alert when hearing familiar voices. Early attachment and bonding are developing.',
          suggestedDay: 5,
          title: "Calms to Parent's Voice",
          type: 'social',
        },
        template: 'Card.Milestone',
      })
      .priority(84)
      .build(),
  );

  // Day 5: Hand-to-Mouth Movements
  P.add(
    P.rule()
      .slot(Screen.Milestones, Slot.Header)
      .when(scope(Scope.Postpartum), postpartum.day.eq(5))
      .show({
        props: {
          ageLabel: 'Day 5',
          description:
            'Baby brings hands near or to mouth. This self-soothing behavior is an important developmental milestone.',
          suggestedDay: 5,
          title: 'Hand-to-Mouth Movements',
          type: 'physical',
        },
        template: 'Card.Milestone',
      })
      .priority(83)
      .build(),
  );

  // Day 5: Increased Alertness
  P.add(
    P.rule()
      .slot(Screen.Milestones, Slot.Header)
      .when(scope(Scope.Postpartum), postpartum.day.eq(5))
      .show({
        props: {
          ageLabel: 'Day 5',
          description:
            'Longer periods of quiet alertness. Baby is more awake and ready to interact than in the first few days.',
          suggestedDay: 5,
          title: 'Increased Alertness Periods',
          type: 'cognitive',
        },
        template: 'Card.Milestone',
      })
      .priority(82)
      .build(),
  );

  // Day 6: First Object Tracking
  P.add(
    P.rule()
      .slot(Screen.Milestones, Slot.Header)
      .when(scope(Scope.Postpartum), postpartum.day.eq(6))
      .show({
        props: {
          ageLabel: 'Day 6',
          description:
            'Baby begins to follow moving objects with eyes. Visual tracking skills are emerging.',
          suggestedDay: 6,
          title: 'First Tracking of Objects',
          type: 'cognitive',
        },
        template: 'Card.Milestone',
      })
      .priority(85)
      .build(),
  );

  // Day 6: Sustained Eye Contact
  P.add(
    P.rule()
      .slot(Screen.Milestones, Slot.Header)
      .when(scope(Scope.Postpartum), postpartum.day.eq(6))
      .show({
        props: {
          ageLabel: 'Day 6',
          description:
            'More sustained periods of eye contact during interactions. Social connection is strengthening.',
          suggestedDay: 6,
          title: 'More Sustained Eye Contact',
          type: 'social',
        },
        template: 'Card.Milestone',
      })
      .priority(84)
      .build(),
  );

  // Day 6: First Voluntary Grasp
  P.add(
    P.rule()
      .slot(Screen.Milestones, Slot.Header)
      .when(scope(Scope.Postpartum), postpartum.day.eq(6))
      .show({
        props: {
          ageLabel: 'Day 6',
          description:
            'Baby may briefly grasp your finger when you touch the palm. The grasp reflex is strong and protective.',
          suggestedDay: 6,
          title: 'First Voluntary Grasp',
          type: 'physical',
        },
        template: 'Card.Milestone',
      })
      .priority(83)
      .build(),
  );

  // Day 6: Stronger Rooting Reflex
  P.add(
    P.rule()
      .slot(Screen.Milestones, Slot.Header)
      .when(scope(Scope.Postpartum), postpartum.day.eq(6))
      .show({
        props: {
          ageLabel: 'Day 6',
          description:
            'Rooting reflex becomes stronger and more consistent. Baby efficiently turns toward touch on cheek to find food.',
          suggestedDay: 6,
          title: 'Stronger Rooting Reflex',
          type: 'physical',
        },
        template: 'Card.Milestone',
      })
      .priority(82)
      .build(),
  );

  // Day 7: First Week Complete
  P.add(
    P.rule()
      .slot(Screen.Milestones, Slot.Header)
      .when(scope(Scope.Postpartum), postpartum.day.eq(7))
      .show({
        props: {
          ageLabel: 'Day 7',
          description:
            "You've made it through the first week - celebrate this huge milestone! Both baby and parents are adjusting to new rhythms.",
          suggestedDay: 7,
          title: 'First Week Complete',
          type: 'self_care',
        },
        template: 'Card.Milestone',
      })
      .priority(90)
      .build(),
  );

  // Day 7: First Bath Milestone
  P.add(
    P.rule()
      .slot(Screen.Milestones, Slot.Header)
      .when(scope(Scope.Postpartum), postpartum.day.eq(7))
      .show({
        props: {
          ageLabel: 'Day 7',
          description:
            'Many parents give first tub bath around this time if cord stump has fallen off. Otherwise, continue sponge baths.',
          suggestedDay: 7,
          title: 'First Bath Milestone',
          type: 'health',
        },
        template: 'Card.Milestone',
      })
      .priority(85)
      .build(),
  );

  // Day 7: Weight Check
  P.add(
    P.rule()
      .slot(Screen.Milestones, Slot.Header)
      .when(scope(Scope.Postpartum), postpartum.day.eq(7))
      .show({
        props: {
          ageLabel: 'Day 7',
          description:
            'Most babies regain birth weight by 2 weeks. Your pediatrician tracks growth to ensure baby is feeding well.',
          suggestedDay: 7,
          title: 'Week One Weight Check',
          type: 'health',
        },
        template: 'Card.Milestone',
      })
      .priority(88)
      .build(),
  );

  // Day 7: First Social Responsiveness
  P.add(
    P.rule()
      .slot(Screen.Milestones, Slot.Header)
      .when(scope(Scope.Postpartum), postpartum.day.eq(7))
      .show({
        props: {
          ageLabel: 'Day 7',
          description:
            'Baby is becoming more responsive to your voice and touch. Early social engagement is building attachment.',
          suggestedDay: 7,
          title: 'First Social Responsiveness',
          type: 'social',
        },
        template: 'Card.Milestone',
      })
      .priority(84)
      .build(),
  );

  // Day 7: Newborn Screening Results
  P.add(
    P.rule()
      .slot(Screen.Milestones, Slot.Header)
      .when(scope(Scope.Postpartum), postpartum.day.eq(7))
      .show({
        props: {
          ageLabel: 'Day 7',
          description:
            'Results from newborn screening tests (done at birth) are typically available. These tests check for treatable conditions.',
          suggestedDay: 7,
          title: 'Newborn Screening Results',
          type: 'health',
        },
        template: 'Card.Milestone',
      })
      .priority(86)
      .build(),
  );

  // Day 8: Distinguishing Between Cries
  P.add(
    P.rule()
      .slot(Screen.Milestones, Slot.Header)
      .when(scope(Scope.Postpartum), postpartum.day.eq(8))
      .show({
        props: {
          ageLabel: 'Day 8',
          description:
            'Baby develops distinct cry patterns for hunger, discomfort, and tiredness. Parents begin recognizing these differences.',
          suggestedDay: 8,
          title: 'First Distinctions Between Cries',
          type: 'language',
        },
        template: 'Card.Milestone',
      })
      .priority(85)
      .build(),
  );

  // Day 8: Beginning Visual Tracking
  P.add(
    P.rule()
      .slot(Screen.Milestones, Slot.Header)
      .when(scope(Scope.Postpartum), postpartum.day.eq(8))
      .show({
        props: {
          ageLabel: 'Day 8',
          description:
            'Baby can follow a moving object or face for brief periods. Visual tracking skills are rapidly developing.',
          suggestedDay: 8,
          title: 'Beginning Visual Tracking',
          type: 'cognitive',
        },
        template: 'Card.Milestone',
      })
      .priority(84)
      .build(),
  );

  // Day 8: More Predictable Sleep Cycles
  P.add(
    P.rule()
      .slot(Screen.Milestones, Slot.Header)
      .when(scope(Scope.Postpartum), postpartum.day.eq(8))
      .show({
        props: {
          ageLabel: 'Day 8',
          description:
            'Sleep and wake patterns become slightly more predictable. Newborns sleep 14-17 hours daily in short bursts.',
          suggestedDay: 8,
          title: 'More Predictable Sleep/Wake Cycles',
          type: 'physical',
        },
        template: 'Card.Milestone',
      })
      .priority(83)
      .build(),
  );

  // Day 9: Preference for Human Faces
  P.add(
    P.rule()
      .slot(Screen.Milestones, Slot.Header)
      .when(scope(Scope.Postpartum), postpartum.day.eq(9))
      .show({
        props: {
          ageLabel: 'Day 9',
          description:
            'Baby clearly prefers looking at human faces over other objects. This preference supports social and emotional development.',
          suggestedDay: 9,
          title: 'First Preference for Human Faces',
          type: 'social',
        },
        template: 'Card.Milestone',
      })
      .priority(86)
      .build(),
  );

  // Day 9: Responds to Gentle Sounds
  P.add(
    P.rule()
      .slot(Screen.Milestones, Slot.Header)
      .when(scope(Scope.Postpartum), postpartum.day.eq(9))
      .show({
        props: {
          ageLabel: 'Day 9',
          description:
            'Baby turns toward or calms to gentle sounds like soft voices and music. Auditory processing is developing.',
          suggestedDay: 9,
          title: 'Responds to Gentle Sounds',
          type: 'cognitive',
        },
        template: 'Card.Milestone',
      })
      .priority(84)
      .build(),
  );

  // Day 9: Early Neck Strength
  P.add(
    P.rule()
      .slot(Screen.Milestones, Slot.Header)
      .when(scope(Scope.Postpartum), postpartum.day.eq(9))
      .show({
        props: {
          ageLabel: 'Day 9',
          description:
            'Baby can hold head up briefly when supported upright. Neck muscles strengthen through daily tummy time practice.',
          suggestedDay: 9,
          title: 'Early Neck Strength Development',
          type: 'physical',
        },
        template: 'Card.Milestone',
      })
      .priority(85)
      .build(),
  );

  // Day 10: Deliberate Hand Movements
  P.add(
    P.rule()
      .slot(Screen.Milestones, Slot.Header)
      .when(scope(Scope.Postpartum), postpartum.day.eq(10))
      .show({
        props: {
          ageLabel: 'Day 10',
          description:
            'Baby makes more purposeful hand movements rather than random jerks. Motor control is improving.',
          suggestedDay: 10,
          title: 'First Deliberate Hand Movements',
          type: 'physical',
        },
        template: 'Card.Milestone',
      })
      .priority(84)
      .build(),
  );

  // Day 10: Optimal Focus Distance
  P.add(
    P.rule()
      .slot(Screen.Milestones, Slot.Header)
      .when(scope(Scope.Postpartum), postpartum.day.eq(10))
      .show({
        props: {
          ageLabel: 'Day 10',
          description:
            'Baby focuses best at 8-12 inches - the perfect distance for face-to-face interaction during feeding and play.',
          suggestedDay: 10,
          title: 'Focuses 8-12 Inches Away',
          type: 'cognitive',
        },
        template: 'Card.Milestone',
      })
      .priority(83)
      .build(),
  );

  // Day 10: More Alert During Feeds
  P.add(
    P.rule()
      .slot(Screen.Milestones, Slot.Header)
      .when(scope(Scope.Postpartum), postpartum.day.eq(10))
      .show({
        props: {
          ageLabel: 'Day 10',
          description:
            'Baby is more awake and engaged during feeding sessions. This alertness supports bonding and feeding efficiency.',
          suggestedDay: 10,
          title: 'More Alert During Feeds',
          type: 'cognitive',
        },
        template: 'Card.Milestone',
      })
      .priority(82)
      .build(),
  );

  // Day 11: Recognition of Feeding Times
  P.add(
    P.rule()
      .slot(Screen.Milestones, Slot.Header)
      .when(scope(Scope.Postpartum), postpartum.day.eq(11))
      .show({
        props: {
          ageLabel: 'Day 11',
          description:
            'Baby begins to anticipate feeding routines. Memory and pattern recognition are developing.',
          suggestedDay: 11,
          title: 'First Recognition of Feeding Times',
          type: 'cognitive',
        },
        template: 'Card.Milestone',
      })
      .priority(84)
      .build(),
  );

  // Day 11: Calms When Held
  P.add(
    P.rule()
      .slot(Screen.Milestones, Slot.Header)
      .when(scope(Scope.Postpartum), postpartum.day.eq(11))
      .show({
        props: {
          ageLabel: 'Day 11',
          description:
            'Baby reliably calms when picked up and held. This shows developing trust and secure attachment.',
          suggestedDay: 11,
          title: 'Calms When Held',
          type: 'social',
        },
        template: 'Card.Milestone',
      })
      .priority(85)
      .build(),
  );

  // Day 11: Increased Movement
  P.add(
    P.rule()
      .slot(Screen.Milestones, Slot.Header)
      .when(scope(Scope.Postpartum), postpartum.day.eq(11))
      .show({
        props: {
          ageLabel: 'Day 11',
          description:
            'Baby moves arms and legs more vigorously during awake time. Motor activity increases as nervous system matures.',
          suggestedDay: 11,
          title: 'Increased Movement During Awake Time',
          type: 'physical',
        },
        template: 'Card.Milestone',
      })
      .priority(83)
      .build(),
  );

  // Day 12: First Response to Voices
  P.add(
    P.rule()
      .slot(Screen.Milestones, Slot.Header)
      .when(scope(Scope.Postpartum), postpartum.day.eq(12))
      .show({
        props: {
          ageLabel: 'Day 12',
          description:
            'Baby clearly responds to different voices with changes in activity or expression. Social awareness is growing.',
          suggestedDay: 12,
          title: 'First Response to Voices',
          type: 'social',
        },
        template: 'Card.Milestone',
      })
      .priority(85)
      .build(),
  );

  // Day 12: Brief Head Lifting
  P.add(
    P.rule()
      .slot(Screen.Milestones, Slot.Header)
      .when(scope(Scope.Postpartum), postpartum.day.eq(12))
      .show({
        props: {
          ageLabel: 'Day 12',
          description:
            'During tummy time, baby can lift head briefly. Continue daily tummy time to build strength for later milestones.',
          suggestedDay: 12,
          title: 'Brief Head Lifting During Tummy Time',
          type: 'physical',
        },
        template: 'Card.Milestone',
      })
      .priority(86)
      .build(),
  );

  // Day 12: More Organized Sleep
  P.add(
    P.rule()
      .slot(Screen.Milestones, Slot.Header)
      .when(scope(Scope.Postpartum), postpartum.day.eq(12))
      .show({
        props: {
          ageLabel: 'Day 12',
          description:
            'Sleep patterns become more organized with slightly longer stretches. Day/night distinction is gradually developing.',
          suggestedDay: 12,
          title: 'More Organized Sleep Patterns',
          type: 'physical',
        },
        template: 'Card.Milestone',
      })
      .priority(83)
      .build(),
  );

  // Day 13: First Sustained Attention
  P.add(
    P.rule()
      .slot(Screen.Milestones, Slot.Header)
      .when(scope(Scope.Postpartum), postpartum.day.eq(13))
      .show({
        props: {
          ageLabel: 'Day 13',
          description:
            'Baby can maintain attention on a face or object for longer periods. Attention span is gradually increasing.',
          suggestedDay: 13,
          title: 'First Sustained Attention',
          type: 'cognitive',
        },
        template: 'Card.Milestone',
      })
      .priority(85)
      .build(),
  );

  // Day 13: Tracks Movement with Eyes
  P.add(
    P.rule()
      .slot(Screen.Milestones, Slot.Header)
      .when(scope(Scope.Postpartum), postpartum.day.eq(13))
      .show({
        props: {
          ageLabel: 'Day 13',
          description:
            'Baby smoothly tracks moving objects and people with eyes. Visual-motor coordination is improving.',
          suggestedDay: 13,
          title: 'Tracks Movement with Eyes',
          type: 'cognitive',
        },
        template: 'Card.Milestone',
      })
      .priority(84)
      .build(),
  );

  // Day 13: Beginning Social Smile
  P.add(
    P.rule()
      .slot(Screen.Milestones, Slot.Header)
      .when(scope(Scope.Postpartum), postpartum.day.eq(13))
      .show({
        props: {
          ageLabel: 'Day 13',
          description:
            'Some babies begin social smiling around this time. If not yet, most will smile by 6-8 weeks - all babies develop at their own pace.',
          suggestedDay: 13,
          title: 'Beginning of Social Smile',
          type: 'social',
        },
        template: 'Card.Milestone',
      })
      .priority(87)
      .build(),
  );

  // Day 14: Two-Week Pediatrician Visit
  P.add(
    P.rule()
      .slot(Screen.Milestones, Slot.Header)
      .when(scope(Scope.Postpartum), postpartum.day.eq(14))
      .show({
        props: {
          ageLabel: 'Day 14',
          description:
            'Two-week well-child visit includes weight check, feeding assessment, and developmental screening. Ask your pediatrician any questions.',
          suggestedDay: 14,
          title: 'Two-Week Pediatrician Visit',
          type: 'health',
        },
        template: 'Card.Milestone',
      })
      .priority(90)
      .build(),
  );

  // Day 14: First Potential Social Smile
  P.add(
    P.rule()
      .slot(Screen.Milestones, Slot.Header)
      .when(scope(Scope.Postpartum), postpartum.day.eq(14))
      .show({
        props: {
          ageLabel: 'Day 14',
          description:
            'Many babies smile responsively by 2 weeks. These first social smiles are magical milestones showing connection and communication.',
          suggestedDay: 14,
          title: 'First Potential Social Smile',
          type: 'social',
        },
        template: 'Card.Milestone',
      })
      .priority(88)
      .build(),
  );

  // Day 14: Established Feeding Routine
  P.add(
    P.rule()
      .slot(Screen.Milestones, Slot.Header)
      .when(scope(Scope.Postpartum), postpartum.day.eq(14))
      .show({
        props: {
          ageLabel: 'Day 14',
          description:
            'Feeding routine is more established with baby showing clearer hunger cues. Supply and demand have found their rhythm.',
          suggestedDay: 14,
          title: 'Established Feeding Routine',
          type: 'physical',
        },
        template: 'Card.Milestone',
      })
      .priority(85)
      .build(),
  );

  // Day 14: Clear Awake/Sleep Distinction
  P.add(
    P.rule()
      .slot(Screen.Milestones, Slot.Header)
      .when(scope(Scope.Postpartum), postpartum.day.eq(14))
      .show({
        props: {
          ageLabel: 'Day 14',
          description:
            'Difference between sleep and wake states is clearer. Baby has distinct alert, drowsy, and sleeping periods.',
          suggestedDay: 14,
          title: 'Clear Awake/Sleep Distinction',
          type: 'cognitive',
        },
        template: 'Card.Milestone',
      })
      .priority(84)
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
          description:
            'Baby turns toward familiar voices and sounds. Auditory memory is developing as baby distinguishes between voices.',
          suggestedDay: 21,
          title: "Recognizes Parent's Voice",
          type: 'cognitive',
        },
        template: 'Card.Milestone',
      })
      .priority(82)
      .build(),
  );

  // Week 3: Memory Development Emerges
  P.add(
    P.rule()
      .slot(Screen.Milestones, Slot.Header)
      .when(scope(Scope.Postpartum), postpartum.week.eq(3))
      .show({
        props: {
          ageLabel: 'Week 3',
          description:
            'Baby begins to recognize routine patterns like feeding times or bath time. Short-term memory is developing.',
          suggestedDay: 21,
          title: 'Memory Development Emerging',
          type: 'cognitive',
        },
        template: 'Card.Milestone',
      })
      .priority(81)
      .build(),
  );

  // Week 3: Cooing Begins
  P.add(
    P.rule()
      .slot(Screen.Milestones, Slot.Header)
      .when(scope(Scope.Postpartum), postpartum.week.eq(3))
      .show({
        props: {
          ageLabel: 'Week 3',
          description:
            'Baby makes cooing sounds beyond crying. These early vocalizations are precursors to language development.',
          suggestedDay: 21,
          title: 'Cooing Begins',
          type: 'language',
        },
        template: 'Card.Milestone',
      })
      .priority(83)
      .build(),
  );

  // Week 3: Sustained Eye Contact
  P.add(
    P.rule()
      .slot(Screen.Milestones, Slot.Header)
      .when(scope(Scope.Postpartum), postpartum.week.eq(3))
      .show({
        props: {
          ageLabel: 'Week 3',
          description:
            'Baby maintains eye contact for longer periods during interactions. This is crucial for social bonding and attachment.',
          suggestedDay: 21,
          title: 'Sustained Eye Contact',
          type: 'social',
        },
        template: 'Card.Milestone',
      })
      .priority(84)
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
          description:
            'Baby tracks moving objects with their eyes through a wider arc. Visual tracking is essential for future hand-eye coordination.',
          suggestedDay: 28,
          title: 'Follows Objects with Eyes',
          type: 'cognitive',
        },
        template: 'Card.Milestone',
      })
      .priority(83)
      .build(),
  );

  // Week 4: Facial Recognition Improves
  P.add(
    P.rule()
      .slot(Screen.Milestones, Slot.Header)
      .when(scope(Scope.Postpartum), postpartum.week.eq(4))
      .show({
        props: {
          ageLabel: 'Week 4',
          description:
            'Baby can distinguish between familiar and unfamiliar faces. Recognition memory is strengthening daily.',
          suggestedDay: 28,
          title: 'Facial Recognition Improves',
          type: 'cognitive',
        },
        template: 'Card.Milestone',
      })
      .priority(84)
      .build(),
  );

  // Week 4: More Expressive Cooing
  P.add(
    P.rule()
      .slot(Screen.Milestones, Slot.Header)
      .when(scope(Scope.Postpartum), postpartum.week.eq(4))
      .show({
        props: {
          ageLabel: 'Week 4',
          description:
            'Cooing becomes more varied and expressive. Baby is learning to use voice to communicate beyond crying.',
          suggestedDay: 28,
          title: 'More Expressive Cooing',
          type: 'language',
        },
        template: 'Card.Milestone',
      })
      .priority(82)
      .build(),
  );

  // Week 5: Purposeful Arm Movements
  P.add(
    P.rule()
      .slot(Screen.Milestones, Slot.Header)
      .when(scope(Scope.Postpartum), postpartum.week.eq(5))
      .show({
        props: {
          ageLabel: 'Week 5',
          description:
            'Arm movements become more controlled and purposeful. Baby is gaining motor control as brain-muscle connections strengthen.',
          suggestedDay: 35,
          title: 'Purposeful Arm Movements',
          type: 'physical',
        },
        template: 'Card.Milestone',
      })
      .priority(84)
      .build(),
  );

  // Week 5: Improved Head Control
  P.add(
    P.rule()
      .slot(Screen.Milestones, Slot.Header)
      .when(scope(Scope.Postpartum), postpartum.week.eq(5))
      .show({
        props: {
          ageLabel: 'Week 5',
          description:
            'Head control improves significantly when held upright. Neck strength continues building through tummy time.',
          suggestedDay: 35,
          title: 'Improved Head Control',
          type: 'physical',
        },
        template: 'Card.Milestone',
      })
      .priority(85)
      .build(),
  );

  // Week 5: Cause-Effect Understanding Begins
  P.add(
    P.rule()
      .slot(Screen.Milestones, Slot.Header)
      .when(scope(Scope.Postpartum), postpartum.week.eq(5))
      .show({
        props: {
          ageLabel: 'Week 5',
          description:
            'Baby begins noticing that actions have consequences - crying brings comfort, kicking makes mobile move. Early cognitive development.',
          suggestedDay: 35,
          title: 'Cause-Effect Understanding Begins',
          type: 'cognitive',
        },
        template: 'Card.Milestone',
      })
      .priority(83)
      .build(),
  );

  // Week 5: Social Smiling Increases
  P.add(
    P.rule()
      .slot(Screen.Milestones, Slot.Header)
      .when(scope(Scope.Postpartum), postpartum.week.eq(5))
      .show({
        props: {
          ageLabel: 'Week 5',
          description:
            'Social smiles become more frequent and consistent. Baby smiles in response to interaction, showing emotional connection.',
          suggestedDay: 35,
          title: 'Social Smiling Increases',
          type: 'social',
        },
        template: 'Card.Milestone',
      })
      .priority(86)
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

  // Week 9: Rolling Preparation
  P.add(
    P.rule()
      .slot(Screen.Milestones, Slot.Header)
      .when(scope(Scope.Postpartum), postpartum.week.eq(9))
      .show({
        props: {
          ageLabel: 'Week 9',
          description:
            'Baby begins movements that prepare for rolling - turning to side, stronger back muscles. Rolling typically begins 4-6 months.',
          suggestedDay: 63,
          title: 'Rolling Preparation Movements',
          type: 'physical',
        },
        template: 'Card.Milestone',
      })
      .priority(84)
      .build(),
  );

  // Week 9: Object Permanence Beginning
  P.add(
    P.rule()
      .slot(Screen.Milestones, Slot.Header)
      .when(scope(Scope.Postpartum), postpartum.week.eq(9))
      .show({
        props: {
          ageLabel: 'Week 9',
          description:
            'Early signs of object permanence - baby looks briefly for dropped objects. Understanding that things exist when out of sight develops over months.',
          suggestedDay: 63,
          title: 'Object Permanence Beginning',
          type: 'cognitive',
        },
        template: 'Card.Milestone',
      })
      .priority(83)
      .build(),
  );

  // Week 9: Grasping Improves
  P.add(
    P.rule()
      .slot(Screen.Milestones, Slot.Header)
      .when(scope(Scope.Postpartum), postpartum.week.eq(9))
      .show({
        props: {
          ageLabel: 'Week 9',
          description:
            'Baby grasps objects more deliberately and can hold them briefly. Fine motor skills are developing.',
          suggestedDay: 63,
          title: 'Grasping Objects Deliberately',
          type: 'physical',
        },
        template: 'Card.Milestone',
      })
      .priority(85)
      .build(),
  );

  // Week 9: Early Babbling Sounds
  P.add(
    P.rule()
      .slot(Screen.Milestones, Slot.Header)
      .when(scope(Scope.Postpartum), postpartum.week.eq(9))
      .show({
        props: {
          ageLabel: 'Week 9',
          description:
            'Babbling begins with consonant-vowel combinations. Baby experiments with different sounds - precursor to speech.',
          suggestedDay: 63,
          title: 'Early Babbling Starts',
          type: 'language',
        },
        template: 'Card.Milestone',
      })
      .priority(86)
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
          description:
            'Baby discovers their hands and brings them together. This midline crossing is important for bilateral coordination.',
          suggestedDay: 70,
          title: 'Brings Hands Together',
          type: 'physical',
        },
        template: 'Card.Milestone',
      })
      .priority(81)
      .build(),
  );

  // Week 11: Stronger Neck and Back
  P.add(
    P.rule()
      .slot(Screen.Milestones, Slot.Header)
      .when(scope(Scope.Postpartum), postpartum.week.eq(11))
      .show({
        props: {
          ageLabel: 'Week 11',
          description:
            'Significant neck and back strength gains. Baby can hold head steady for extended periods and lift chest during tummy time.',
          suggestedDay: 77,
          title: 'Stronger Neck and Back Muscles',
          type: 'physical',
        },
        template: 'Card.Milestone',
      })
      .priority(85)
      .build(),
  );

  // Week 11: Responsive Laughing
  P.add(
    P.rule()
      .slot(Screen.Milestones, Slot.Header)
      .when(scope(Scope.Postpartum), postpartum.week.eq(11))
      .show({
        props: {
          ageLabel: 'Week 11',
          description:
            'Baby laughs responsively during play and interaction. Emotional expression and social engagement are flourishing.',
          suggestedDay: 77,
          title: 'Responsive Laughing',
          type: 'social',
        },
        template: 'Card.Milestone',
      })
      .priority(86)
      .build(),
  );

  // Week 11: Visual Tracking Mastered
  P.add(
    P.rule()
      .slot(Screen.Milestones, Slot.Header)
      .when(scope(Scope.Postpartum), postpartum.week.eq(11))
      .show({
        props: {
          ageLabel: 'Week 11',
          description:
            'Baby smoothly tracks moving objects 180 degrees. Eye muscles are coordinated and visual attention is strong.',
          suggestedDay: 77,
          title: 'Visual Tracking Mastered',
          type: 'cognitive',
        },
        template: 'Card.Milestone',
      })
      .priority(84)
      .build(),
  );

  // Week 11: Varied Vocalizations
  P.add(
    P.rule()
      .slot(Screen.Milestones, Slot.Header)
      .when(scope(Scope.Postpartum), postpartum.week.eq(11))
      .show({
        props: {
          ageLabel: 'Week 11',
          description:
            'Babbling includes more varied sounds and pitch changes. Baby is experimenting with vocal range and communication.',
          suggestedDay: 77,
          title: 'Varied Vocalizations',
          type: 'language',
        },
        template: 'Card.Milestone',
      })
      .priority(83)
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
  // Note: AI-generated contextual milestones would be implemented here
  // using the GenerateContextualMilestones BAML function. However, the
  // milestones program currently doesn't support the compute() and aiTextBaml()
  // APIs that would be needed. This feature should be implemented in the
  // example-program.ts instead, which has full support for dynamic content.

  return P;
}

// Export the program builder
export { Program };
