/**
 * Content Cache for AI-generated responses
 *
 * This module provides pre-generated, realistic AI responses to avoid making
 * actual LLM API calls during development, testing, and seeding.
 *
 * Responses are based on the BAML function signatures and are designed to match
 * the expected output format and quality of real AI-generated content.
 */

import type {
	CelebrationSummaryOutput,
	MilestoneExplanationOutput,
	DailyLearningPlan,
	LearningTip,
	CelebrationQuestionsOutput,
	BabyAssistantChatOutput,
	AppointmentNudgeOutput,
} from './baml_client/types';

/**
 * Cache key generator for consistent lookups
 */
export function generateCacheKey(
	functionName: string,
	params: Record<string, unknown>,
): string {
	// Create a stable key from function name and critical params
	const criticalKeys = ['babyName', 'ageInDays', 'celebrationType', 'milestoneTitle', 'category'];
	const keyParts = [functionName];

	for (const key of criticalKeys) {
		if (key in params) {
			keyParts.push(`${key}:${String(params[key])}`);
		}
	}

	return keyParts.join('|');
}

/**
 * Cache for Celebration Summaries
 */
export const celebrationSummaryCache = new Map<string, CelebrationSummaryOutput>([
	// Week celebrations
	[
		'week_1',
		{
			summary: "Emma is starting to track movement with their eyes. Soon you'll see their first social smile!",
		},
	],
	[
		'week_2',
		{
			summary: "At 2 weeks, Emma recognizes your voice and loves skin-to-skin contact. Watch for those tiny coos to begin any day now!",
		},
	],
	[
		'week_3',
		{
			summary: "Emma just doubled their alert time during the day. Next up: longer stretches of sleep at night!",
		},
	],
	[
		'week_4',
		{
			summary: "Their startle reflex is strong now. In a few weeks, Emma will have better head control during tummy time.",
		},
	],

	// Month celebrations
	[
		'month_1',
		{
			summary: "Emma is settling into feeding patterns and showing more alertness. Soon they'll start showing hunger cues before crying!",
		},
	],
	[
		'month_2',
		{
			summary: "Emma's social smiles are blooming and they're tracking objects with their eyes. Get ready for delightful cooing sounds!",
		},
	],
	[
		'month_3',
		{
			summary: "Emma is reaching for toys and discovering their hands. Rolling over and laughing out loud are just around the corner!",
		},
	],
	[
		'month_4',
		{
			summary: "Emma's personality is really shining through with giggles and squeals. They'll soon be grabbing everything in sight!",
		},
	],
	[
		'month_5',
		{
			summary: "Emma is rolling both ways and working on sitting with support. Watch for those first tastes of solid foods coming soon!",
		},
	],
	[
		'month_6',
		{
			summary: "Emma is sitting independently and exploring new textures through solid foods. Crawling adventures are on the horizon!",
		},
	],
]);

/**
 * Cache for Milestone Explanations
 */
