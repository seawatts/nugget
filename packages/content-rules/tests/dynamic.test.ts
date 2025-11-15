import { describe, expect, it } from 'bun:test';
import { InMemoryCache } from '../src/cache-adapter';
import {
  and,
  compute,
  DoneKey,
  done,
  evalCond,
  not,
  notDone,
  or,
  Program,
  ProgressKey,
  postpartum,
  progress,
  type RuleContext,
  Scope,
  Screen,
  Slot,
  scope,
  stale,
  week,
} from '../src/dynamic';

describe('Condition Evaluators', () => {
  describe('week conditions', () => {
    it('should evaluate week.eq correctly', () => {
      const ctx: RuleContext = { week: 30 };
      expect(evalCond(week.eq(30), ctx)).toBe(true);
      expect(evalCond(week.eq(29), ctx)).toBe(false);
    });

    it('should evaluate week.gte correctly', () => {
      const ctx: RuleContext = { week: 30 };
      expect(evalCond(week.gte(30), ctx)).toBe(true);
      expect(evalCond(week.gte(29), ctx)).toBe(true);
      expect(evalCond(week.gte(31), ctx)).toBe(false);
    });

    it('should evaluate week.lte correctly', () => {
      const ctx: RuleContext = { week: 30 };
      expect(evalCond(week.lte(30), ctx)).toBe(true);
      expect(evalCond(week.lte(31), ctx)).toBe(true);
      expect(evalCond(week.lte(29), ctx)).toBe(false);
    });

    it('should evaluate week.between correctly', () => {
      const ctx: RuleContext = { week: 30 };
      expect(evalCond(week.between(28, 32), ctx)).toBe(true);
      expect(evalCond(week.between(30, 30), ctx)).toBe(true);
      expect(evalCond(week.between(31, 35), ctx)).toBe(false);
    });
  });

  describe('postpartum conditions', () => {
    it('should evaluate ppDay.eq correctly', () => {
      const ctx: RuleContext = { ppDay: 3 };
      expect(evalCond(postpartum.day.eq(3), ctx)).toBe(true);
      expect(evalCond(postpartum.day.eq(4), ctx)).toBe(false);
    });

    it('should evaluate ppWeek.eq correctly', () => {
      const ctx: RuleContext = { ppWeek: 2 };
      expect(evalCond(postpartum.week.eq(2), ctx)).toBe(true);
      expect(evalCond(postpartum.week.eq(1), ctx)).toBe(false);
    });
  });

  describe('scope conditions', () => {
    it('should evaluate scope correctly', () => {
      const ctx: RuleContext = { scope: Scope.Postpartum };
      expect(evalCond(scope(Scope.Postpartum), ctx)).toBe(true);
      expect(evalCond(scope(Scope.Pregnancy), ctx)).toBe(false);
    });
  });

  describe('progress conditions', () => {
    it('should evaluate progress.lt correctly', () => {
      const ctx: RuleContext = {
        progress: { hospital_bag: 50 },
      };
      expect(evalCond(progress(ProgressKey.HospitalBag).lt(100), ctx)).toBe(
        true,
      );
      expect(evalCond(progress(ProgressKey.HospitalBag).lt(40), ctx)).toBe(
        false,
      );
    });

    it('should evaluate progress.gte correctly', () => {
      const ctx: RuleContext = {
        progress: { hospital_bag: 50 },
      };
      expect(evalCond(progress(ProgressKey.HospitalBag).gte(50), ctx)).toBe(
        true,
      );
      expect(evalCond(progress(ProgressKey.HospitalBag).gte(40), ctx)).toBe(
        true,
      );
      expect(evalCond(progress(ProgressKey.HospitalBag).gte(60), ctx)).toBe(
        false,
      );
    });

    it('should handle missing progress values', () => {
      const ctx: RuleContext = { progress: {} };
      expect(evalCond(progress(ProgressKey.HospitalBag).lt(10), ctx)).toBe(
        true,
      );
      expect(evalCond(progress(ProgressKey.HospitalBag).gte(1), ctx)).toBe(
        false,
      );
    });
  });

  describe('done conditions', () => {
    it('should evaluate done correctly', () => {
      const ctx: RuleContext = {
        done: { nursery_setup: true },
      };
      expect(evalCond(done(DoneKey.NurserySetup), ctx)).toBe(true);
    });

    it('should evaluate notDone correctly', () => {
      const ctx: RuleContext = {
        done: { nursery_setup: false },
      };
      expect(evalCond(notDone(DoneKey.NurserySetup), ctx)).toBe(true);

      const ctx2: RuleContext = {
        done: { nursery_setup: true },
      };
      expect(evalCond(notDone(DoneKey.NurserySetup), ctx2)).toBe(false);
    });
  });

  describe('stale conditions', () => {
    it('should evaluate stale correctly', () => {
      const now = Date.now();
      const fiveMinutesAgo = now - 5 * 60 * 1000;
      const tenMinutesAgo = now - 10 * 60 * 1000;

      const ctx: RuleContext = {
        stale: {
          hospital_bag: tenMinutesAgo,
          nursery: fiveMinutesAgo,
        },
      };

      expect(evalCond(stale('hospital_bag', 5), ctx)).toBe(true);
      expect(evalCond(stale('nursery', 10), ctx)).toBe(false);
      expect(evalCond(stale('nonexistent', 1), ctx)).toBe(false);
    });
  });

  describe('combinators', () => {
    it('should evaluate and correctly', () => {
      const ctx: RuleContext = { scope: Scope.Pregnancy, week: 30 };
      expect(evalCond(and(week.eq(30), scope(Scope.Pregnancy)), ctx)).toBe(
        true,
      );
      expect(evalCond(and(week.eq(30), scope(Scope.Postpartum)), ctx)).toBe(
        false,
      );
    });

    it('should evaluate or correctly', () => {
      const ctx: RuleContext = { scope: Scope.Pregnancy, week: 30 };
      expect(evalCond(or(week.eq(30), week.eq(31)), ctx)).toBe(true);
      expect(evalCond(or(week.eq(29), week.eq(31)), ctx)).toBe(false);
    });

    it('should evaluate not correctly', () => {
      const ctx: RuleContext = { week: 30 };
      expect(evalCond(not(week.eq(30)), ctx)).toBe(false);
      expect(evalCond(not(week.eq(29)), ctx)).toBe(true);
    });

    it('should handle nested combinators', () => {
      const ctx: RuleContext = {
        progress: { hospital_bag: 50 },
        scope: Scope.Pregnancy,
        week: 30,
      };
      expect(
        evalCond(
          and(
            scope(Scope.Pregnancy),
            or(week.between(28, 32), progress(ProgressKey.HospitalBag).lt(100)),
          ),
          ctx,
        ),
      ).toBe(true);
    });
  });
});

