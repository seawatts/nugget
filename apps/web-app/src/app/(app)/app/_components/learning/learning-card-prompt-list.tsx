'use client';

import { Button } from '@nugget/ui/button';
import { Card, CardContent, CardHeader } from '@nugget/ui/card';
import { H3, P } from '@nugget/ui/custom/typography';
import { MessageSquare } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Prompt {
  text: string;
  category?: string;
}

interface LearningCardPromptListProps {
  title: string;
  prompts: Prompt[];
  ageLabel?: string;
}

export function LearningCardPromptList({
  title,
  prompts,
  ageLabel,
}: LearningCardPromptListProps) {
  const router = useRouter();

  const handlePromptClick = (promptText: string) => {
    const encodedPrompt = encodeURIComponent(promptText);
    router.push(`/app/chat?prompt=${encodedPrompt}`);
  };

  return (
    <Card className="min-w-[320px] max-w-[320px] snap-start">
      <CardHeader className="p-6 pb-4">
        {ageLabel && (
          <P className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
            {ageLabel}
          </P>
        )}
        <H3 className="text-lg">{title}</H3>
      </CardHeader>

      <CardContent className="gap-2 grid p-6 pt-0">
        {prompts.map((prompt) => (
          <Button
            className="justify-start text-left h-auto py-3"
            key={prompt.text}
            onClick={() => handlePromptClick(prompt.text)}
            variant="outline"
          >
            <MessageSquare className="size-4 shrink-0" />
            <span className="flex-1">{prompt.text}</span>
          </Button>
        ))}
      </CardContent>
    </Card>
  );
}