export const milestoneExplanationCache = new Map<string, MilestoneExplanationOutput>([
	[
		'First Meconium Diaper',
		{
			explanation: "Meconium is baby's first bowel movement - a dark, sticky substance that was in their intestines before birth. It's completely normal and shows their digestive system is working!",
			whyItMatters: "Passing meconium within 24-48 hours indicates healthy bowel function and helps clear bilirubin to prevent jaundice.",
			whatToExpect: "Expect 2-3 meconium diapers in the first couple days, then transition to greenish-brown, then yellow stools.",
			tips: [
				"Use petroleum jelly on bottom before meconium - makes cleanup easier",
				"Track diaper output to ensure baby is feeding well",
				"Meconium is stubborn but warm water helps clean it off",
			],
			reassurance: "Every baby passes meconium at their own pace - don't worry if it takes a day or two!",
		},
	],
	[
		'First Social Smile',
		{
			explanation: "A social smile is when your baby smiles in response to you, not just randomly. It's one of the first signs of emotional connection and social development!",
			whyItMatters: "Social smiling shows brain development, vision improvement, and the beginning of social-emotional bonding.",
			whatToExpect: "You'll see more smiles during face-to-face interaction, and soon they'll smile at familiar voices and faces.",
			tips: [
				"Make eye contact and smile often to encourage more smiling",
				"Talk in a sing-song voice - babies love it",
				"Take lots of photos - these precious smiles grow more frequent",
			],
			reassurance: "Some babies smile earlier than others - anywhere from 6-12 weeks is perfectly normal!",
		},
	],
	[
		'Holds Head Up During Tummy Time',
		{
			explanation: "When your baby can lift and hold their head during tummy time, it shows developing neck and upper body strength. This is a major motor milestone!",
			whyItMatters: "Head control is foundational for sitting, crawling, and all future motor skills. It also helps prevent flat spots on the head.",
			whatToExpect: "Head control will continue improving - soon they'll hold it steady while sitting and turn it in all directions.",
			tips: [
				"Do tummy time multiple times a day, even just 3-5 minutes",
				"Get down at their level to encourage them to look up",
				"Place a mirror or toy in front to make it more engaging",
			],
			reassurance: "Every baby develops at their own pace - consistent tummy time practice makes all the difference!",
		},
	],
	[
		'First Laugh',
		{
			explanation: "Your baby's first real laugh is a beautiful sign of social and emotional development. It shows they understand cause and effect and enjoy interaction!",
			whyItMatters: "Laughter strengthens your bond, encourages more social interaction, and indicates healthy emotional development.",
			whatToExpect: "Laughs will become more frequent and you'll discover what makes your baby giggle - peek-a-boo, funny sounds, gentle tickles.",
			tips: [
				"Make silly faces and sounds - babies love exaggerated expressions",
				"Try gentle bouncing or lifting them up",
				"Peek-a-boo becomes funnier as they understand object permanence",
			],
			reassurance: "First laughs typically happen between 3-4 months, but some babies take a bit longer - keep being playful!",
		},
	],
	[
		'Reaches for Objects',
		{
			explanation: "When your baby intentionally reaches for toys or objects, it shows developing hand-eye coordination and understanding of their body. This is huge!",
			whyItMatters: "Reaching is a critical step toward grasping, manipulating objects, and eventually self-feeding and crawling.",
			whatToExpect: "Reaches will become more accurate and purposeful. Soon they'll be grabbing everything and bringing it to their mouth to explore.",
			tips: [
				"Hold toys slightly out of reach to encourage reaching practice",
				"Offer different textures and sizes to explore",
				"Supervise closely as everything goes to their mouth now",
			],
			reassurance: "Most babies start reaching around 4 months, but the exact timing varies - keep offering interesting objects!",
		},
	],
	[
		'Rolls Over',
		{
			explanation: "Rolling over is a major motor milestone that shows core strength and coordination. It's also the first time your baby can change their position independently!",
			whyItMatters: "Rolling is essential for developing the muscles needed for sitting, crawling, and all future movement.",
			whatToExpect: "Most babies roll front-to-back first, then back-to-front. Soon they'll be rolling across the room!",
			tips: [
				"Always supervise - never leave baby unattended on elevated surfaces",
				"Practice tummy time to build the necessary muscles",
				"Place interesting toys to one side to encourage rolling",
			],
			reassurance: "Timing varies widely - anywhere from 3-6 months is normal. Some babies skip rolling and go straight to sitting!",
		},
	],
]);

/**
 * Cache for Daily Learning Plans
 */
