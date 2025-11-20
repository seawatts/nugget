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
  DrawerFooter,
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
  const [initialized, setInitialized] = useState(false);

  // Initialize with all items selected if parent passes empty arrays
  const [localUserIds, setLocalUserIds] = useState<string[]>(selectedUserIds);
  const [localActivityTypes, setLocalActivityTypes] = useState<string[]>(
    selectedActivityTypes,
  );
  const [isOpen, setIsOpen] = useState(false);

  // Load family members
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

  // Initialize local state with all items selected if parent provides empty arrays
  useEffect(() => {
    if (
      !initialized &&
      !loading &&
      familyMembers.length > 0 &&
      activityTypes.length > 0
    ) {
      // If parent passes empty arrays (meaning "show all"), initialize with all items
      if (selectedUserIds.length === 0) {
        setLocalUserIds(familyMembers.map((m) => m.userId));
      }
      if (selectedActivityTypes.length === 0) {
        setLocalActivityTypes(activityTypes.map((t) => t.id));
      }
      setInitialized(true);
    }
  }, [
    initialized,
    loading,
    familyMembers,
    activityTypes,
    selectedUserIds,
    selectedActivityTypes,
  ]);

  // Sync local state with parent props (only after initialization)
  useEffect(() => {
    if (initialized) {
      // Only sync if parent has explicit values (not empty arrays)
      if (selectedUserIds.length > 0) setLocalUserIds(selectedUserIds);
      if (selectedActivityTypes.length > 0)
        setLocalActivityTypes(selectedActivityTypes);
    }
  }, [initialized, selectedUserIds, selectedActivityTypes]);

  const handleUserToggle = (userId: string) => {
    setLocalUserIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId],
    );
  };

  const handleSelectAllUsers = (checked: boolean) => {
    if (checked) {
      setLocalUserIds(familyMembers.map((member) => member.userId));
    } else {
      setLocalUserIds([]);
    }
  };

  const handleActivityTypeToggle = (activityType: string) => {
    setLocalActivityTypes((prev) =>
      prev.includes(activityType)
        ? prev.filter((type) => type !== activityType)
        : [...prev, activityType],
    );
  };

  const handleSelectAllActivityTypes = (checked: boolean) => {
    if (checked) {
      setLocalActivityTypes(activityTypes.map((type) => type.id));
    } else {
      setLocalActivityTypes([]);
    }
  };

  const handleApply = () => {
    onFilterChange(localUserIds, localActivityTypes);
    setIsOpen(false);
  };

  const handleReset = () => {
    const allUserIds = familyMembers.map((member) => member.userId);
    const allActivityTypes = activityTypes.map((type) => type.id);

    setLocalUserIds(allUserIds);
    setLocalActivityTypes(allActivityTypes);
    onFilterChange(allUserIds, allActivityTypes);
  };

  const isDesktop = useMediaQuery({ query: '(min-width: 768px)' });

  const allUsersSelected =
    familyMembers.length > 0 && localUserIds.length === familyMembers.length;
  const allActivityTypesSelected =
    localActivityTypes.length === activityTypes.length;

  // Calculate active filters (filters that are not showing all)
  const activeFilterCount = [
    familyMembers.length > 0 &&
      selectedUserIds.length > 0 &&
      selectedUserIds.length < familyMembers.length,
    selectedActivityTypes.length > 0 &&
      selectedActivityTypes.length < activityTypes.length,
  ].filter(Boolean).length;

  const filterScrollableContent = (
    <>
      <div className="flex justify-end">
        <Button
          className="text-xs h-auto p-0"
          onClick={handleReset}
          variant="link"
        >
          Reset
        </Button>
      </div>

      {/* Family Members Filter */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-semibold">Family Members</Label>
          {!loading && familyMembers.length > 0 && (
            <div className="flex items-center gap-2">
              <Checkbox
                checked={allUsersSelected}
                id="select-all-users"
                onCheckedChange={handleSelectAllUsers}
              />
              <Label
                className="text-xs text-muted-foreground cursor-pointer"
                htmlFor="select-all-users"
              >
                Select All
              </Label>
            </div>
          )}
        </div>
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
        <div className="flex items-center justify-between">
          <Label className="text-sm font-semibold">Activity Types</Label>
          <div className="flex items-center gap-2">
            <Checkbox
              checked={allActivityTypesSelected}
              id="select-all-activity-types"
              onCheckedChange={handleSelectAllActivityTypes}
            />
            <Label
              className="text-xs text-muted-foreground cursor-pointer"
              htmlFor="select-all-activity-types"
            >
              Select All
            </Label>
          </div>
        </div>
        <div className="flex flex-col gap-2">
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
    </>
  );

  const filterActions = (
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
  );

  const triggerButton = (
    <div className="relative inline-flex">
      <Button className="size-8 p-0" size="sm" variant="ghost">
        <Filter className="size-4" />
      </Button>
      {activeFilterCount > 0 && (
        <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-5 h-5 px-1.5 text-[10px] font-bold rounded-full bg-primary text-primary-foreground border-2 border-background">
          {activeFilterCount}
        </span>
      )}
    </div>
  );

  if (isDesktop) {
    return (
      <Dialog onOpenChange={setIsOpen} open={isOpen}>
        <DialogTrigger asChild>{triggerButton}</DialogTrigger>
        <DialogContent className="sm:max-w-[425px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Filter Timeline</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            {filterScrollableContent}
            <Separator />
            {filterActions}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer onOpenChange={setIsOpen} open={isOpen}>
      <DrawerTrigger asChild>{triggerButton}</DrawerTrigger>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader>
          <DrawerTitle>Filter Timeline</DrawerTitle>
        </DrawerHeader>
        <div className="px-4 flex-1 overflow-y-auto">
          <div className="flex flex-col gap-4 pb-4">
            {filterScrollableContent}
          </div>
        </div>
        <DrawerFooter className="pt-2 border-t">{filterActions}</DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
