// Example rules program for new parent learning content
// Demonstrates comprehensive usage of the content-rules DSL with BAML integration

import type { BamlAsyncClient } from '@nugget/ai';
import {
  compute,
  DoneKey,
  notDone,
  Program,
  ProgressKey,
  postpartum,
  progress,
  Scope,
  Screen,
  Slot,
  scope,
  stale,
  week,
} from './dynamic';
import { aiTextBaml, bamlCall } from './dynamic-baml';

// Factory function to create the program with BAML client
export function createExampleProgram(b: BamlAsyncClient) {
  const P = new Program();

  /* ========== TTC ========== */
  // Placeholder for TTC content - can be expanded later
  P.add(
    P.rule()
      .slot(Screen.Learning, Slot.Header)
      .when(scope(Scope.TTC))
      .show({ props: {}, template: 'Card.Hidden' })
      .priority(10)
      .build(),
  );

  /* ========== Pregnancy ========== */
  // Weeks 28–32: Nursery start CTA (simple, deterministic)
  P.add(
    P.rule()
      .slot(Screen.Pregnancy, Slot.Callout)
      .when(
        scope(Scope.Pregnancy),
        week.between(28, 32),
        notDone(DoneKey.NurserySetup),
      )
      .show({
        props: {
          deeplink: 'nugget://nursery-prep',
          headline: 'Start your nursery',
        },
        template: 'CTA.GoTo',
      })
      .priority(60)
      .build(),
  );

  // ≥35w hospital bag — dynamic % left (deterministic headline) + BAML subtext copy
  P.add(
    P.rule()
      .slot(Screen.Hospital, Slot.Callout)
      .when(
        scope(Scope.Pregnancy),
        week.gte(35),
        progress(ProgressKey.HospitalBag).lt(100),
      )
      .show({
        props: {
          deeplink: 'nugget://hospital-prep',
          headline: compute(({ progress: pg }) => {
            const p = Math.round(pg?.hospital_bag ?? 0);
            return p ? `Finish packing — ~${100 - p}% left` : 'Start packing';
          }),
          subtext: aiTextBaml({
            call: ({ progress: pg }) => {
              const progressValue = Math.round(pg?.hospital_bag ?? 0);
              return bamlCall(
                () => b.HospitalPackAdvice(progressValue),
                (x) => x.subtext,
              );
            },
            key: ({ progress: pg }) =>
              `pack-sub:${Math.round(pg?.hospital_bag ?? 0)}`,
            ttl: '1d',
          }),
        },
        template: 'CTA.GoTo',
      })
      .priority(70)
      .build(),
  );

  // Exact Week 30: baby development blurb via BAML
  P.add(
    P.rule()
      .slot(Screen.Pregnancy, Slot.Header)
      .when(scope(Scope.Pregnancy), week.eq(30))
      .show({
        props: {
          body: aiTextBaml({
            call: () =>
              bamlCall(
                () => b.PregnancyWeekSummary(30),
                (o) => o.text,
              ),
            key: () => 'dev-w30',
            ttl: '14d',
          }),
          title: 'Week 30',
        },
        template: 'Card.WeekSummary',
      })
      .priority(55)
      .build(),
  );

  // Week 39 nav directive (banner)
  P.add(
    P.rule()
      .slot(Screen.Pregnancy, Slot.Callout)
      .when(scope(Scope.Pregnancy), week.eq(39))
      .show({
        props: {
          cooldown: '3d',
          deeplink: 'nugget://plans/birth?source=wk39',
          key: 'wk39-birth-plan',
          mode: 'cta',
          valid: '7d',
        },
        template: 'Nav.Directive',
      })
      .priority(80)
      .build(),
  );

  /* ========== Postpartum: Daily Tips (Day 0–14) ========== */
  // Daily tips Day 0–14 (2 weeks) with BAML
  P.series.ppDays(0, 14, ({ day }) =>
    P.rule()
      .slot(Screen.Learning, Slot.Header)
      .when(scope(Scope.Postpartum), postpartum.day.eq(day))
      .show({
        props: {
          body: aiTextBaml({
            call: ({ traits }) => {
              const firstPregnancy = !!traits?.firstPregnancy;
              return bamlCall(
                () => b.PostpartumTips(day, firstPregnancy),
                (out) => out.text,
              );
            },
            key: ({ traits }) => `pp-tip:${traits?.userId ?? 'anon'}:d${day}`,
            ttl: '7d',
          }),
          title: compute(() => `Day ${day}`),
        },
        template: 'Card.WeekSummary',
      })
      .priority(45)
      .build(),
  );

  /* ========== Postpartum: Weekly Milestones (Week 0–12) ========== */
  // Weekly "Baby Week 0–12" milestones via BAML
  P.series.ppWeeks(0, 12, ({ week: w }) =>
    P.rule()
      .slot(Screen.Learning, Slot.Header)
      .when(scope(Scope.Postpartum), postpartum.week.eq(w))
      .show({
        props: {
          body: aiTextBaml({
            call: ({ baby, traits }) => {
              const babySex = baby?.sex ?? 'U';
              const firstPregnancy = !!traits?.firstPregnancy;
              return bamlCall(
                () => b.NewbornWeekMilestone(w, babySex, firstPregnancy),
                (o) => o.text,
              );
            },
            key: () => `baby-week:${w}`,
            ttl: '30d',
          }),
          title: `Baby Week ${w}`,
        },
        template: 'Card.WeekSummary',
      })
      .priority(44)
      .build(),
  );

  /* ========== State & Re-engagement ========== */
  // If hospital bag stale 3d and incomplete, show 3 contextual AI prompts
  P.add(
    P.rule()
      .slot(Screen.AiChat, Slot.Carousel)
      .when(
        progress(ProgressKey.HospitalBag).lt(100),
        stale('hospital_bag', 3 * 24 * 60),
      )
      .show({
        props: {
          prompts: aiTextBaml({
            call: ({ season }) => {
              const context = { season: season ?? 'unknown' };
              return bamlCall(
                () => b.StalePrompts('hospital_bag', context),
                (o) => o.list.join('||'),
              );
            },
            key: () => 'prompts:bag:stale',
            ttl: '1d',
          }),
        },
        template: 'Carousel.PromptList',
      })
      .priority(35)
      .build(),
  );

  /* ========== Trait / Plan Variants ========== */
  // If C-section planned, show specific recovery prep (BAML copy)
  P.add(
    P.rule()
      .slot(Screen.Learning, Slot.Callout)
      .when(scope(Scope.Pregnancy), week.gte(36))
      .show({
        props: {
          deeplink: 'nugget://learning/recovery-prep',
          headline: aiTextBaml({
            call: ({ traits }) => {
              const mode = traits?.cSectionPlanned ? 'csection' : 'vaginal';
              return bamlCall(
                () => b.BirthPlanHeadline(mode),
                (x) => x.text,
              );
            },
            key: () => 'cs-headline',
            ttl: '30d',
          }),
        },
        template: 'CTA.GoTo',
      })
      .priority(50)
      .build(),
  );

  /* ========== Partner Tasks ========== */
  // Partner checklist nudge if user's partner is set and % < 100
  P.add(
    P.rule()
      .slot(Screen.Nursery, Slot.Callout)
      .when(progress(ProgressKey.NurseryEssentials).lt(100))
      .show({
        props: {
          deeplink: 'nugget://nursery-prep',
          headline: compute(({ traits, progress: pg }) => {
            const p = Math.round(pg?.nursery_essentials ?? 0);
            const who = traits?.partnerName
              ? `${traits.partnerName}`
              : 'your partner';
            return `${who} can help — ~${100 - p}% left`;
          }),
        },
        template: 'CTA.GoTo',
      })
      .priority(52)
      .build(),
  );

  /* ========== Appointments ========== */
  // 6-week postpartum check reminder (deterministic + BAML microcopy)
  P.add(
    P.rule()
      .slot(Screen.Learning, Slot.Callout)
      .when(scope(Scope.Postpartum), postpartum.week.eq(6))
      .show({
        props: {
          deeplink: 'nugget://calendar/postpartum-check',
          headline: 'Schedule your 6-week check',
          subtext: aiTextBaml({
            call: () =>
              bamlCall(
                () => b.AppointmentNudge('postpartum_6w'),
                (o) => o.text,
              ),
            key: () => 'pp-6w-microcopy',
            ttl: '14d',
          }),
        },
        template: 'CTA.GoTo',
      })
      .priority(58)
      .build(),
  );

  /* ========== Vaccinations (Baby) ========== */
  // Baby 2-month vaccines explainer (BAML) — shows on PP week 8
  P.add(
    P.rule()
      .slot(Screen.Learning, Slot.Header)
      .when(scope(Scope.Postpartum), postpartum.week.eq(8))
      .show({
        props: {
          body: aiTextBaml({
            call: () =>
              bamlCall(
                () => b.BabyVisitExplainer(8),
                (o) => o.text,
              ),
            key: () => 'baby-vax-2m',
            ttl: '30d',
          }),
          title: '2-month visit',
        },
        template: 'Card.WeekSummary',
      })
      .priority(46)
      .build(),
  );

  /* ========== Sleep Regression Helper ========== */
  // If PP week 4 or 8 (common regressions), show AI tips
  [4, 8].forEach((w) => {
    P.add(
      P.rule()
        .slot(Screen.Learning, Slot.Callout)
        .when(scope(Scope.Postpartum), postpartum.week.eq(w))
        .show({
          props: {
            deeplink: 'nugget://learning/sleep',
            headline: `Sleep tips for week ${w}`,
            subtext: aiTextBaml({
              call: () =>
                bamlCall(
                  () => b.SleepRegressionTips(w),
                  (o) => o.snippet,
                ),
              key: () => `sleep-reg:${w}`,
              ttl: '14d',
            }),
          },
          template: 'CTA.GoTo',
        })
        .priority(47)
        .build(),
    );
  });

  /* ========== Milestone Capture ========== */
  // Prompt parents to capture "first smile" if not logged by PP week 6
  P.add(
    P.rule()
      .slot(Screen.AiChat, Slot.Carousel)
      .when(scope(Scope.Postpartum), postpartum.week.eq(6))
      .show({
        props: {
          prompts: [
            "Log baby's first smile",
            'Upload a photo from this week',
            'Add a note about tummy time',
          ],
        },
        template: 'Carousel.PromptList',
      })
      .priority(34)
      .build(),
  );

  return P;
}

// Export the program builder
export { Program };