export function generateLearningPlan(ageInDays: number, babyName: string): DailyLearningPlan {
	// Immediate postbirth (Days 1-3)
	if (ageInDays <= 3) {
		return {
			items: [
				{
					category: 'feeding',
					title: 'Colostrum: Your Baby\'s First Food',
					subtitle: 'Liquid Gold Nutrition',
					relevance: `${babyName} needs colostrum's concentrated nutrients and immune protection in these first critical days.`,
					priority: 5,
					avoidDuplicateOf: [],
					recommendYesNo: false,
				},
				{
					category: 'diaper',
					title: 'First Meconium Diaper',
					subtitle: 'Dark and Sticky',
					relevance: 'Meconium passage indicates healthy digestive function - critical to monitor in first 48 hours.',
					priority: 5,
					avoidDuplicateOf: [],
					recommendYesNo: true,
				},
				{
					category: 'health',
					title: 'Jaundice Watch',
					subtitle: 'Yellow Tint Check',
					relevance: 'Bilirubin peaks around day 3-4, making this the critical time to monitor for jaundice.',
					priority: 4,
					avoidDuplicateOf: [],
					recommendYesNo: true,
				},
			],
			reasoning: 'Focusing on critical health monitoring for days 1-3: feeding establishment, diaper output tracking, and jaundice awareness. These are urgent, time-sensitive topics for new parents.',
			coveredCategories: ['feeding', 'diaper', 'health'],
			urgentHealthChecks: true,
		};
	}

	// First week (Days 4-7)
	if (ageInDays <= 7) {
		return {
			items: [
				{
					category: 'feeding',
					title: 'Milk Coming In',
					subtitle: 'From Colostrum to Milk',
					relevance: `Milk typically comes in around days 3-5. ${babyName} needs frequent feeding as this transition happens.`,
					priority: 5,
					avoidDuplicateOf: [],
					recommendYesNo: false,
				},
				{
					category: 'sleep',
					title: 'Day-Night Confusion',
					subtitle: 'Flipping the Schedule',
					relevance: 'Newborns often have reversed sleep patterns - practical tips can help establish better nighttime sleep.',
					priority: 3,
					avoidDuplicateOf: [],
					recommendYesNo: false,
				},
				{
					category: 'postpartum',
					title: 'Postpartum Recovery Basics',
					subtitle: 'Caring for Yourself Too',
					relevance: 'First-week recovery is crucial - parents need reminders to rest and watch for warning signs.',
					priority: 4,
					avoidDuplicateOf: [],
					recommendYesNo: false,
				},
			],
			reasoning: 'Week 1 priorities: milk supply establishment, sleep pattern guidance, and parental self-care. Balancing baby needs with parental wellness.',
			coveredCategories: ['feeding', 'sleep', 'postpartum'],
			urgentHealthChecks: true,
		};
	}

	// Second week (Days 8-14)
	if (ageInDays <= 14) {
		return {
			items: [
				{
					category: 'development',
					title: 'Reading Baby\'s Cues',
					subtitle: 'Understanding Their Signals',
					relevance: `${babyName} is communicating through cues - learning to read hunger, sleep, and stress signals makes caregiving easier.`,
					priority: 4,
					avoidDuplicateOf: [],
					recommendYesNo: false,
				},
				{
					category: 'development',
					title: 'Tummy Time Introduction',
					subtitle: 'Building Strength',
					relevance: 'Week 2 is ideal to start short tummy time sessions to build neck and shoulder strength.',
					priority: 3,
					avoidDuplicateOf: [],
					recommendYesNo: false,
				},
				{
					category: 'health',
					title: 'Two-Week Checkup Prep',
					subtitle: 'What to Expect',
					relevance: 'Upcoming two-week visit will include weight check and developmental assessment - know what to expect.',
					priority: 4,
					avoidDuplicateOf: [],
					recommendYesNo: false,
				},
			],
			reasoning: 'Week 2 focus: developmental observations, preventive exercises, and healthcare preparation. Building foundational skills.',
			coveredCategories: ['development', 'health'],
			urgentHealthChecks: false,
		};
	}

	// Third week (Days 15-21)
	if (ageInDays <= 21) {
		return {
			items: [
				{
					category: 'development',
					title: 'Early Social Smiling',
					subtitle: 'First Real Smiles',
					relevance: `${babyName} may start showing early social smiles - engaging with them encourages this beautiful milestone.`,
					priority: 3,
					avoidDuplicateOf: [],
					recommendYesNo: false,
				},
				{
					category: 'feeding',
					title: 'Feeding Pattern Recognition',
					subtitle: 'Spotting the Rhythm',
					relevance: `By week 3, ${babyName}'s feeding patterns become more predictable - understanding them helps plan your day.`,
					priority: 3,
					avoidDuplicateOf: [],
					recommendYesNo: false,
				},
				{
					category: 'sleep',
					title: 'Sleep Stretches',
					subtitle: 'Longer Nighttime Sleep',
					relevance: 'Some babies start sleeping 4-5 hour stretches at night - safe sleep practices remain crucial.',
					priority: 3,
					avoidDuplicateOf: [],
					recommendYesNo: false,
				},
			],
			reasoning: 'Week 3 priorities: social-emotional development, pattern recognition, and sleep optimization. Balancing development with practical routines.',
			coveredCategories: ['development', 'feeding', 'sleep'],
			urgentHealthChecks: false,
		};
	}

	// Month One (Days 22-42)
	if (ageInDays <= 42) {
		return {
			items: [
				{
					category: 'development',
					title: 'One-Month Milestones',
					subtitle: 'What to Expect',
					relevance: `${babyName} is reaching one month - typical milestones include better head control and more alert periods.`,
					priority: 3,
					avoidDuplicateOf: [],
					recommendYesNo: false,
				},
				{
					category: 'development',
					title: 'Social Smiling',
					subtitle: 'Responding to You',
					relevance: 'Social smiling should be emerging now - these interactions strengthen your bond and their development.',
					priority: 3,
					avoidDuplicateOf: [],
					recommendYesNo: false,
				},
				{
					category: 'feeding',
					title: 'Feeding Schedule Tips',
					subtitle: 'Creating Predictability',
					relevance: `${babyName}'s feeding patterns are more established - gentle scheduling can help structure your day.`,
					priority: 2,
					avoidDuplicateOf: [],
					recommendYesNo: false,
				},
			],
			reasoning: 'Month 1 focus: milestone awareness, social-emotional bonding, and routine establishment. Supporting confident parenting.',
			coveredCategories: ['development', 'feeding'],
			urgentHealthChecks: false,
		};
	}

	// Month Two (Days 43-70)
	if (ageInDays <= 70) {
		return {
			items: [
				{
					category: 'development',
					title: 'Cooing and Vocalization',
					subtitle: 'First Sounds',
					relevance: `${babyName} is likely starting to coo and make vowel sounds - responding to them encourages language development.`,
					priority: 3,
					avoidDuplicateOf: [],
					recommendYesNo: false,
				},
				{
					category: 'development',
					title: 'Batting at Objects',
					subtitle: 'Hand-Eye Coordination',
					relevance: 'Hand-eye coordination is developing - offering toys to bat at builds motor skills.',
					priority: 3,
					avoidDuplicateOf: [],
					recommendYesNo: false,
				},
				{
					category: 'health',
					title: 'Two-Month Vaccines',
					subtitle: 'What to Expect',
					relevance: 'Upcoming two-month checkup includes first vaccines - know what to expect and how to comfort afterward.',
					priority: 4,
					avoidDuplicateOf: [],
					recommendYesNo: false,
				},
			],
			reasoning: 'Month 2 focus: communication development, motor skill building, and healthcare preparation. Supporting active engagement.',
			coveredCategories: ['development', 'health'],
			urgentHealthChecks: false,
		};
	}

	// Months Three-Four (Days 71-120)
	return {
		items: [
			{
				category: 'sleep',
				title: 'Four-Month Sleep Regression',
				subtitle: 'Understanding the Change',
				relevance: `${babyName} may be approaching the 4-month sleep regression - understanding it helps you prepare and cope.`,
				priority: 4,
				avoidDuplicateOf: [],
				recommendYesNo: false,
			},
			{
				category: 'development',
				title: 'Rolling Over',
				subtitle: 'First Big Movement',
				relevance: 'Rolling typically starts between 3-4 months - safe sleep practices become even more important.',
				priority: 3,
				avoidDuplicateOf: [],
				recommendYesNo: false,
			},
			{
				category: 'development',
				title: 'Reaching and Grasping',
				subtitle: 'Intentional Movement',
				relevance: `${babyName} is becoming more intentional with hand movements - providing appropriate toys supports development.`,
				priority: 3,
				avoidDuplicateOf: [],
				recommendYesNo: false,
			},
		],
		reasoning: 'Months 3-4 focus: major sleep changes, gross motor milestones, and fine motor development. Preparing for increased mobility.',
		coveredCategories: ['sleep', 'development'],
		urgentHealthChecks: false,
	};
}

