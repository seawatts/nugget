'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@nugget/ui/accordion';
import { Badge } from '@nugget/ui/badge';
import { Checkbox } from '@nugget/ui/checkbox';
import { P } from '@nugget/ui/custom/typography';
import { cn } from '@nugget/ui/lib/utils';
import type { FussyBehavior } from './phase-data';

interface FussyPhaseContentProps {
  behaviors: FussyBehavior[];
  checkedIds: string[];
  intro: string;
  isComplete?: boolean;
  onToggleBehavior: (behaviorId: string, checked: boolean) => void;
}

export function FussyPhaseContent({
  behaviors,
  checkedIds,
  intro,
  isComplete,
  onToggleBehavior,
}: FussyPhaseContentProps) {
  const defaultAccordionValue =
    behaviors.length > 0 && behaviors[0] ? [behaviors[0].id] : undefined;

  return (
    <div className="space-y-3">
      <P className="text-sm text-white/95 dark:text-white/90 leading-relaxed">
        {intro}
      </P>

      <Accordion
        className="space-y-3"
        defaultValue={defaultAccordionValue}
        type="multiple"
      >
        {behaviors.map((behavior) => {
          const checked = checkedIds.includes(behavior.id);
          return (
            <AccordionItem
              className={cn(
                'rounded-2xl border px-3 transition-colors bg-white dark:bg-black/20',
                checked ? 'border-white/50 shadow-sm' : 'border-white/20',
              )}
              key={behavior.id}
              value={behavior.id}
            >
              <div className="flex items-start gap-3 px-1 py-3">
                <Checkbox
                  checked={checked}
                  className="mt-1 shrink-0"
                  disabled={isComplete}
                  onCheckedChange={(value) =>
                    onToggleBehavior(behavior.id, Boolean(value))
                  }
                />
                <AccordionTrigger
                  className="gap-3 flex-1 text-left px-0 py-0"
                  disabled={isComplete}
                >
                  <div className="flex flex-1 flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <P className="text-sm font-semibold">{behavior.title}</P>
                      {checked && (
                        <Badge
                          className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20"
                          variant="outline"
                        >
                          soothed
                        </Badge>
                      )}
                    </div>
                    <P className="text-xs text-muted-foreground">
                      {behavior.summary}
                    </P>
                  </div>
                </AccordionTrigger>
              </div>
              <AccordionContent className="pb-4 pl-9 pr-4 text-sm text-muted-foreground">
                <P className="text-sm text-foreground">{behavior.learnMore}</P>
                <ul className="mt-3 flex list-disc flex-col gap-1 pl-5 text-xs text-muted-foreground">
                  {behavior.soothingIdeas.map((idea) => (
                    <li key={idea}>{idea}</li>
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
