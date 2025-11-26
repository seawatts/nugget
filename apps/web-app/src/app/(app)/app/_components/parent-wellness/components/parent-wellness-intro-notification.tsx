'use client';

import { api } from '@nugget/api/react';
import { Button } from '@nugget/ui/button';
import { X } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

interface ParentWellnessIntroNotificationProps {
  onDismiss: (keepEnabled: boolean) => void;
}

export function ParentWellnessIntroNotification({
  onDismiss,
}: ParentWellnessIntroNotificationProps) {
  const [isClosing, setIsClosing] = useState(false);
  const utils = api.useUtils();

  const { mutate: updatePreferences } = api.user.updatePreferences.useMutation({
    onSuccess: () => {
      void utils.user.current.invalidate();
    },
  });

  const handleKeep = () => {
    setIsClosing(true);
    updatePreferences({
      hasSeenParentWellnessIntro: true,
      showParentWellnessCard: true,
    });
    onDismiss(true);
  };

  const handleTurnOff = () => {
    setIsClosing(true);
    updatePreferences({
      hasSeenParentWellnessIntro: true,
      showParentWellnessCard: false,
    });
    onDismiss(false);
  };

  if (isClosing) return null;

  return (
    <div className="relative p-4 rounded-lg border-2 border-white/20 bg-white/10">
      <div className="flex items-start gap-3">
        <div className="flex-1 space-y-3">
          <div>
            <h3 className="text-sm font-semibold mb-1">
              New: Daily Check-In for Parents
            </h3>
            <p className="text-xs opacity-80 leading-relaxed">
              We've added a quick daily question to help you track your
              well-being. It takes just 2-4 seconds and helps you notice
              patterns in how you're feeling.
            </p>
          </div>
          <div className="space-y-2">
            <div className="flex gap-2">
              <Button
                className="text-xs h-8 px-3 bg-white/20 hover:bg-white/30 border-white/30"
                onClick={handleKeep}
                size="sm"
                variant="outline"
              >
                Keep on
              </Button>
              <Button
                className="text-xs h-8 px-3 bg-white/10 hover:bg-white/20 border-white/30"
                onClick={handleTurnOff}
                size="sm"
                variant="outline"
              >
                Turn off
              </Button>
            </div>
            <p className="text-[10px] opacity-60 leading-tight">
              You can always turn this back on in{' '}
              <Link
                className="underline hover:opacity-80 transition-opacity"
                href="/app/settings/preferences"
              >
                preferences
              </Link>{' '}
              later
            </p>
          </div>
        </div>
        <button
          className="flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity"
          onClick={handleKeep}
          type="button"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}
