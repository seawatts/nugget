'use client';

import { Button } from '@nugget/ui/button';
import { cn } from '@nugget/ui/lib/utils';
import { MessageSquare } from 'lucide-react';
import { useState } from 'react';
import { QuickChatDialog } from './quick-chat-dialog';

interface QuickChatFabProps {
  babyId: string;
  systemPrompt?: string;
  className?: string;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
}

/**
 * A floating action button that opens the quick chat dialog.
 * Perfect for adding chat functionality to any page.
 *
 * @example
 * <QuickChatFab
 *   babyId={baby.id}
 *   systemPrompt="You are a feeding consultant."
 *   position="bottom-right"
 * />
 */
export function QuickChatFab({
  babyId,
  systemPrompt,
  className,
  position = 'bottom-right',
}: QuickChatFabProps) {
  const [isOpen, setIsOpen] = useState(false);

  const positionClasses = {
    'bottom-left': 'bottom-6 left-6',
    'bottom-right': 'bottom-6 right-6',
    'top-left': 'top-6 left-6',
    'top-right': 'top-6 right-6',
  };

  return (
    <>
      <Button
        className={cn(
          'fixed z-50 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all',
          positionClasses[position],
          className,
        )}
        onClick={() => setIsOpen(true)}
        size="lg"
      >
        <MessageSquare className="w-6 h-6" />
      </Button>

      <QuickChatDialog
        babyId={babyId}
        onOpenChange={setIsOpen}
        open={isOpen}
        systemPrompt={systemPrompt}
      />
    </>
  );
}