/**
 * Cache for Learning Tips (stage-specific content generation)
 */
export function generateLearningTip(
	category: string,
	title: string,
	babyName: string,
	ageInDays: number,
): LearningTip {
	const tips: Record<string, LearningTip> = {
		'Colostrum: Your Baby\'s First Food': {
			category: 'feeding',
			subtitle: 'Liquid Gold',
			summary: 'Colostrum is perfectly designed for your newborn\'s tiny stomach and immune system.',
			bulletPoints: [
				'Feed frequently (8-12x daily) - colostrum is concentrated nutrition',
				'Small amounts are normal - stomach is marble-sized',
				'Helps pass meconium and prevent jaundice',
			],
			followUpQuestion: `How many times has ${babyName} fed in the last 24 hours?`,
			isYesNoQuestion: false,
		},
		'First Meconium Diaper': {
			category: 'diaper',
			subtitle: 'Dark and Sticky',
			summary: 'Meconium is your baby\'s first bowel movement - dark, tar-like, and totally normal.',
			bulletPoints: [
				'Should pass within 24-48 hours of birth',
				'Use petroleum jelly before diaper for easier cleanup',
				'Transitions to yellow/seedy stools by day 4-5',
			],
			followUpQuestion: `Has ${babyName} had a meconium diaper yet?`,
			isYesNoQuestion: true,
			openChatOnNo: true,
		},
		'Jaundice Watch': {
			category: 'health',
			subtitle: 'Yellow Tint',
			summary: 'Many newborns develop jaundice - know what\'s normal and when to call the doctor.',
			bulletPoints: [
				'Peaks around days 3-5, then improves',
				'Check skin tone in natural light',
				'Call doctor if yellowing reaches legs or baby seems lethargic',
			],
			followUpQuestion: `Does ${babyName}'s skin or eyes look yellow?`,
			isYesNoQuestion: true,
			openChatOnYes: true,
		},
		'Milk Coming In': {
			category: 'feeding',
			subtitle: 'The Transition',
			summary: 'Your milk transitions from colostrum to mature milk around days 3-5.',
			bulletPoints: [
				'Breasts may feel full, warm, or engorged',
				'Feed frequently to establish supply',
				'Use cold compresses between feeds if uncomfortable',
			],
			followUpQuestion: 'Have you noticed your milk coming in yet?',
			isYesNoQuestion: true,
		},
		'Day-Night Confusion': {
			category: 'sleep',
			subtitle: 'Flipping the Schedule',
			summary: 'Newborns often sleep more during the day - here\'s how to gently shift this.',
			bulletPoints: [
				'Keep days bright and stimulating, nights dark and boring',
				'Cap daytime naps at 2-3 hours',
				'Feed every 2-3 hours during day to tank up',
			],
			followUpQuestion: `Is ${babyName} more awake at night than during the day?`,
			isYesNoQuestion: true,
		},
		'Reading Baby\'s Cues': {
			category: 'development',
			subtitle: 'Understanding Signals',
			summary: 'Babies communicate through cues before they cry - learning these makes life easier.',
			bulletPoints: [
				'Hunger: rooting, sucking on hands, fussiness',
				'Tired: red eyebrows, yawning, looking away',
				'Overstimulated: arching back, turning away, frantic movement',
			],
			followUpQuestion: 'What cues have you noticed when your baby is hungry or tired?',
		},
		'Tummy Time Introduction': {
			category: 'development',
			subtitle: 'Building Strength',
			summary: 'Tummy time builds muscles for rolling, sitting, and crawling.',
			bulletPoints: [
				'Start with 3-5 minutes, 2-3 times daily',
				'Get down at eye level to encourage',
				'Try after diaper change when baby is alert',
			],
			followUpQuestion: `How does ${babyName} respond to tummy time?`,
		},
		'Four-Month Sleep Regression': {
			category: 'sleep',
			subtitle: 'Understanding the Change',
			summary: 'Around 4 months, sleep patterns permanently change as brain matures.',
			bulletPoints: [
				'Baby shifts from newborn to adult sleep cycles',
				'Wake-ups increase temporarily (2-6 weeks)',
				'Maintain consistent bedtime routine',
			],
			followUpQuestion: 'Has your baby\'s sleep suddenly become more disrupted?',
			isYesNoQuestion: true,
			openChatOnYes: true,
		},
	};

	return tips[title] || {
		category,
		subtitle: 'Important Info',
		summary: `Key information about ${title.toLowerCase()} for ${babyName} at this stage.`,
		bulletPoints: [
			'Follow your pediatrician\'s guidance',
			'Trust your instincts as a parent',
			'Every baby develops at their own pace',
		],
		followUpQuestion: `How is ${babyName} doing with ${title.toLowerCase()}?`,
	};
}

