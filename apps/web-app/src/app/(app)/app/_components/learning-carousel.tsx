'use client';

import type { Screen, Slot } from '@nugget/content-rules';
import { H2, P } from '@nugget/ui/custom/typography';
import { Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { LearningCardCTA } from './learning-card-cta';
import { LearningCardSuccess } from './learning-card-success';
import { LearningCardSummary } from './learning-card-summary';
import {
  getLearningCarouselContent,
  resolveCardAIContent,
} from './learning-carousel.actions';

interface LearningCard {
  id: string;
  template: string;
  props: Record<string, unknown>;
  screen: Screen;
  slot: Slot;
}

export function LearningCarousel() {
  const [cards, setCards] = useState<LearningCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadContent() {
      try {
        setIsLoading(true);
        const content = await getLearningCarouselContent();
        setCards(content);
        setIsLoading(false);

        // Resolve AI content for each card progressively (non-blocking)
        for (const card of content) {
          // Check if card has any pending AI content
          const hasPendingAI = Object.values(card.props).some(
            (val) => val === '[AI_PENDING]',
          );

          if (hasPendingAI) {
            // Resolve AI content in the background
            resolveCardAIContent(card.id, card.screen, card.slot)
              .then((aiProps) => {
                if (aiProps) {
                  // Update the card with resolved AI content
                  setCards((prevCards) =>
                    prevCards.map((c) =>
                      c.id === card.id
                        ? {
                            ...c,
                            props: {
                              ...c.props,
                              ...aiProps,
                            },
                          }
                        : c,
                    ),
                  );
                }
              })
              .catch((error) => {
                console.error(
                  `Failed to resolve AI content for ${card.id}:`,
                  error,
                );
              });
          }
        }
      } catch (error) {
        console.error('Failed to load learning content:', error);
        setIsLoading(false);
      }
    }

    loadContent();
  }, []);

  // Handle AI advice click
  const handleGetAIAdvice = () => {
    // TODO: Navigate to AI chat or open AI modal
    console.log('Open AI chat');
  };

  if (isLoading) {
    return (
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="size-5 text-primary" />
          <H2 className="text-xl">Learning</H2>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
          {[1, 2, 3].map((i) => (
            <div
              className="min-w-[280px] h-[240px] rounded-lg bg-muted/50 animate-pulse"
              key={i}
            />
          ))}
        </div>
      </div>
    );
  }

  if (cards.length === 0) {
    return null;
  }

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="size-5 text-primary" />
        <H2 className="text-xl">Learning</H2>
        <P className="text-xs text-muted-foreground ml-auto">
          {cards.length} {cards.length === 1 ? 'tip' : 'tips'} for you
        </P>
      </div>

      {/* Horizontal scrolling container */}
      <div className="relative">
        <div
          className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide"
          style={{
            msOverflowStyle: 'none',
            scrollbarWidth: 'none',
          }}
        >
          {cards.map((card) => (
            <div className="snap-start" key={card.id}>
              {renderCard(card, handleGetAIAdvice)}
            </div>
          ))}
        </div>

        {/* Gradient fade on edges */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-background to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-background to-transparent" />
      </div>
    </div>
  );
}

/**
 * Render the appropriate card component based on template
 */
function renderCard(card: LearningCard, onGetAIAdvice: () => void) {
  const { template, props } = card;

  switch (template) {
    case 'CTA.GoTo':
      return (
        <LearningCardCTA
          ageLabel={props.ageLabel as string | undefined}
          deeplink={props.deeplink as string}
          headline={props.headline as string}
          subtext={props.subtext as string | undefined}
        />
      );

    case 'Card.WeekSummary':
      return (
        <LearningCardSummary
          ageLabel={props.ageLabel as string | undefined}
          body={props.body as string}
          onGetAIAdvice={onGetAIAdvice}
          title={props.title as string}
        />
      );

    case 'Card.Success':
      return (
        <LearningCardSuccess
          ageLabel={props.ageLabel as string | undefined}
          body={props.body as string}
          deeplink={props.deeplink as string | undefined}
          title={props.title as string}
        />
      );

    case 'Card.Progress':
      // TODO: Implement Card.Progress variant
      return (
        <LearningCardCTA
          ageLabel={props.ageLabel as string | undefined}
          deeplink={props.deeplink as string}
          headline={props.label as string}
        />
      );

    case 'Nav.Directive':
      // Render as CTA for now
      return (
        <LearningCardCTA
          ageLabel={props.ageLabel as string | undefined}
          deeplink={props.deeplink as string}
          headline="Plan ahead"
        />
      );

    case 'Carousel.PromptList':
      // TODO: Implement prompt list variant
      return null;

    default:
      return null;
  }
}

// CSS to hide scrollbar
const scrollbarHideStyles = `
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
`;

if (
  typeof document !== 'undefined' &&
  !document.getElementById('scrollbar-hide-styles')
) {
  const style = document.createElement('style');
  style.id = 'scrollbar-hide-styles';
  style.innerHTML = scrollbarHideStyles;
  document.head.appendChild(style);
}
