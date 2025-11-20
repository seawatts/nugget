'use client';

import { Button } from '@nugget/ui/button';
import { User, UserCheck } from 'lucide-react';

interface FamilyMember {
  userId: string;
  userName: string;
  avatarUrl?: string | null;
}

interface FeedingAssignmentSectionProps {
  assignedMember: FamilyMember | null;
  suggestedMember: FamilyMember | null;
  isAssignedToCurrentUser: boolean;
  feedingThemeColor: string;
  claiming: boolean;
  onClaim: (e: React.MouseEvent) => void;
  onUnclaim: (e: React.MouseEvent) => void;
}

export function FeedingAssignmentSection({
  assignedMember,
  suggestedMember,
  isAssignedToCurrentUser,
  feedingThemeColor,
  claiming,
  onClaim,
  onUnclaim,
}: FeedingAssignmentSectionProps) {
  return (
    <div className="flex items-center justify-between pt-4 mt-4 border-t border-white/20">
      {assignedMember ? (
        <>
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-full bg-white/20 flex items-center justify-center">
              {assignedMember.avatarUrl ? (
                <img
                  alt={assignedMember.userName}
                  className="size-9 rounded-full"
                  src={assignedMember.avatarUrl}
                />
              ) : (
                <UserCheck className="size-5" />
              )}
            </div>
            <p className="text-sm font-medium">{assignedMember.userName}</p>
          </div>
          {isAssignedToCurrentUser && (
            <Button
              className="bg-white/20 hover:bg-white/30 text-white border-0"
              disabled={claiming}
              onClick={onUnclaim}
              size="sm"
              variant="ghost"
            >
              {claiming ? 'Unclaiming...' : 'Unclaim'}
            </Button>
          )}
        </>
      ) : suggestedMember ? (
        <>
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-full bg-white/20 flex items-center justify-center">
              {suggestedMember.avatarUrl ? (
                <img
                  alt={suggestedMember.userName}
                  className="size-9 rounded-full"
                  src={suggestedMember.avatarUrl}
                />
              ) : (
                <User className="size-5" />
              )}
            </div>
            <p className="text-sm font-medium">{suggestedMember.userName}</p>
          </div>
          <Button
            className={`bg-white text-[${feedingThemeColor}] hover:bg-white/90`}
            disabled={claiming}
            onClick={onClaim}
            size="sm"
          >
            {claiming ? 'Claiming...' : 'Claim'}
          </Button>
        </>
      ) : (
        <Button
          className="w-full bg-white/20 hover:bg-white/30 text-white border-white/30"
          disabled={claiming}
          onClick={onClaim}
          size="sm"
          variant="outline"
        >
          {claiming ? 'Claiming...' : 'Claim This Feeding'}
        </Button>
      )}
    </div>
  );
}
