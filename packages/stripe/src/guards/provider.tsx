'use client';

import { useOrganization } from '@clerk/nextjs';
import { api } from '@nugget/api/react';
import { createContext, type ReactNode, useContext } from 'react';
import type { EntitlementKey, EntitlementsRecord } from './entitlement-types';

// Combined context type
interface StripeContextType {
  // Subscription info
  subscriptionInfo: {
    status: string | null;
    customerId: string | null;
    isActive: boolean;
    isPastDue: boolean;
    isCanceled: boolean;
    isTrialing: boolean;
    isPaid: boolean;
    hasAny: boolean;
  };
  // Entitlements info
  entitlements: EntitlementsRecord;
  loading: boolean;
  checkEntitlement: (entitlement: EntitlementKey) => boolean;
}

export const StripeContext = createContext<StripeContextType | undefined>(
  undefined,
);

// Provider component
interface StripeProviderProps {
  children: ReactNode;
}

export function StripeProvider({ children }: StripeProviderProps) {
  const { organization } = useOrganization();

  // Use tRPC queries for subscription info and entitlements
  const { data: subscriptionData, isLoading: subscriptionLoading } =
    api.billing.getSubscriptionInfo.useQuery(undefined, {
      enabled: !!organization,
    });

  const { data: entitlementsData, isLoading: entitlementsLoading } =
    api.billing.getEntitlements.useQuery(undefined, {
      enabled: !!organization,
    });

  const loading = subscriptionLoading || entitlementsLoading;

  const subscriptionInfo = subscriptionData?.subscriptionInfo || {
    customerId: null,
    hasAny: false,
    isActive: false,
    isCanceled: false,
    isPaid: false,
    isPastDue: false,
    isTrialing: false,
    status: null,
  };

  const entitlements: EntitlementsRecord = (entitlementsData?.entitlements ||
    {}) as EntitlementsRecord;

  const checkEntitlement = (entitlement: EntitlementKey): boolean => {
    return entitlements[entitlement] || false;
  };

  return (
    <StripeContext.Provider
      value={{
        checkEntitlement,
        entitlements,
        loading,
        subscriptionInfo,
      }}
    >
      {children}
    </StripeContext.Provider>
  );
}

// Hook to use the Stripe context
export function useStripe() {
  const context = useContext(StripeContext);
  if (context === undefined) {
    throw new Error('useStripe must be used within a StripeProvider');
  }
  return context;
}
