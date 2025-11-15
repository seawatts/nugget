// Core DSL for type-safe content rules engine
// Provides builder pattern, condition evaluation, and rule matching

// ============================================================================
// Enums
// ============================================================================

export enum Screen {
  Learning = 'learning',
  Pregnancy = 'pregnancy',
  Hospital = 'hospital',
  Nursery = 'nursery',
  AiChat = 'ai_chat',
}

export enum Slot {
  Header = 'header',
  Callout = 'callout',
  Carousel = 'carousel',
}

export enum Scope {
  TTC = 'ttc',
  Pregnancy = 'pregnancy',
  Postpartum = 'postpartum',
}

export enum ProgressKey {
  HospitalBag = 'hospital_bag',
  NurseryEssentials = 'nursery_essentials',
}

export enum DoneKey {
  NurserySetup = 'nursery_setup',
}

// ============================================================================
// Context Types
// ============================================================================

export interface RuleContext {
  scope?: Scope;
  week?: number;
  ppDay?: number;
  ppWeek?: number;
  progress?: Record<string, number>;
  done?: Record<string, boolean>;
  stale?: Record<string, number>; // timestamp when last updated
  baby?: {
    sex?: string;
    ageInDays?: number;
  };
  traits?: {
    userId?: string;
    firstPregnancy?: boolean;
    partnerName?: string;
    cSectionPlanned?: boolean;
  };
  season?: string;
}

// ============================================================================
// Condition Types
// ============================================================================

export type Condition =
  | { type: 'week.eq'; value: number }
  | { type: 'week.gte'; value: number }
  | { type: 'week.lte'; value: number }
  | { type: 'week.between'; min: number; max: number }
  | { type: 'ppDay.eq'; value: number }
  | { type: 'ppWeek.eq'; value: number }
  | { type: 'scope'; value: Scope }
  | { type: 'progress.lt'; key: ProgressKey; value: number }
  | { type: 'progress.gte'; key: ProgressKey; value: number }
  | { type: 'progress.value'; key: ProgressKey }
  | { type: 'done'; key: DoneKey }
  | { type: 'notDone'; key: DoneKey }
  | { type: 'stale'; key: string; minutes: number }
  | { type: 'and'; conditions: Condition[] }
  | { type: 'or'; conditions: Condition[] }
  | { type: 'not'; condition: Condition };

// ============================================================================
// Condition Builders
// ============================================================================

export const week = {
  between: (min: number, max: number): Condition => ({
    max,
    min,
    type: 'week.between',
  }),
  eq: (value: number): Condition => ({ type: 'week.eq', value }),
  gte: (value: number): Condition => ({ type: 'week.gte', value }),
  lte: (value: number): Condition => ({ type: 'week.lte', value }),
};

export const postpartum = {
  day: {
    eq: (value: number): Condition => ({ type: 'ppDay.eq', value }),
  },
  week: {
    eq: (value: number): Condition => ({ type: 'ppWeek.eq', value }),
  },
};

export const scope = (value: Scope): Condition => ({ type: 'scope', value });

export const progress = (key: ProgressKey) => ({
  gte: (value: number): Condition => ({ key, type: 'progress.gte', value }),
  lt: (value: number): Condition => ({ key, type: 'progress.lt', value }),
  value: { key, type: 'progress.value' as const },
});

export const done = (key: DoneKey): Condition => ({ key, type: 'done' });
export const notDone = (key: DoneKey): Condition => ({ key, type: 'notDone' });

export const stale = (key: string, minutes: number): Condition => ({
  key,
  minutes,
  type: 'stale',
});

// Combinators
export const and = (...conditions: Condition[]): Condition => ({
  conditions,
  type: 'and',
});

export const or = (...conditions: Condition[]): Condition => ({
  conditions,
  type: 'or',
});

export const not = (condition: Condition): Condition => ({
  condition,
  type: 'not',
});

