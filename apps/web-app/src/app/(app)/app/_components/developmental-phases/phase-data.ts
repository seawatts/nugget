export type SubPhaseType = 'fussy' | 'skills';

export interface FussyBehavior {
  id: string;
  title: string;
  summary: string;
  learnMore: string;
  soothingIdeas: string[];
}

export interface SkillFocus {
  id: string;
  title: string;
  summary: string;
  encouragement: string[];
}

export interface DevelopmentalPhaseContent {
  id: string;
  phaseNumber: number;
  name: string;
  theme: 'sunrise' | 'mint' | 'cloud';
  startDay: number;
  endDay: number;
  headline: string;
  fussy: {
    intro: string;
    behaviors: FussyBehavior[];
  };
  skills: {
    intro: string;
    focuses: SkillFocus[];
  };
}

export const DEVELOPMENTAL_PHASES: DevelopmentalPhaseContent[] = [
  {
    endDay: 49,
    fussy: {
      behaviors: [
        {
          id: 'phase1-touch',
          learnMore:
            'Baby realizes that touch feels different everywhere. Light swaddles and slow hand rubs give them the structure they are craving.',
          soothingIdeas: [
            'Hold baby skin-to-skin for a few minutes before naps.',
            'Offer a slow rock while softly narrating what they feel.',
          ],
          summary: 'Sudden sensitivity to textures and temperature changes.',
          title: 'Overloaded Senses',
        },
        {
          id: 'phase1-clingy',
          learnMore:
            'Baby is discovering the distance between you and them. When you step away, their nervous system fires off alarms.',
          soothingIdeas: [
            'Give baby warning before stepping away (e.g., “back in two breaths”).',
            'Use a carrier during the day so baby still feels your heartbeat.',
          ],
          summary: 'Wants to be held constantly and protests when put down.',
          title: 'Velcro Baby',
        },
        {
          id: 'phase1-sleep',
          learnMore:
            'Sleep cycles stretch as brain wiring changes. Falling asleep might take longer, but the body still needs the same total rest.',
          soothingIdeas: [
            'Shorten wake windows by 10 minutes for a few days.',
            'Dim lights and run white noise 15 minutes before bedtime.',
          ],
          summary: 'Short naps or bedtime battles crop up unexpectedly.',
          title: 'Sleep Shuffle',
        },
      ],
      intro:
        'These sensations feel brand new and overwhelming. Expect clinginess and brief sleep hiccups.',
    },
    headline: 'Your baby suddenly notices every sound, light, and draft.',
    id: 'phase-1',
    name: 'Sensations',
    phaseNumber: 1,
    skills: {
      focuses: [
        {
          encouragement: [
            'Move a high-contrast card slowly left to right 12–18 inches away.',
            'Pause near the midline to let baby “lock on” before moving again.',
          ],
          id: 'phase1-tracking',
          summary:
            'Eyes start working together, making slow, smooth tracking possible.',
          title: 'Tracking Faces & Shapes',
        },
        {
          encouragement: [
            'Hum the same tune at diaper changes so baby predicts the sound.',
            'Try gentle shakers or rattles to introduce cause and effect.',
          ],
          id: 'phase1-sound',
          summary:
            'Recognizes familiar tones and turns toward your voice quicker.',
          title: 'Sound Recognition',
        },
        {
          encouragement: [
            'Smile widely, wait for baby to look, then mirror any mouth movement.',
            'Use bath time to practice “hello cheeks” games and gentle tickles.',
          ],
          id: 'phase1-social',
          summary: 'First social smiles arrive, along with more eye contact.',
          title: 'Early Social Smiles',
        },
      ],
      intro:
        'Once the storm settles, baby is ready to practice small-but-mighty body control skills.',
    },
    startDay: 30,
    theme: 'sunrise',
  },
  {
    endDay: 70,
    fussy: {
      behaviors: [
        {
          id: 'phase2-feeding',
          learnMore:
            'Digestive rhythms change, so baby may feed in shorter bursts but more often. It is temporary while patterns recalibrate.',
          soothingIdeas: [
            'Offer a quiet, low-light feeding space during the day.',
            'Try paced bottle techniques to slow gulping.',
          ],
          summary:
            'Feeding patterns wobble between marathon sessions and snack attacks.',
          title: 'Feeding Swings',
        },
        {
          id: 'phase2-cries',
          learnMore:
            'Crying is the only way to reset when their brain is tired from processing repeating shapes and sequences.',
          soothingIdeas: [
            'Use patterned pats (tap-tap-rest) on their bottom to match what they are exploring.',
            'Step outside for fresh air—new sights often interrupt a cry cycle.',
          ],
          summary: 'Crying spikes mostly in the late afternoon.',
          title: 'Pattern Fatigue',
        },
        {
          id: 'phase2-comfort',
          learnMore:
            'They are experimenting with predictability. When something changes, they look to you for confirmation.',
          soothingIdeas: [
            'Narrate transitions: “Lights off, now we sway.”',
            'Try a simple routine (song + stretch + cuddle) before sleep.',
          ],
          summary:
            'Needs additional reassurance moving between play, feeds, and sleep.',
          title: 'Transition Wobbles',
        },
      ],
      intro:
        'Baby is busy figuring out repeating shapes and sounds, which tires them out quickly.',
    },
    headline: 'Patterns become fascinating, but routines feel shaky for a bit.',
    id: 'phase-2',
    name: 'Patterns',
    phaseNumber: 2,
    skills: {
      focuses: [
        {
          encouragement: [
            'Lay baby under a play gym and rotate the dangling toys daily.',
            'Use patterned scarves for peekaboo in slow motion.',
          ],
          id: 'phase2-visual',
          summary:
            'Watches repeating stripes, dots, and shadows with deep focus.',
          title: 'Pattern Spotting',
        },
        {
          encouragement: [
            'Offer lightweight rattles to explore both hands.',
            'Guide their hands together at midline to clap or pat a soft toy.',
          ],
          id: 'phase2-hands',
          summary:
            'Hands discover they can move in sync, leading to early grabbing.',
          title: 'Hand Coordination',
        },
        {
          encouragement: [
            'Repeat vowel sounds back-and-forth like a mini duet.',
            'Pause after you coo to invite baby to answer.',
          ],
          id: 'phase2-voice',
          summary: 'Vocal play grows louder with new squeals and coos.',
          title: 'Voice Experiments',
        },
      ],
      intro:
        'After the fussiness, baby wants to play with patterns they just discovered.',
    },
    startDay: 50,
    theme: 'mint',
  },
  {
    endDay: 98,
    fussy: {
      behaviors: [
        {
          id: 'phase3-mood',
          learnMore:
            'Smooth transitions require more brain power. Mood swings are their way of practicing control over starts and stops.',
          soothingIdeas: [
            'Label their feelings (“Whoa, big feelings!”) before comforting.',
            'Offer predictable countdowns when lifting or lowering them.',
          ],
          summary: 'Mood can flip quickly, even inside a single play session.',
          title: 'Emotion Fireworks',
        },
        {
          id: 'phase3-appetite',
          learnMore:
            'Growth spurts meet curiosity. They might snack, then immediately want to move around again.',
          soothingIdeas: [
            'Break feedings into two smaller sessions with a burp + stretch in between.',
            'Try more frequent daytime feeds to protect nighttime sleep.',
          ],
          summary: 'Appetite explodes one day and dips the next.',
          title: 'Appetite Rollercoaster',
        },
        {
          id: 'phase3-attention',
          learnMore:
            'They want to connect movements with outcomes. When they cannot finish the sequence, they call you in.',
          soothingIdeas: [
            'Offer floor time close to you so they can glance up for encouragement.',
            'Help them “finish” motions like tapping a toy twice.',
          ],
          summary: 'Demands your presence during play to feel secure.',
          title: 'Coaching Requests',
        },
      ],
      intro:
        'Learning smooth transitions is exhausting—expect dramatic check-ins.',
    },
    headline: 'Baby practices linking movements together, even while tired.',
    id: 'phase-3',
    name: 'Smooth Transitions',
    phaseNumber: 3,
    skills: {
      focuses: [
        {
          encouragement: [
            'Guide their arms through slow circles during tummy time.',
            'Offer soft scarves to swish from side to side.',
          ],
          id: 'phase3-movement',
          summary: 'Movements look less jerky as muscles learn to glide.',
          title: 'Fluid Motion',
        },
        {
          encouragement: [
            'Place toys slightly out of reach so baby plants hands before lunging.',
            'Give baby lightweight rings to pass back and forth.',
          ],
          id: 'phase3-reaching',
          summary: 'Arms extend with intent to grab and bring objects closer.',
          title: 'Purposeful Reaching',
        },
        {
          encouragement: [
            'Sing syllable chains (“ma-ma-ma”) and wait for baby to copy.',
            'Use mirrors so baby watches their own mouth while babbling.',
          ],
          id: 'phase3-voice',
          summary:
            'Practices different volumes and pitches, exploring control.',
          title: 'Voice Control',
        },
      ],
      intro: 'This phase unlocks longer play sequences and richer babbles.',
    },
    startDay: 71,
    theme: 'cloud',
  },
];
