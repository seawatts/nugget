'use client';

import type { Screen, Slot } from '@nugget/content-rules';
import type { Baby } from '@nugget/db/schema';
import { H2, P } from '@nugget/ui/custom/typography';
import { Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { LearningCardCheckBack } from './learning-card-check-back';
import { LearningCardCTA } from './learning-card-cta';
import { LearningCardInfo } from './learning-card-info';
import { LearningCardLoading } from './learning-card-loading';
import { LearningCardSuccess } from './learning-card-success';
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

interface LearningCarouselProps {
  babyId: string;
}

export function LearningCarousel({ babyId }: LearningCarouselProps) {
  const [cards, setCards] = useState<LearningCard[]>([]);
  const [baby, setBaby] = useState<Baby | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isResolvingAI, setIsResolvingAI] = useState(false);

  useEffect(() => {
    async function loadContent() {
      try {
        setIsLoading(true);
        const { cards: content, baby: babyData } =
          await getLearningCarouselContent(babyId);
        setCards(content);
        setBaby(babyData);
        setIsLoading(false);

        // Resolve AI content for each card progressively (non-blocking)
        const cardsWithPendingAI = content.filter((card) =>
          Object.values(card.props).some((val) => val === '[AI_PENDING]'),
        );

        if (cardsWithPendingAI.length > 0) {
          setIsResolvingAI(true);
        }

        let resolvedCount = 0;
        for (const card of content) {
          // Check if card has any pending AI content
          const hasPendingAI = Object.values(card.props).some(
            (val) => val === '[AI_PENDING]',
          );

          if (hasPendingAI) {
            // Resolve AI content in the background
            resolveCardAIContent(card.id, card.screen, card.slot)
              .then((aiProps) => {
                resolvedCount++;
                if (resolvedCount === cardsWithPendingAI.length) {
                  setIsResolvingAI(false);
                }
                if (aiProps) {
                  // Check if AI props contain an array of tips that should be expanded
                  const bodyValue = aiProps.body || aiProps.subtext;
                  const shouldExpand =
                    Array.isArray(bodyValue) && bodyValue.length > 0;

                  if (shouldExpand) {
                    // Expand array into multiple cards
                    setCards((prevCards) => {
                      const cardIndex = prevCards.findIndex(
                        (c) => c.id === card.id,
                      );
                      if (cardIndex === -1) return prevCards;

                      const newCards: LearningCard[] = [];

                      // Create a card for each tip - pass the full tip object
                      (
                        bodyValue as Array<{
                          category: string;
                          summary: string;
                          bulletPoints: string[];
                          followUpQuestion: string;
                        }>
                      ).forEach((tip, tipIndex) => {
                        newCards.push({
                          ...card,
                          id: `${card.id}-tip-${tipIndex}`,
                          props: {
                            ...card.props,
                            tip, // Pass the full tip object
                          },
                        });
                      });

                      // Replace the original card with expanded cards
                      return [
                        ...prevCards.slice(0, cardIndex),
                        ...newCards,
                        ...prevCards.slice(cardIndex + 1),
                      ];
                    });
                  } else {
                    // Update the card with resolved AI content normally
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
                }
              })
              .catch((error) => {
                console.error(
                  `Failed to resolve AI content for ${card.id}:`,
                  error,
                );
                resolvedCount++;
                if (resolvedCount === cardsWithPendingAI.length) {
                  setIsResolvingAI(false);
                }
              });
          }
        }
      } catch (error) {
        console.error('Failed to load learning content:', error);
        setIsLoading(false);
      }
    }

    loadContent();
  }, [babyId]);

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
          <P className="text-xs text-muted-foreground ml-auto">Generating...</P>
        </div>
        <LearningCardLoading
          ageInDays={
            baby?.birthDate
              ? Math.floor(
                  (Date.now() - baby.birthDate.getTime()) /
                    (1000 * 60 * 60 * 24),
                )
              : 0
          }
          babyName={baby?.firstName ?? 'Baby'}
        />
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
          {cards
            .filter((card) => {
              // Hide cards with pending AI content while showing the generating card
              if (isResolvingAI) {
                const hasPendingAI = Object.values(card.props).some(
                  (val) => val === '[AI_PENDING]',
                );
                return !hasPendingAI;
              }
              return true;
            })
            .map((card) => (
              <div className="snap-start" key={card.id}>
                {renderCard(card, handleGetAIAdvice, baby)}
              </div>
            ))}

          {/* Show full-width loading card when AI is being resolved */}
          {isResolvingAI && baby && cards.length === 0 && (
            <LearningCardLoading
              ageInDays={
                baby.birthDate
                  ? Math.floor(
                      (Date.now() - baby.birthDate.getTime()) /
                        (1000 * 60 * 60 * 24),
                    )
                  : 0
              }
              babyName={baby.firstName}
            />
          )}

          {/* Check Back card at the end */}
          {!isResolvingAI && baby && (
            <div className="snap-start">
              <LearningCardCheckBack baby={baby} />
            </div>
          )}
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
function renderCard(
  card: LearningCard,
  _onGetAIAdvice: () => void,
  baby: Baby | null,
) {
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
      // Use InfoCard-styled component
      return (
        <LearningCardInfo
          ageInDays={props.ageInDays as number | undefined}
          babyId={baby?.id}
          tip={
            props.tip as
              | import('./learning-carousel.actions').LearningTip
              | undefined
          }
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