// ============================================================================
// Template Types
// ============================================================================

export type ComputeFn<T> = (ctx: RuleContext) => T;

export type PropValue<T = unknown> =
  | T
  | { _type: 'compute'; fn: ComputeFn<T> }
  | { _type: 'aiTextBaml'; config: unknown }; // Unknown until we define aiTextBaml

export interface CTAGoToProps {
  headline: PropValue<string>;
  subtext?: PropValue<string>;
  deeplink: PropValue<string>;
}

export interface CardProgressProps {
  label: PropValue<string>;
  percent: PropValue<number>;
  deeplink: PropValue<string>;
}

export interface CardWeekSummaryProps {
  title: PropValue<string>;
  body: PropValue<string>;
}

export interface CardSuccessProps {
  title: PropValue<string>;
  body: PropValue<string>;
  deeplink?: PropValue<string>;
}

export interface NavDirectiveProps {
  deeplink: PropValue<string>;
  mode: PropValue<string>;
  valid?: PropValue<string>;
  cooldown?: PropValue<string>;
  key?: PropValue<string>;
}

export interface CarouselPromptListProps {
  prompts: PropValue<string[] | string>;
}

export type RenderTemplate =
  | { template: 'CTA.GoTo'; props: CTAGoToProps }
  | { template: 'Card.Progress'; props: CardProgressProps }
  | { template: 'Card.WeekSummary'; props: CardWeekSummaryProps }
  | { template: 'Card.Success'; props: CardSuccessProps }
  | { template: 'Card.Hidden'; props: Record<string, never> }
  | { template: 'Nav.Directive'; props: NavDirectiveProps }
  | { template: 'Carousel.PromptList'; props: CarouselPromptListProps };

// Helper for compute
export function compute<T>(fn: ComputeFn<T>): PropValue<T> {
  return { _type: 'compute', fn };
}

// ============================================================================
// Rule Types
// ============================================================================

export interface Rule {
  screen: Screen;
  slot: Slot;
  conditions: Condition[];
  render: RenderTemplate;
  priority: number;
}

export type RuleJSON = Rule;

// ============================================================================
// Builder
// ============================================================================

class RuleBuilder {
  private _screen?: Screen;
  private _slot?: Slot;
  private _conditions: Condition[] = [];
  private _render?: RenderTemplate;
  private _priority = 0;

  slot(screen: Screen, slot: Slot): this {
    this._screen = screen;
    this._slot = slot;
    return this;
  }

  when(...conditions: Condition[]): this {
    this._conditions.push(...conditions);
    return this;
  }

  show(render: RenderTemplate): this {
    this._render = render;
    return this;
  }

  priority(value: number): this {
    this._priority = value;
    return this;
  }

  build(): Rule {
    if (!this._screen || !this._slot || !this._render) {
      throw new Error('Rule must have screen, slot, and render defined');
    }
    return {
      conditions: this._conditions,
      priority: this._priority,
      render: this._render,
      screen: this._screen,
      slot: this._slot,
    };
  }
}

// ============================================================================
// Program
// ============================================================================

export class Program {
  private rules: Rule[] = [];

  rule(): RuleBuilder {
    return new RuleBuilder();
  }

  add(rule: Rule): void {
    this.rules.push(rule);
  }

  series = {
    ppDays: (
      start: number,
      end: number,
      cb: (params: { day: number }) => Rule | undefined,
    ): void => {
      for (let day = start; day <= end; day++) {
        const rule = cb({ day });
        if (rule) this.add(rule);
      }
    },

    ppWeeks: (
      start: number,
      end: number,
      cb: (params: { week: number }) => Rule | undefined,
    ): void => {
      for (let week = start; week <= end; week++) {
        const rule = cb({ week });
        if (rule) this.add(rule);
      }
    },
  };

  build(): RuleJSON[] {
    return this.rules;
  }
}

// ============================================================================
// Evaluator
// ============================================================================

