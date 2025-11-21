'use client';

import { api } from '@nugget/api/react';
import { H2, P } from '@nugget/ui/custom/typography';
import { useMediaQuery } from '@nugget/ui/hooks/use-media-query';
import { Award } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useOptimisticMilestonesStore } from '~/stores/optimistic-milestones';
import { MilestoneCard } from './milestone-card';
import { MilestoneCardCheckBack } from './milestone-card-check-back';
import { MilestoneCardLoading } from './milestone-card-loading';
import { MilestoneChatCard } from './milestone-chat-card';
import {
  getMilestonesCarouselContent,
  type MilestoneCardData,
} from './milestones-carousel.actions';
import { SwipeableMilestoneCard } from './swipeable-milestone-card';
import { useMilestoneMutations } from './use-milestone-mutations';

interface MilestonesCarouselProps {
  babyId: string;
}

type ChatCardData = {
  cardType: 'chat';
  id: string;
  milestoneId: string;
  milestoneTitle: string;
  milestoneType: string;
  answer: 'yes' | 'no';
  followUpQuestion: string;
  contextId: string;
};

type CardData = (MilestoneCardData & { cardType: 'milestone' }) | ChatCardData;

export function MilestonesCarousel({ babyId }: MilestonesCarouselProps) {
  const [milestones, setMilestones] = useState<MilestoneCardData[]>([]);
  const [cardStack, setCardStack] = useState<CardData[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [removingCardId, setRemovingCardId] = useState<string | null>(null);
  const [isProcessingSwipe, setIsProcessingSwipe] = useState(false);
  const isMobile = useMediaQuery({ query: '(max-width: 768px)' });

  // TEMP: Force mobile mode for testing (uncomment to test on desktop)
  // const isMobile = true;

  // Fetch baby info using tRPC suspense query (prefetched on server, lightweight version)
  const [baby] = api.babies.getByIdLight.useSuspenseQuery({ id: babyId });

  // Use milestone mutations hook
  const { markComplete } = useMilestoneMutations();

  // Get optimistic completion state
  const isOptimisticallyCompleted =
    useOptimisticMilestonesStore.use.isOptimisticallyCompleted();

  const babyName = baby?.firstName ?? 'Baby';
  const ageInDays = baby?.birthDate
    ? Math.floor(
        (Date.now() - baby.birthDate.getTime()) / (1000 * 60 * 60 * 24),
      )
    : 0;

  // Load milestones content - extracted to useCallback so it can be reused
  const loadMilestones = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log('[MilestonesCarousel] Loading content for baby:', babyId);

      const data = await getMilestonesCarouselContent(babyId);

      console.log(
        '[MilestonesCarousel] Loaded milestones:',
        data.milestones.length,
      );

      setMilestones(data.milestones);
      // Initialize card stack with milestones
      setCardStack(
        data.milestones.map((m) => ({ ...m, cardType: 'milestone' as const })),
      );
      setCurrentCardIndex(0);
    } catch (error) {
      console.error('[MilestonesCarousel] Failed to load content:', error);
    } finally {
      setIsLoading(false);
    }
  }, [babyId]);

  // Load milestones on mount
  useEffect(() => {
    loadMilestones();
  }, [loadMilestones]);

  // Handler to mark milestone as complete
  const handleMarkComplete = useCallback(
    async (milestone: MilestoneCardData) => {
      if (!baby?.id) return;

      try {
        await markComplete({
          babyId: baby.id,
          description: milestone.description,
          milestoneId: milestone.id,
          suggestedDay: milestone.suggestedDay,
          title: milestone.title,
          type: milestone.type,
        });

        console.log(
          '[MilestonesCarousel] Milestone marked complete:',
          milestone.title,
        );

        // Reload milestones to update the UI with the new completion status
        await loadMilestones();
      } catch (error) {
        console.error('[MilestonesCarousel] Failed to mark complete:', error);
      }
    },
    [baby?.id, markComplete, loadMilestones],
  );

  // Handle swipe actions on milestone cards (mobile only)
  const handleMilestoneSwipe = useCallback(
    (milestone: MilestoneCardData, answer: 'yes' | 'no') => {
      // Prevent rapid swipes
      if (isProcessingSwipe) {
        console.log('[MilestonesCarousel] Swipe already in progress, ignoring');
        return;
      }

      console.log(
        '[MilestonesCarousel] Milestone swiped:',
        answer,
        milestone.title,
      );
      setIsProcessingSwipe(true);

      // Mark card as removing for exit animation
      setRemovingCardId(milestone.id);

      // If answer is "yes", mark milestone as complete
      if (answer === 'yes' && !milestone.isCompleted) {
        handleMarkComplete(milestone);
      }

      // Insert chat card after current milestone
      setTimeout(() => {
        const chatCard: ChatCardData = {
          answer,
          cardType: 'chat',
          contextId: `${milestone.type}-${milestone.title}`,
          followUpQuestion: milestone.followUpQuestion || '',
          id: `chat-${milestone.id}`,
          milestoneId: milestone.id,
          milestoneTitle: milestone.title,
          milestoneType: milestone.type,
        };

        setCardStack((prev) => {
          const newStack = [...prev];
          newStack.splice(currentCardIndex + 1, 0, chatCard);
          return newStack;
        });

        // Move to next card (the chat card)
        setCurrentCardIndex((prev) => prev + 1);
        setRemovingCardId(null);
        setIsProcessingSwipe(false);
      }, 300); // Wait for exit animation
    },
    [currentCardIndex, handleMarkComplete, isProcessingSwipe],
  );

  // Handle chat card dismissal
  const handleChatDismiss = useCallback(
    (chatCardId: string) => {
      // Prevent rapid dismissals
      if (isProcessingSwipe) {
        console.log(
          '[MilestonesCarousel] Dismissal already in progress, ignoring',
        );
        return;
      }

      console.log('[MilestonesCarousel] Chat card dismissed:', chatCardId);
      setIsProcessingSwipe(true);

      // Mark card as removing for exit animation
      setRemovingCardId(chatCardId);

      setTimeout(() => {
        setCardStack((prev) => prev.filter((card) => card.id !== chatCardId));
        // Current index stays the same, showing the next card
        setRemovingCardId(null);
        setIsProcessingSwipe(false);
      }, 300); // Wait for exit animation
    },
    [isProcessingSwipe],
  );

  // Show loading state
  if (isLoading) {
    return (
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Award className="size-5 text-primary" />
          <H2 className="text-xl">Milestones</H2>
          <P className="text-xs text-muted-foreground ml-auto">Loading...</P>
        </div>
        <MilestoneCardLoading ageInDays={ageInDays} babyName={babyName} />
      </div>
    );
  }

  // Show message if no milestones (don't hide completely)
  if (milestones.length === 0) {
    console.log('[MilestonesCarousel] No milestones to display');
    return (
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Award className="size-5 text-primary" />
          <H2 className="text-xl">Milestones</H2>
          <P className="text-xs text-muted-foreground ml-auto">
            Day {ageInDays}
          </P>
        </div>
        <div className="bg-muted/30 rounded-lg p-6 text-center">
          <P className="text-muted-foreground">
            {baby
              ? 'Generating personalized milestone suggestions...'
              : 'No milestones available'}
          </P>
        </div>
      </div>
    );
  }

  // Get current card to display
  const currentCard = cardStack[currentCardIndex];
  const hasMoreCards = currentCardIndex < cardStack.length - 1;

  // Debug: Log mobile state
  console.log(
    '[MilestonesCarousel] isMobile:',
    isMobile,
    'viewport width:',
    typeof window !== 'undefined' ? window.innerWidth : 'SSR',
  );

  // Mobile: Stack view with current card
  if (isMobile) {
    return (
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Award className="size-5 text-primary" />
          <H2 className="text-xl">Milestones</H2>
          <P className="text-xs text-muted-foreground ml-auto">
            Day {ageInDays} • {currentCardIndex + 1} of {cardStack.length}
          </P>
        </div>

        <div className="relative min-h-[500px]">
          {/* Current Card */}
          {currentCard && (
            <div
              className={`w-full transition-opacity duration-300 ${
                removingCardId === currentCard.id ? 'opacity-0' : 'opacity-100'
              }`}
            >
              {currentCard.cardType === 'chat' ? (
                <MilestoneChatCard
                  answer={currentCard.answer}
                  babyId={baby?.id || ''}
                  contextId={currentCard.contextId}
                  followUpQuestion={currentCard.followUpQuestion}
                  milestoneTitle={currentCard.milestoneTitle}
                  onDismiss={() => handleChatDismiss(currentCard.id)}
                />
              ) : (
                <SwipeableMilestoneCard
                  onSwipeLeft={() => handleMilestoneSwipe(currentCard, 'no')}
                  onSwipeRight={() => handleMilestoneSwipe(currentCard, 'yes')}
                >
                  <MilestoneCard
                    ageLabel={currentCard.ageLabel}
                    babyId={baby?.id}
                    bulletPoints={
                      currentCard.bulletPoints || [currentCard.description]
                    }
                    followUpQuestion={currentCard.followUpQuestion || ''}
                    isCompleted={
                      currentCard.isCompleted ||
                      isOptimisticallyCompleted(currentCard.id)
                    }
                    isYesNoQuestion={currentCard.isYesNoQuestion}
                    onMarkComplete={() => handleMarkComplete(currentCard)}
                    openChatOnNo={currentCard.openChatOnNo}
                    openChatOnYes={currentCard.openChatOnYes}
                    summary={currentCard.summary}
                    swipeMode={true}
                    title={currentCard.title}
                    type={currentCard.type}
                  />
                </SwipeableMilestoneCard>
              )}
            </div>
          )}

          {/* Show check back card when done */}
          {!hasMoreCards && !currentCard && baby && (
            <div className="w-full">
              <MilestoneCardCheckBack
                baby={{ firstName: baby.firstName ?? 'Baby' }}
                currentAgeInDays={ageInDays}
                nextMilestoneDay={(() => {
                  // Calculate next update based on AI generation schedule
                  if (ageInDays < 112) {
                    return ageInDays + 1; // Tomorrow
                  }
                  if (ageInDays < 119) {
                    return 119; // Week 17 starts
                  }
                  return (Math.floor(ageInDays / 7) + 1) * 7;
                })()}
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  // Desktop: Horizontal scroll view (original behavior with buttons)
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Award className="size-5 text-primary" />
        <H2 className="text-xl">Milestones</H2>
        <P className="text-xs text-muted-foreground ml-auto">Day {ageInDays}</P>
      </div>

      {/* Horizontal scroll container */}
      <div className="flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide -mx-4 px-4">
        {milestones.map((milestone) => (
          <div
            className="snap-center shrink-0 first:ml-0 w-[340px] sm:w-96"
            key={milestone.id}
          >
            <MilestoneCard
              ageLabel={milestone.ageLabel}
              babyId={baby?.id}
              bulletPoints={milestone.bulletPoints || [milestone.description]}
              followUpQuestion={milestone.followUpQuestion || ''}
              isCompleted={
                milestone.isCompleted || isOptimisticallyCompleted(milestone.id)
              }
              isYesNoQuestion={milestone.isYesNoQuestion}
              onMarkComplete={() => handleMarkComplete(milestone)}
              openChatOnNo={milestone.openChatOnNo}
              openChatOnYes={milestone.openChatOnYes}
              summary={milestone.summary}
              swipeMode={false}
              title={milestone.title}
              type={milestone.type}
            />
          </div>
        ))}

        {/* Check back card - shown at the end */}
        {baby &&
          (() => {
            // Calculate next update based on AI generation schedule:
            // - Days 0-112: Daily updates
            // - Week 17+ (day 119+): Weekly updates
            let nextUpdate: number;
            if (ageInDays < 112) {
              nextUpdate = ageInDays + 1; // Tomorrow
            } else if (ageInDays < 119) {
              nextUpdate = 119; // Week 17 starts
            } else {
              // Next week boundary (weeks are 7-day intervals)
              nextUpdate = (Math.floor(ageInDays / 7) + 1) * 7;
            }

            return (
              <div className="snap-center shrink-0 w-[340px] sm:w-96">
                <MilestoneCardCheckBack
                  baby={{ firstName: baby.firstName ?? 'Baby' }}
                  currentAgeInDays={ageInDays}
                  nextMilestoneDay={nextUpdate}
                />
              </div>
            );
          })()}
      </div>

      {/* Add custom scrollbar styles */}
      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
