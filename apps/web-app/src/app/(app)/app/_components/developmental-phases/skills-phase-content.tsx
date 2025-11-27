'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@nugget/ui/accordion';
import { Checkbox } from '@nugget/ui/checkbox';
import { P } from '@nugget/ui/custom/typography';
import { cn } from '@nugget/ui/lib/utils';
import type { SkillFocus } from './phase-data';

interface SkillsPhaseContentProps {
  focuses: SkillFocus[];
  intro: string;
  checkedIds: string[];
  isComplete?: boolean;
  isFussyComplete?: boolean;
  onToggleFocus: (focusId: string, checked: boolean) => void;
}

export function SkillsPhaseContent({
  focuses,
  intro,
  checkedIds,
  isComplete,
  isFussyComplete = true,
  onToggleFocus,
}: SkillsPhaseContentProps) {
  return (
    <div className="space-y-3">
      <P className="text-sm text-foreground/95 leading-relaxed">{intro}</P>

      {!isFussyComplete && (
        <div className="rounded-2xl border border-dashed border-white/40 bg-black/15 dark:bg-black/25 p-3 text-xs text-white/95">
          Complete the fussy phase first to track skill progress
        </div>
      )}

      <Accordion
        className="space-y-3"
        collapsible
        defaultValue={focuses.length > 0 ? [focuses[0].id] : undefined}
        type="multiple"
      >
        {focuses.map((focus) => {
          const checked = checkedIds.includes(focus.id);
          return (
            <AccordionItem
              className={cn(
                'rounded-2xl border px-3 transition-colors bg-white dark:bg-black/20',
                checked ? 'border-white/50 shadow-sm' : 'border-white/20',
              )}
              key={focus.id}
              value={focus.id}
            >
              <AccordionTrigger
                className="gap-3 px-1 py-3 text-left"
                disabled={isComplete}
              >
                <div
                  className="flex items-start gap-3"
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      event.stopPropagation();
                    }
                  }}
                  role="presentation"
                >
                  <Checkbox
                    checked={checked}
                    className="mt-1"
                    disabled={isComplete || !isFussyComplete}
                    onCheckedChange={(value) =>
                      onToggleFocus(focus.id, Boolean(value))
                    }
                  />
                  <div className="flex flex-1 flex-col gap-1">
                    <P className="text-sm font-semibold text-foreground">
                      {focus.title}
                    </P>
                    <P className="text-xs text-foreground/80">
                      {focus.summary}
                    </P>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-4 pl-9 pr-4 text-xs text-foreground/85">
                <P className="text-sm text-foreground">
                  Try these gentle prompts:
                </P>
                <ul className="mt-3 flex list-disc flex-col gap-1 pl-5">
                  {focus.encouragement.map((tip) => (
                    <li key={tip}>{tip}</li>
                  ))}
                </ul>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}
