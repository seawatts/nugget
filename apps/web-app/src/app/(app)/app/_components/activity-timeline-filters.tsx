'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@nugget/ui/avatar';
import { Button } from '@nugget/ui/button';
import { Checkbox } from '@nugget/ui/checkbox';
import { Icons } from '@nugget/ui/custom/icons';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@nugget/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@nugget/ui/drawer';
import { useMediaQuery } from '@nugget/ui/hooks/use-media-query';
import { Label } from '@nugget/ui/label';
import { Separator } from '@nugget/ui/separator';
import type { LucideIcon } from 'lucide-react';
import { Filter } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getFamilyMembersAction } from './activity-timeline-filters.actions';

interface ActivityType {
  color: string;
  icon: LucideIcon;
  id: string;
  label: string;
}

interface FamilyMember {
  avatarUrl: string | null;
  id: string;
  isCurrentUser: boolean;
  name: string;
  userId: string;
}

interface ActivityTimelineFiltersProps {
  activityTypes: ActivityType[];
  onFilterChange: (userIds: string[], activityTypes: string[]) => void;
  selectedActivityTypes: string[];
  selectedUserIds: string[];
}

export function ActivityTimelineFilters({
  activityTypes,
  onFilterChange,
  selectedActivityTypes,
  selectedUserIds,
}: ActivityTimelineFiltersProps) {
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [localUserIds, setLocalUserIds] = useState<string[]>(selectedUserIds);
  const [localActivityTypes, setLocalActivityTypes] = useState<string[]>(
    selectedActivityTypes,
  );
  const [isOpen, setIsOpen] = useState(false);

  // Sync local state with parent props
  useEffect(() => {
    setLocalUserIds(selectedUserIds);
    setLocalActivityTypes(selectedActivityTypes);
  }, [selectedUserIds, selectedActivityTypes]);

  useEffect(() => {
    async function loadFamilyMembers() {
      try {
        const result = await getFamilyMembersAction();

        if (result?.data) {
          setFamilyMembers(result.data);
        }
      } catch (error) {
        console.error('Failed to load family members:', error);
      } finally {
        setLoading(false);
      }
    }

    loadFamilyMembers();
  }, []);

  const handleUserToggle = (userId: string) => {
    setLocalUserIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId],
    );
  };

  const handleActivityTypeToggle = (activityType: string) => {
    setLocalActivityTypes((prev) =>
      prev.includes(activityType)
        ? prev.filter((type) => type !== activityType)
        : [...prev, activityType],
    );
  };

  const handleApply = () => {
    onFilterChange(localUserIds, localActivityTypes);
    setIsOpen(false);
  };

  const handleClear = () => {
    setLocalUserIds([]);
    setLocalActivityTypes([]);
    onFilterChange([], []);
    setIsOpen(false);
  };

  const totalFilters = selectedUserIds.length + selectedActivityTypes.length;
  const isDesktop = useMediaQuery({ query: '(min-width: 768px)' });

  const filterContent = (
    <div className="flex flex-col gap-4">
      {totalFilters > 0 && (
        <div className="flex justify-end">
          <Button
            className="text-xs h-auto p-0"
            onClick={handleClear}
            variant="link"
          >
            Clear all
          </Button>
        </div>
      )}

      {/* Family Members Filter */}
      <div className="flex flex-col gap-3">
        <Label className="text-sm font-semibold">Family Members</Label>
        {loading ? (
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Icons.Spinner size="sm" />
            <span>Loading...</span>
          </div>
        ) : familyMembers.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No family members found
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {familyMembers.map((member) => (
              <div className="flex items-center gap-2" key={member.id}>
                <Checkbox
                  checked={localUserIds.includes(member.userId)}
                  id={`user-${member.userId}`}
                  onCheckedChange={() => handleUserToggle(member.userId)}
                />
                <Avatar className="size-6 shrink-0">
                  <AvatarImage
                    alt={member.name}
                    src={member.avatarUrl || undefined}
                  />
                  <AvatarFallback className="text-xs">
                    {member.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <Label
                  className="text-sm cursor-pointer flex-1"
                  htmlFor={`user-${member.userId}`}
                >
                  {member.name}
                  {member.isCurrentUser && (
                    <span className="text-muted-foreground ml-1">(You)</span>
                  )}
                </Label>
              </div>
            ))}
          </div>
        )}
      </div>

      <Separator />

      {/* Activity Types Filter */}
      <div className="flex flex-col gap-3">
        <Label className="text-sm font-semibold">Activity Types</Label>
        <div className="flex flex-col gap-2 max-h-60 overflow-y-auto">
          {activityTypes.map((activityType) => {
            const Icon = activityType.icon;
            return (
              <div className="flex items-center gap-2" key={activityType.id}>
                <Checkbox
                  checked={localActivityTypes.includes(activityType.id)}
                  id={`activity-${activityType.id}`}
                  onCheckedChange={() =>
                    handleActivityTypeToggle(activityType.id)
                  }
                />
                <Label
                  className="text-sm cursor-pointer flex-1 flex items-center gap-2"
                  htmlFor={`activity-${activityType.id}`}
                >
                  <div
                    className={`p-1.5 rounded-md ${activityType.color} shrink-0`}
                  >
                    <Icon className="size-3.5 text-white" />
                  </div>
                  <span className="capitalize">{activityType.label}</span>
                </Label>
              </div>
            );
          })}
        </div>
      </div>

      <Separator />

      {/* Actions */}
      <div className="flex gap-2">
        <Button
          className="flex-1"
          onClick={() => setIsOpen(false)}
          variant="outline"
        >
          Cancel
        </Button>
        <Button className="flex-1" onClick={handleApply}>
          Apply Filters
        </Button>
      </div>
    </div>
  );

  const triggerButton = (
    <div className="relative inline-flex">
      <Button className="size-8 p-0" size="sm" variant="ghost">
        <Filter className="size-4" />
      </Button>
      {totalFilters > 0 && (
        <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-5 h-5 px-1.5 text-[10px] font-bold rounded-full bg-primary text-primary-foreground border-2 border-background">
          {totalFilters}
        </span>
      )}
    </div>
  );

  if (isDesktop) {
    return (
      <Dialog onOpenChange={setIsOpen} open={isOpen}>
        <DialogTrigger asChild>{triggerButton}</DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Filter Activities</DialogTitle>
          </DialogHeader>
          {filterContent}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer onOpenChange={setIsOpen} open={isOpen}>
      <DrawerTrigger asChild>{triggerButton}</DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Filter Activities</DrawerTitle>
        </DrawerHeader>
        <div className="px-4 pb-4">{filterContent}</div>
      </DrawerContent>
    </Drawer>
  );
}