export function evalCond(cond: Condition, ctx: RuleContext): boolean {
  switch (cond.type) {
    case 'week.eq':
      return ctx.week === cond.value;
    case 'week.gte':
      return (ctx.week ?? 0) >= cond.value;
    case 'week.lte':
      return (ctx.week ?? 0) <= cond.value;
    case 'week.between':
      return (ctx.week ?? 0) >= cond.min && (ctx.week ?? 0) <= cond.max;
    case 'ppDay.eq':
      return ctx.ppDay === cond.value;
    case 'ppWeek.eq':
      return ctx.ppWeek === cond.value;
    case 'scope':
      return ctx.scope === cond.value;
    case 'progress.lt':
      return (ctx.progress?.[cond.key] ?? 0) < cond.value;
    case 'progress.gte':
      return (ctx.progress?.[cond.key] ?? 0) >= cond.value;
    case 'progress.value':
      return true; // Just checks if progress exists
    case 'done':
      return ctx.done?.[cond.key] === true;
    case 'notDone':
      return ctx.done?.[cond.key] !== true;
    case 'stale': {
      const lastUpdate = ctx.stale?.[cond.key];
      if (!lastUpdate) return false;
      const now = Date.now();
      const minutesAgo = (now - lastUpdate) / 1000 / 60;
      return minutesAgo >= cond.minutes;
    }
    case 'and':
      return cond.conditions.every((c) => evalCond(c, ctx));
    case 'or':
      return cond.conditions.some((c) => evalCond(c, ctx));
    case 'not':
      return !evalCond(cond.condition, ctx);
    default:
      return false;
  }
}

export async function resolveProps<T extends Record<string, PropValue>>(
  props: T,
  ctx: RuleContext,
  cache: Cache,
): Promise<Record<string, unknown>> {
  const resolved: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(props)) {
    if (value && typeof value === 'object' && '_type' in value) {
      if (value._type === 'compute') {
        resolved[key] = (value as unknown as { fn: ComputeFn<unknown> }).fn(
          ctx,
        );
      } else if (value._type === 'aiTextBaml') {
        // Will be resolved by dynamic-baml module
        const config = (value as unknown as { config: unknown }).config as {
          key: (ctx: RuleContext) => string;
          ttl: string;
          call: (ctx: RuleContext) => {
            fn: unknown;
            input: unknown;
            pick: (o: unknown) => unknown;
          };
        };
        const cacheKey = config.key(ctx);
        const cached = await cache.get(cacheKey);

        if (cached && cached.exp > Date.now()) {
          resolved[key] = cached.val;
        } else {
          // This will be handled by the BAML integration layer
          // For now, mark as pending
          resolved[key] = '[AI_PENDING]';
        }
      }
    } else {
      resolved[key] = value;
    }
  }

  return resolved;
}

export async function pickForSlot(
  rules: RuleJSON[],
  screen: Screen,
  slot: Slot,
  ctx: RuleContext,
  _cache: Cache,
): Promise<{ template: string; props: Record<string, PropValue> } | null> {
  // Filter rules matching screen and slot
  const matching = rules.filter((r) => r.screen === screen && r.slot === slot);

  // Evaluate conditions and sort by priority
  const validRules = matching
    .filter((r) => r.conditions.every((c) => evalCond(c, ctx)))
    .sort((a, b) => b.priority - a.priority);

  if (validRules.length === 0) return null;

  // Pick highest priority
  const rule = validRules[0];
  if (!rule) return null;

  // Return props without resolving - let the caller handle resolution
  // This allows AI props to be resolved properly by resolveAIProps
  return {
    props: rule.render.props as Record<string, PropValue>,
    template: rule.render.template,
  };
}

// ============================================================================
// Cache Interface
// ============================================================================

export interface Cache {
  get(key: string): Promise<{ val: unknown; exp: number } | undefined>;
  set(key: string, val: unknown, ttlMs: number): Promise<void>;
}
