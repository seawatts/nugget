// Celebrations rules program for birthday/milestone celebrations
// Displays special celebration cards at the top of the baby dashboard on milestone days

import type { BamlAsyncClient } from '@nugget/ai';
import { Program, postpartum, Scope, Screen, Slot, scope } from './dynamic';

// Factory function to create the celebrations program
export function createCelebrationsProgram(_b: BamlAsyncClient) {
  const P = new Program();

  /* ========== Weekly Celebrations (Weeks 1-12) ========== */

  // Week 1 Celebration (Day 7)
  P.add(
    P.rule()
      .slot(Screen.ParentDashboard, Slot.Header)
      .when(scope(Scope.Postpartum), postpartum.day.eq(7))
      .show({
        props: {
          actions: [
            { label: 'Save Memory', type: 'save_memory' },
            { label: 'Take Photo', type: 'take_photo' },
            { label: 'Share', type: 'share' },
          ],
          ageLabel: '1 Week Old!',
          celebrationType: 'week_1',
          showPhotoUpload: true,
          statistics: {
            ageInDays: 7,
            ageLabel: '1 week',
          },
          title: '🎉 Happy 1 Week Birthday!',
          type: 'celebration',
        },
        template: 'Card.Celebration',
      })
      .priority(100)
      .build(),
  );

  // Week 2 Celebration (Day 14)
  P.add(
    P.rule()
      .slot(Screen.ParentDashboard, Slot.Header)
      .when(scope(Scope.Postpartum), postpartum.day.eq(14))
      .show({
        props: {
          actions: [
            { label: 'Save Memory', type: 'save_memory' },
            { label: 'Take Photo', type: 'take_photo' },
            { label: 'Share', type: 'share' },
          ],
          ageLabel: '2 Weeks Old!',
          celebrationType: 'week_2',
          showPhotoUpload: true,
          statistics: {
            ageInDays: 14,
            ageLabel: '2 weeks',
          },
          title: '🎉 Happy 2 Week Birthday!',
          type: 'celebration',
        },
        template: 'Card.Celebration',
      })
      .priority(100)
      .build(),
  );

  // Week 3 Celebration (Day 21)
  P.add(
    P.rule()
      .slot(Screen.ParentDashboard, Slot.Header)
      .when(scope(Scope.Postpartum), postpartum.day.eq(21))
      .show({
        props: {
          actions: [
            { label: 'Save Memory', type: 'save_memory' },
            { label: 'Take Photo', type: 'take_photo' },
            { label: 'Share', type: 'share' },
          ],
          ageLabel: '3 Weeks Old!',
          celebrationType: 'week_3',
          showPhotoUpload: true,
          statistics: {
            ageInDays: 21,
            ageLabel: '3 weeks',
          },
          title: '🎉 Happy 3 Week Birthday!',
          type: 'celebration',
        },
        template: 'Card.Celebration',
      })
      .priority(100)
      .build(),
  );

  // Week 4 Celebration (Day 28)
  P.add(
    P.rule()
      .slot(Screen.ParentDashboard, Slot.Header)
      .when(scope(Scope.Postpartum), postpartum.day.eq(28))
      .show({
        props: {
          actions: [
            { label: 'Save Memory', type: 'save_memory' },
            { label: 'Take Photo', type: 'take_photo' },
            { label: 'Share', type: 'share' },
          ],
          ageLabel: '4 Weeks Old!',
          celebrationType: 'week_4',
          showPhotoUpload: true,
          statistics: {
            ageInDays: 28,
            ageLabel: '4 weeks',
          },
          title: '🎉 Happy 4 Week Birthday!',
          type: 'celebration',
        },
        template: 'Card.Celebration',
      })
      .priority(100)
      .build(),
  );

  // Week 5 Celebration (Day 35)
  P.add(
    P.rule()
      .slot(Screen.ParentDashboard, Slot.Header)
      .when(scope(Scope.Postpartum), postpartum.day.eq(35))
      .show({
        props: {
          actions: [
            { label: 'Save Memory', type: 'save_memory' },
            { label: 'Take Photo', type: 'take_photo' },
            { label: 'Share', type: 'share' },
          ],
          ageLabel: '5 Weeks Old!',
          celebrationType: 'week_5',
          showPhotoUpload: true,
          statistics: {
            ageInDays: 35,
            ageLabel: '5 weeks',
          },
          title: '🎉 Happy 5 Week Birthday!',
          type: 'celebration',
        },
        template: 'Card.Celebration',
      })
      .priority(100)
      .build(),
  );

  // Week 6 Celebration (Day 42)
  P.add(
    P.rule()
      .slot(Screen.ParentDashboard, Slot.Header)
      .when(scope(Scope.Postpartum), postpartum.day.eq(42))
      .show({
        props: {
          actions: [
            { label: 'Save Memory', type: 'save_memory' },
            { label: 'Take Photo', type: 'take_photo' },
            { label: 'Share', type: 'share' },
          ],
          ageLabel: '6 Weeks Old!',
          celebrationType: 'week_6',
          showPhotoUpload: true,
          statistics: {
            ageInDays: 42,
            ageLabel: '6 weeks',
          },
          title: '🎉 Happy 6 Week Birthday!',
          type: 'celebration',
        },
        template: 'Card.Celebration',
      })
      .priority(100)
      .build(),
  );

  // Week 7 Celebration (Day 49)
  P.add(
    P.rule()
      .slot(Screen.ParentDashboard, Slot.Header)
      .when(scope(Scope.Postpartum), postpartum.day.eq(49))
      .show({
        props: {
          actions: [
            { label: 'Save Memory', type: 'save_memory' },
            { label: 'Take Photo', type: 'take_photo' },
            { label: 'Share', type: 'share' },
          ],
          ageLabel: '7 Weeks Old!',
          celebrationType: 'week_7',
          showPhotoUpload: true,
          statistics: {
            ageInDays: 49,
            ageLabel: '7 weeks',
          },
          title: '🎉 Happy 7 Week Birthday!',
          type: 'celebration',
        },
        template: 'Card.Celebration',
      })
      .priority(100)
      .build(),
  );

  // Week 8 Celebration (Day 56)
  P.add(
    P.rule()
      .slot(Screen.ParentDashboard, Slot.Header)
      .when(scope(Scope.Postpartum), postpartum.day.eq(56))
      .show({
        props: {
          actions: [
            { label: 'Save Memory', type: 'save_memory' },
            { label: 'Take Photo', type: 'take_photo' },
            { label: 'Share', type: 'share' },
          ],
          ageLabel: '8 Weeks Old!',
          celebrationType: 'week_8',
          showPhotoUpload: true,
          statistics: {
            ageInDays: 56,
            ageLabel: '8 weeks',
          },
          title: '🎉 Happy 8 Week Birthday!',
          type: 'celebration',
        },
        template: 'Card.Celebration',
      })
      .priority(100)
      .build(),
  );

  // Week 9 Celebration (Day 63)
  P.add(
    P.rule()
      .slot(Screen.ParentDashboard, Slot.Header)
      .when(scope(Scope.Postpartum), postpartum.day.eq(63))
      .show({
        props: {
          actions: [
            { label: 'Save Memory', type: 'save_memory' },
            { label: 'Take Photo', type: 'take_photo' },
            { label: 'Share', type: 'share' },
          ],
          ageLabel: '9 Weeks Old!',
          celebrationType: 'week_9',
          showPhotoUpload: true,
          statistics: {
            ageInDays: 63,
            ageLabel: '9 weeks',
          },
          title: '🎉 Happy 9 Week Birthday!',
          type: 'celebration',
        },
        template: 'Card.Celebration',
      })
      .priority(100)
      .build(),
  );

  // Week 10 Celebration (Day 70)
  P.add(
    P.rule()
      .slot(Screen.ParentDashboard, Slot.Header)
      .when(scope(Scope.Postpartum), postpartum.day.eq(70))
      .show({
        props: {
          actions: [
            { label: 'Save Memory', type: 'save_memory' },
            { label: 'Take Photo', type: 'take_photo' },
            { label: 'Share', type: 'share' },
          ],
          ageLabel: '10 Weeks Old!',
          celebrationType: 'week_10',
          showPhotoUpload: true,
          statistics: {
            ageInDays: 70,
            ageLabel: '10 weeks',
          },
          title: '🎉 Happy 10 Week Birthday!',
          type: 'celebration',
        },
        template: 'Card.Celebration',
      })
      .priority(100)
      .build(),
  );

  // Week 11 Celebration (Day 77)
  P.add(
    P.rule()
      .slot(Screen.ParentDashboard, Slot.Header)
      .when(scope(Scope.Postpartum), postpartum.day.eq(77))
      .show({
        props: {
          actions: [
            { label: 'Save Memory', type: 'save_memory' },
            { label: 'Take Photo', type: 'take_photo' },
            { label: 'Share', type: 'share' },
          ],
          ageLabel: '11 Weeks Old!',
          celebrationType: 'week_11',
          showPhotoUpload: true,
          statistics: {
            ageInDays: 77,
            ageLabel: '11 weeks',
          },
          title: '🎉 Happy 11 Week Birthday!',
          type: 'celebration',
        },
        template: 'Card.Celebration',
      })
      .priority(100)
      .build(),
  );

  // Week 12 Celebration (Day 84)
  P.add(
    P.rule()
      .slot(Screen.ParentDashboard, Slot.Header)
      .when(scope(Scope.Postpartum), postpartum.day.eq(84))
      .show({
        props: {
          actions: [
            { label: 'Save Memory', type: 'save_memory' },
            { label: 'Take Photo', type: 'take_photo' },
            { label: 'Share', type: 'share' },
          ],
          ageLabel: '12 Weeks Old!',
          celebrationType: 'week_12',
          showPhotoUpload: true,
          statistics: {
            ageInDays: 84,
            ageLabel: '12 weeks',
          },
          title: '🎉 Happy 12 Week Birthday!',
          type: 'celebration',
        },
        template: 'Card.Celebration',
      })
      .priority(100)
      .build(),
  );

  /* ========== Monthly Celebrations ========== */

  // 1 Month (Day 30)
  P.add(
    P.rule()
      .slot(Screen.ParentDashboard, Slot.Header)
      .when(scope(Scope.Postpartum), postpartum.day.eq(30))
      .show({
        props: {
          actions: [
            { label: 'Save Memory', type: 'save_memory' },
            { label: 'Take Photo', type: 'take_photo' },
            { label: 'Share', type: 'share' },
          ],
          ageLabel: '1 Month Old!',
          celebrationType: 'month_1',
          showPhotoUpload: true,
          statistics: {
            ageInDays: 30,
            ageLabel: '1 month',
          },
          title: '🎂 Happy 1 Month Birthday!',
          type: 'celebration',
        },
        template: 'Card.Celebration',
      })
      .priority(100)
      .build(),
  );

  // 2 Months (Day 60)
  P.add(
    P.rule()
      .slot(Screen.ParentDashboard, Slot.Header)
      .when(scope(Scope.Postpartum), postpartum.day.eq(60))
      .show({
        props: {
          actions: [
            { label: 'Save Memory', type: 'save_memory' },
            { label: 'Take Photo', type: 'take_photo' },
            { label: 'Share', type: 'share' },
          ],
          ageLabel: '2 Months Old!',
          celebrationType: 'month_2',
          showPhotoUpload: true,
          statistics: {
            ageInDays: 60,
            ageLabel: '2 months',
          },
          title: '🎂 Happy 2 Month Birthday!',
          type: 'celebration',
        },
        template: 'Card.Celebration',
      })
      .priority(100)
      .build(),
  );

  // 3 Months (Day 90)
  P.add(
    P.rule()
      .slot(Screen.ParentDashboard, Slot.Header)
      .when(scope(Scope.Postpartum), postpartum.day.eq(90))
      .show({
        props: {
          actions: [
            { label: 'Save Memory', type: 'save_memory' },
            { label: 'Take Photo', type: 'take_photo' },
            { label: 'Share', type: 'share' },
          ],
          ageLabel: '3 Months Old!',
          celebrationType: 'month_3',
          showPhotoUpload: true,
          statistics: {
            ageInDays: 90,
            ageLabel: '3 months',
          },
          title: '🎂 Happy 3 Month Birthday!',
          type: 'celebration',
        },
        template: 'Card.Celebration',
      })
      .priority(100)
      .build(),
  );

  // 4 Months (Day 120)
  P.add(
    P.rule()
      .slot(Screen.ParentDashboard, Slot.Header)
      .when(scope(Scope.Postpartum), postpartum.day.eq(120))
      .show({
        props: {
          actions: [
            { label: 'Save Memory', type: 'save_memory' },
            { label: 'Take Photo', type: 'take_photo' },
            { label: 'Share', type: 'share' },
          ],
          ageLabel: '4 Months Old!',
          celebrationType: 'month_4',
          showPhotoUpload: true,
          statistics: {
            ageInDays: 120,
            ageLabel: '4 months',
          },
          title: '🎂 Happy 4 Month Birthday!',
          type: 'celebration',
        },
        template: 'Card.Celebration',
      })
      .priority(100)
      .build(),
  );

  // 5 Months (Day 150)
  P.add(
    P.rule()
      .slot(Screen.ParentDashboard, Slot.Header)
      .when(scope(Scope.Postpartum), postpartum.day.eq(150))
      .show({
        props: {
          actions: [
            { label: 'Save Memory', type: 'save_memory' },
            { label: 'Take Photo', type: 'take_photo' },
            { label: 'Share', type: 'share' },
          ],
          ageLabel: '5 Months Old!',
          celebrationType: 'month_5',
          showPhotoUpload: true,
          statistics: {
            ageInDays: 150,
            ageLabel: '5 months',
          },
          title: '🎂 Happy 5 Month Birthday!',
          type: 'celebration',
        },
        template: 'Card.Celebration',
      })
      .priority(100)
      .build(),
  );

  // 6 Months (Day 180)
  P.add(
    P.rule()
      .slot(Screen.ParentDashboard, Slot.Header)
      .when(scope(Scope.Postpartum), postpartum.day.eq(180))
      .show({
        props: {
          actions: [
            { label: 'Save Memory', type: 'save_memory' },
            { label: 'Take Photo', type: 'take_photo' },
            { label: 'Share', type: 'share' },
          ],
          ageLabel: '6 Months Old!',
          celebrationType: 'month_6',
          showPhotoUpload: true,
          statistics: {
            ageInDays: 180,
            ageLabel: '6 months',
          },
          title: '🎂 Happy 6 Month Birthday!',
          type: 'celebration',
        },
        template: 'Card.Celebration',
      })
      .priority(100)
      .build(),
  );

  // 9 Months (Day 270)
  P.add(
    P.rule()
      .slot(Screen.ParentDashboard, Slot.Header)
      .when(scope(Scope.Postpartum), postpartum.day.eq(270))
      .show({
        props: {
          actions: [
            { label: 'Save Memory', type: 'save_memory' },
            { label: 'Take Photo', type: 'take_photo' },
            { label: 'Share', type: 'share' },
          ],
          ageLabel: '9 Months Old!',
          celebrationType: 'month_9',
          showPhotoUpload: true,
          statistics: {
            ageInDays: 270,
            ageLabel: '9 months',
          },
          title: '🎂 Happy 9 Month Birthday!',
          type: 'celebration',
        },
        template: 'Card.Celebration',
      })
      .priority(100)
      .build(),
  );

  // 12 Months / 1 Year (Day 365)
  P.add(
    P.rule()
      .slot(Screen.ParentDashboard, Slot.Header)
      .when(scope(Scope.Postpartum), postpartum.day.eq(365))
      .show({
        props: {
          actions: [
            { label: 'Save Memory', type: 'save_memory' },
            { label: 'Take Photo', type: 'take_photo' },
            { label: 'Share', type: 'share' },
          ],
          ageLabel: '1 Year Old!',
          celebrationType: 'year_1',
          showPhotoUpload: true,
          statistics: {
            ageInDays: 365,
            ageLabel: '1 year',
          },
          title: '🎂🎉 Happy 1st Birthday!',
          type: 'celebration',
        },
        template: 'Card.Celebration',
      })
      .priority(100)
      .build(),
  );

  // 18 Months (Day 547)
  P.add(
    P.rule()
      .slot(Screen.ParentDashboard, Slot.Header)
      .when(scope(Scope.Postpartum), postpartum.day.eq(547))
      .show({
        props: {
          actions: [
            { label: 'Save Memory', type: 'save_memory' },
            { label: 'Take Photo', type: 'take_photo' },
            { label: 'Share', type: 'share' },
          ],
          ageLabel: '18 Months Old!',
          celebrationType: 'month_18',
          showPhotoUpload: true,
          statistics: {
            ageInDays: 547,
            ageLabel: '18 months',
          },
          title: '🎂 Happy 18 Month Birthday!',
          type: 'celebration',
        },
        template: 'Card.Celebration',
      })
      .priority(100)
      .build(),
  );

  // 24 Months / 2 Years (Day 730)
  P.add(
    P.rule()
      .slot(Screen.ParentDashboard, Slot.Header)
      .when(scope(Scope.Postpartum), postpartum.day.eq(730))
      .show({
        props: {
          actions: [
            { label: 'Save Memory', type: 'save_memory' },
            { label: 'Take Photo', type: 'take_photo' },
            { label: 'Share', type: 'share' },
          ],
          ageLabel: '2 Years Old!',
          celebrationType: 'year_2',
          showPhotoUpload: true,
          statistics: {
            ageInDays: 730,
            ageLabel: '2 years',
          },
          title: '🎂🎉 Happy 2nd Birthday!',
          type: 'celebration',
        },
        template: 'Card.Celebration',
      })
      .priority(100)
      .build(),
  );

  return P;
}

// Export the program builder
export { Program };
