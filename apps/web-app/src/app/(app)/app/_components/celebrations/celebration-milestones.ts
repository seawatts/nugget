/**
 * Celebration milestones configuration
 * This is the single source of truth for celebration milestones displayed in:
 * - Main dashboard celebration cards
 * - OpenGraph images for shared celebrations
 * - Public celebration pages
 *
 * Note: The actual rule-based system is defined in @nugget/content-rules/celebrations-program.ts
 * This array should be kept in sync with those rules.
 */
export const CELEBRATION_MILESTONES = [
  {
    ageLabel: '1 Week Old!',
    day: 7,
    title: '🎉 Happy 1 Week Birthday!',
    type: 'week_1',
  },
  {
    ageLabel: '2 Weeks Old!',
    day: 14,
    title: '🎉 Happy 2 Week Birthday!',
    type: 'week_2',
  },
  {
    ageLabel: '3 Weeks Old!',
    day: 21,
    title: '🎉 Happy 3 Week Birthday!',
    type: 'week_3',
  },
  {
    ageLabel: '4 Weeks Old!',
    day: 28,
    title: '🎉 Happy 4 Week Birthday!',
    type: 'week_4',
  },
  {
    ageLabel: '1 Month Old!',
    day: 30,
    title: '🎂 Happy 1 Month Birthday!',
    type: 'month_1',
  },
  {
    ageLabel: '5 Weeks Old!',
    day: 35,
    title: '🎉 Happy 5 Week Birthday!',
    type: 'week_5',
  },
  {
    ageLabel: '6 Weeks Old!',
    day: 42,
    title: '🎉 Happy 6 Week Birthday!',
    type: 'week_6',
  },
  {
    ageLabel: '7 Weeks Old!',
    day: 49,
    title: '🎉 Happy 7 Week Birthday!',
    type: 'week_7',
  },
  {
    ageLabel: '8 Weeks Old!',
    day: 56,
    title: '🎉 Happy 8 Week Birthday!',
    type: 'week_8',
  },
  {
    ageLabel: '2 Months Old!',
    day: 60,
    title: '🎂 Happy 2 Month Birthday!',
    type: 'month_2',
  },
  {
    ageLabel: '9 Weeks Old!',
    day: 63,
    title: '🎉 Happy 9 Week Birthday!',
    type: 'week_9',
  },
  {
    ageLabel: '10 Weeks Old!',
    day: 70,
    title: '🎉 Happy 10 Week Birthday!',
    type: 'week_10',
  },
  {
    ageLabel: '11 Weeks Old!',
    day: 77,
    title: '🎉 Happy 11 Week Birthday!',
    type: 'week_11',
  },
  {
    ageLabel: '12 Weeks Old!',
    day: 84,
    title: '🎉 Happy 12 Week Birthday!',
    type: 'week_12',
  },
  {
    ageLabel: '3 Months Old!',
    day: 90,
    title: '🎂 Happy 3 Month Birthday!',
    type: 'month_3',
  },
  {
    ageLabel: '4 Months Old!',
    day: 120,
    title: '🎂 Happy 4 Month Birthday!',
    type: 'month_4',
  },
  {
    ageLabel: '5 Months Old!',
    day: 150,
    title: '🎂 Happy 5 Month Birthday!',
    type: 'month_5',
  },
  {
    ageLabel: '6 Months Old!',
    day: 180,
    title: '🎂 Happy 6 Month Birthday!',
    type: 'month_6',
  },
  {
    ageLabel: '7 Months Old!',
    day: 210,
    title: '🎂 Happy 7 Month Birthday!',
    type: 'month_7',
  },
  {
    ageLabel: '8 Months Old!',
    day: 240,
    title: '🎂 Happy 8 Month Birthday!',
    type: 'month_8',
  },
  {
    ageLabel: '9 Months Old!',
    day: 270,
    title: '🎂 Happy 9 Month Birthday!',
    type: 'month_9',
  },
  {
    ageLabel: '10 Months Old!',
    day: 300,
    title: '🎂 Happy 10 Month Birthday!',
    type: 'month_10',
  },
  {
    ageLabel: '11 Months Old!',
    day: 330,
    title: '🎂 Happy 11 Month Birthday!',
    type: 'month_11',
  },
  {
    ageLabel: '1 Year Old!',
    day: 365,
    title: '🎂🎉 Happy 1st Birthday!',
    type: 'year_1',
  },
  {
    ageLabel: '18 Months Old!',
    day: 547,
    title: '🎂 Happy 18 Month Birthday!',
    type: 'month_18',
  },
  {
    ageLabel: '2 Years Old!',
    day: 730,
    title: '🎂🎉 Happy 2nd Birthday!',
    type: 'year_2',
  },
].sort((a, b) => a.day - b.day);