describe('Program Builder', () => {
  it('should build a simple rule', () => {
    const P = new Program();
    P.add(
      P.rule()
        .slot(Screen.Learning, Slot.Header)
        .when(scope(Scope.Postpartum))
        .show({
          props: {
            body: 'Welcome home!',
            title: 'Day 1',
          },
          template: 'Card.WeekSummary',
        })
        .priority(50)
        .build(),
    );

    const rules = P.build();
    expect(rules).toHaveLength(1);
    expect(rules[0]?.screen).toBe(Screen.Learning);
    expect(rules[0]?.slot).toBe(Slot.Header);
    expect(rules[0]?.priority).toBe(50);
  });

  it('should generate series of rules with ppDays', () => {
    const P = new Program();
    P.series.ppDays(0, 3, ({ day }) =>
      P.rule()
        .slot(Screen.Learning, Slot.Header)
        .when(postpartum.day.eq(day))
        .show({
          props: {
            body: 'Content',
            title: `Day ${day}`,
          },
          template: 'Card.WeekSummary',
        })
        .priority(50)
        .build(),
    );

    const rules = P.build();
    expect(rules).toHaveLength(4); // 0, 1, 2, 3
  });

  it('should generate series of rules with ppWeeks', () => {
    const P = new Program();
    P.series.ppWeeks(0, 2, ({ week }) =>
      P.rule()
        .slot(Screen.Learning, Slot.Header)
        .when(postpartum.week.eq(week))
        .show({
          props: {
            body: 'Content',
            title: `Week ${week}`,
          },
          template: 'Card.WeekSummary',
        })
        .priority(50)
        .build(),
    );

    const rules = P.build();
    expect(rules).toHaveLength(3); // 0, 1, 2
  });
});

describe('Compute Props', () => {
  it('should create compute prop', () => {
    const prop = compute((ctx) => `Week ${ctx.week}`);
    expect(prop).toHaveProperty('_type', 'compute');
    expect(prop).toHaveProperty('fn');
  });

  it('should evaluate compute prop', () => {
    const fn = (ctx: RuleContext) => `Week ${ctx.week}`;
    const prop = compute(fn);
    const ctx: RuleContext = { week: 30 };
    expect((prop as { fn: typeof fn }).fn(ctx)).toBe('Week 30');
  });
});

describe('Rule Evaluation', () => {
  it('should pick highest priority matching rule', async () => {
    const P = new Program();

    // Lower priority
    P.add(
      P.rule()
        .slot(Screen.Learning, Slot.Header)
        .when(scope(Scope.Postpartum))
        .show({
          props: { body: 'Content', title: 'Low Priority' },
          template: 'Card.WeekSummary',
        })
        .priority(10)
        .build(),
    );

    // Higher priority
    P.add(
      P.rule()
        .slot(Screen.Learning, Slot.Header)
        .when(scope(Scope.Postpartum))
        .show({
          props: { body: 'Content', title: 'High Priority' },
          template: 'Card.WeekSummary',
        })
        .priority(50)
        .build(),
    );

    const ctx: RuleContext = { scope: Scope.Postpartum };
    const cache = new InMemoryCache();
    const { pickForSlot } = await import('../src/dynamic');
    const result = await pickForSlot(
      P.build(),
      Screen.Learning,
      Slot.Header,
      ctx,
      cache,
    );

    expect(result).not.toBeNull();
    expect(result?.props.title).toBe('High Priority');
  });

  it('should return null when no rules match', async () => {
    const P = new Program();

    P.add(
      P.rule()
        .slot(Screen.Learning, Slot.Header)
        .when(scope(Scope.Pregnancy))
        .show({
          props: { body: 'Body', title: 'Title' },
          template: 'Card.WeekSummary',
        })
        .priority(50)
        .build(),
    );

    const ctx: RuleContext = { scope: Scope.Postpartum };
    const cache = new InMemoryCache();
    const { pickForSlot } = await import('../src/dynamic');
    const result = await pickForSlot(
      P.build(),
      Screen.Learning,
      Slot.Header,
      ctx,
      cache,
    );

    expect(result).toBeNull();
  });
});