/**
 * Cache for Celebration Questions
 */
export const celebrationQuestionsCache = new Map<string, CelebrationQuestionsOutput>([
	[
		'default',
		{
			milestone: {
				question: 'What new milestone did your baby reach?',
				systemPrompt: 'You are helping parents record and celebrate their baby\'s developmental milestones.',
				buttonLabel: 'Add Milestone',
				icon: 'star',
			},
			memory: {
				question: 'What special moment would you like to remember?',
				systemPrompt: 'You are helping parents capture precious memories from their baby\'s life.',
				buttonLabel: 'Save Memory',
				icon: 'heart',
			},
			photo: {
				question: 'Upload a photo to remember this celebration',
				systemPrompt: 'You are helping parents add photos to commemorate special moments.',
				buttonLabel: 'Add Photo',
				icon: 'camera',
			},
		},
	],
]);

/**
 * Cache for Baby Assistant Chat Responses
 */
export function generateChatResponse(message: string, babyName: string, ageInDays: number): BabyAssistantChatOutput {
	const lowerMessage = message.toLowerCase();

	// Feeding questions
	if (lowerMessage.includes('feed') || lowerMessage.includes('nursing') || lowerMessage.includes('bottle')) {
		if (ageInDays <= 7) {
			return {
				response: `For ${babyName} at ${ageInDays} days old, feeding every 2-3 hours (8-12 times in 24 hours) is normal and healthy. Newborns have tiny stomachs and need frequent small meals. Look for hunger cues like rooting, hand-to-mouth movements, and fussiness before crying. If you're concerned about feeding frequency or latch, your pediatrician or lactation consultant can help!`,
			};
		}
		return {
			response: `At ${ageInDays} days (${Math.floor(ageInDays / 7)} weeks), ${babyName} should be feeding 8-10 times per day. As they get older, feeds may spread out to every 3-4 hours. Watch for hunger cues and wet diapers (6+ per day after day 5) to ensure adequate intake. Trust your instincts - if something feels off, reach out to your pediatrician!`,
		};
	}

	// Sleep questions
	if (lowerMessage.includes('sleep')) {
		if (ageInDays <= 14) {
			return {
				response: `Newborns like ${babyName} sleep 14-17 hours per day in short bursts. Day-night confusion is common in the first 2 weeks. Help establish patterns by keeping days bright and active, nights dark and quiet. Never put baby to sleep on their tummy, and always use a firm, flat surface without blankets or pillows. It gets better!`,
			};
		}
		return {
			response: `At ${Math.floor(ageInDays / 7)} weeks, ${babyName} is likely sleeping 14-16 hours per day. Some longer stretches at night (4-6 hours) may be emerging. Continue safe sleep practices: back to sleep, firm surface, no loose items in crib. Sleep patterns will continue evolving - be patient and consistent with your routine!`,
		};
	}

	// Diaper questions
	if (lowerMessage.includes('diaper') || lowerMessage.includes('poop') || lowerMessage.includes('pee')) {
		return {
			response: `For ${babyName} at ${ageInDays} days old, expect 6-8 wet diapers and 3-4 dirty diapers per day after day 5. Stool color changes from dark meconium to greenish-brown to yellow/seedy in the first week. Formula-fed babies may have slightly different patterns (tan, firmer stools). If you see red, white, or black stools after day 3, or less than 6 wet diapers daily, contact your pediatrician.`,
		};
	}

	// Crying questions
	if (lowerMessage.includes('cry') || lowerMessage.includes('fussy') || lowerMessage.includes('colicky')) {
		return {
			response: `Crying is ${babyName}'s way of communicating! Average newborns cry 2-3 hours per day. Try the 5 S's: Swaddle, Side/stomach position (while held), Shush, Swing, and Suck. Rule out hunger, dirty diaper, temperature, and overstimulation. If crying is inconsolable, lasts 3+ hours, or you're worried, call your pediatrician. Remember: it's okay to put baby down safely and take a breather if you're overwhelmed.`,
		};
	}

	// Default response
	return {
		response: `I'm here to help with any questions about ${babyName}'s care! At ${ageInDays} days old (${Math.floor(ageInDays / 7)} weeks), you're doing great. Common topics include feeding, sleep, diapers, and development. What specific question do you have? I'm here to provide evidence-based guidance and support!`,
	};
}

