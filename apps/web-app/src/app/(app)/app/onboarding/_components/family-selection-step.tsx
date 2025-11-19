'use client';

import type { OrganizationMembershipResource } from '@clerk/types';
import { Icons } from '@nugget/ui/custom/icons';
import { H2, P } from '@nugget/ui/custom/typography';
import { Crown, Heart, Plus, Shield } from 'lucide-react';

interface FamilySelectionStepProps {
  families: OrganizationMembershipResource[];
  selectedFamilyId: string | null;
  onSelect: (familyId: string) => void;
}

const CREATE_NEW_FAMILY_ID = '__create_new_family__';

const roleIcons = {
  admin: Crown,
  basic_member: Heart,
  caregiver: Shield,
};

const roleLabels = {
  admin: 'Primary',
  basic_member: 'Member',
  caregiver: 'Caregiver',
};

const roleColors = {
  admin: 'text-primary',
  basic_member: 'text-accent',
  caregiver: 'text-secondary',
};

export function FamilySelectionStep({
  families,
  onSelect,
  selectedFamilyId,
}: FamilySelectionStepProps) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <H2>Select Your Family</H2>
        <P className="text-muted-foreground">
          You're a member of multiple families. Choose an existing family or
          create a new one to continue.
        </P>
      </div>

      <div className="space-y-3">
        {families.map((membership) => {
          const isSelected = selectedFamilyId === membership.organization.id;
          const RoleIcon =
            roleIcons[membership.role as keyof typeof roleIcons] || Heart;
          const roleLabel =
            roleLabels[membership.role as keyof typeof roleLabels] || 'Member';
          const roleColor =
            roleColors[membership.role as keyof typeof roleColors] ||
            'text-accent';

          return (
            <button
              className={`w-full p-6 rounded-2xl border-2 transition-all text-left ${
                isSelected
                  ? 'border-primary bg-primary/5'
                  : 'border-border bg-card hover:border-primary/50'
              }`}
              key={membership.id}
              onClick={() => onSelect(membership.organization.id)}
              type="button"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3">
                    <div
                      className={`size-10 rounded-full flex items-center justify-center ${
                        isSelected ? 'bg-primary/20' : 'bg-muted'
                      }`}
                    >
                      <Icons.UsersRound
                        className={isSelected ? 'text-primary' : undefined}
                        size="sm"
                      />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">
                        {membership.organization.name}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <RoleIcon className={`size-3 ${roleColor}`} />
                        <span className="text-xs text-muted-foreground">
                          {roleLabel}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {isSelected && (
                  <div className="flex-shrink-0">
                    <div className="size-6 rounded-full bg-primary flex items-center justify-center">
                      <Icons.Check
                        className="text-primary-foreground"
                        size="xs"
                      />
                    </div>
                  </div>
                )}
              </div>
            </button>
          );
        })}

        {/* Create New Family Option */}
        <button
          className={`w-full p-6 rounded-2xl border-2 transition-all text-left ${
            selectedFamilyId === CREATE_NEW_FAMILY_ID
              ? 'border-primary bg-primary/5'
              : 'border-border border-dashed bg-card hover:border-primary/50'
          }`}
          onClick={() => onSelect(CREATE_NEW_FAMILY_ID)}
          type="button"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-3">
                <div
                  className={`size-10 rounded-full flex items-center justify-center ${
                    selectedFamilyId === CREATE_NEW_FAMILY_ID
                      ? 'bg-primary/20'
                      : 'bg-muted'
                  }`}
                >
                  <Plus
                    className={
                      selectedFamilyId === CREATE_NEW_FAMILY_ID
                        ? 'text-primary'
                        : 'text-muted-foreground'
                    }
                    size={20}
                  />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">
                    Create New Family
                  </h3>
                  <span className="text-xs text-muted-foreground">
                    Start fresh with a new family profile
                  </span>
                </div>
              </div>
            </div>

            {selectedFamilyId === CREATE_NEW_FAMILY_ID && (
              <div className="flex-shrink-0">
                <div className="size-6 rounded-full bg-primary flex items-center justify-center">
                  <Icons.Check className="text-primary-foreground" size="xs" />
                </div>
              </div>
            )}
          </div>
        </button>
      </div>
    </div>
  );
}

export { CREATE_NEW_FAMILY_ID };