/**
 * Cache for Appointment Nudges
 */
export function generateAppointmentNudge(ageInDays: number, babyName: string): AppointmentNudgeOutput {
	if (ageInDays >= 12 && ageInDays <= 16) {
		return {
			text: `${babyName}'s 2-week checkup is coming up! This visit includes weight check, feeding assessment, and developmental screening. Write down any questions you have for the pediatrician.`,
		};
	}

	if (ageInDays >= 28 && ageInDays <= 32) {
		return {
			text: `Time for ${babyName}'s 1-month visit! The pediatrician will check growth, development, and address any concerns. This is a great time to ask about routines, sleep, and what to expect next month.`,
		};
	}

	if (ageInDays >= 56 && ageInDays <= 64) {
		return {
			text: `${babyName}'s 2-month checkup includes their first vaccines. The shots help protect against serious diseases. Bring comfort items and plan for extra cuddles afterward. Acetaminophen can help with soreness if recommended by your doctor.`,
		};
	}

	if (ageInDays >= 112 && ageInDays <= 128) {
		return {
			text: `${babyName}'s 4-month visit is approaching! Expect growth measurements, developmental assessment, and the next round of vaccines. Many babies are showing increased social engagement - share what you've noticed with your pediatrician!`,
		};
	}

	return {
		text: `Keep tracking ${babyName}'s milestones and activities. Regular checkups help ensure healthy development. If you have concerns between visits, don't hesitate to call your pediatrician.`,
	};
}

/**
 * Main cache lookup function
 */
export function getFromCache<T>(
	functionName: string,
	params: Record<string, unknown>,
): T | null {
	const babyName = (params.babyName as string) || 'your baby';
	const ageInDays = (params.ageInDays as number) || 14;

	switch (functionName) {
		case 'GenerateCelebrationSummary': {
			const celebrationType = params.celebrationType as string;
			return celebrationSummaryCache.get(celebrationType) as T || null;
		}

		case 'MilestoneExplanation': {
			const milestoneTitle = params.milestoneTitle as string;
			return milestoneExplanationCache.get(milestoneTitle) as T || null;
		}

		case 'DailyLearningPlanner': {
			return generateLearningPlan(ageInDays, babyName) as T;
		}

		case 'GenerateLearningTip': {
			const category = params.category as string;
			const title = params.title as string;
			return generateLearningTip(category, title, babyName, ageInDays) as T;
		}

		case 'CelebrationQuestions': {
			return celebrationQuestionsCache.get('default') as T || null;
		}

		case 'BabyAssistantChat': {
			const message = params.message as string || '';
			return generateChatResponse(message, babyName, ageInDays) as T;
		}

		case 'AppointmentNudge': {
			return generateAppointmentNudge(ageInDays, babyName) as T;
		}

		default:
			return null;
	}
}

/**
 * Check if content cache should be used
 * Set environment variable USE_AI_CACHE=true to enable
 */
export function shouldUseCache(): boolean {
	return process.env.USE_AI_CACHE === 'true' || process.env.NODE_ENV === 'test';
}

