import { useSession } from '@clerk/nextjs';
import { debug } from '@nugget/logger';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { useEffect, useMemo, useState } from 'react';
import { env } from '../env.client';
import type { Database } from './types';

const log = debug('nugget:lib:supabase:client');

// Check if we're in local development
const isLocalDev =
  env.NEXT_PUBLIC_SUPABASE_URL.includes('localhost') ||
  env.NEXT_PUBLIC_SUPABASE_URL.includes('127.0.0.1');

export const useClient = () => {
  const { session } = useSession();
  const [token, setToken] = useState<string | null>(null);

  // Get token when session changes
  useEffect(() => {
    if (session) {
      session
        .getToken()
        .then((t) => {
          setToken(t);
          log('Clerk token updated');
        })
        .catch((error) => {
          console.error('Error getting Clerk token:', error);
          setToken(null);
        });
    } else {
      setToken(null);
    }
  }, [session]);

  const client = useMemo(() => {
    // For local development, we bypass JWT validation by using supabase-js directly
    // This avoids the RS256 validation error in @supabase/ssr
    const supabase = createSupabaseClient<Database>(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          detectSessionInUrl: false,
          persistSession: false,
        },
        global: {
          headers: token
            ? {
                Authorization: `Bearer ${token}`,
                // Tell Supabase this is a Clerk token
                'X-Clerk-Token': 'true',
              }
            : {},
        },
        realtime: {
          params: {
            eventsPerSecond: 10,
          },
        },
      },
    );

    if (isLocalDev && token) {
      log('Using Clerk token with local Supabase (bypass mode)');
    }

    return supabase;
  }, [token]);

  useEffect(() => {
    log('Connecting to realtime...');
    client.realtime.connect();

    return () => {
      log('Disconnecting from realtime...');
      client.realtime.disconnect();
    };
  }, [client]);

  return client;
};

export function createClient(props: { authToken?: string; url?: string }) {
  const { authToken, url } = props;
  if (!authToken) {
    log('Warning: No access token provided to createClient');
  }

  const supabaseUrl = url ?? env.NEXT_PUBLIC_SUPABASE_URL;

  log('Creating Supabase client with config:', {
    hasToken: !!authToken,
    url: supabaseUrl,
  });

  // Use supabase-js directly to bypass @supabase/ssr JWT validation
  const client = createSupabaseClient<Database>(
    supabaseUrl,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        detectSessionInUrl: false,
        persistSession: false,
      },
      global: {
        headers: authToken
          ? {
              Authorization: `Bearer ${authToken}`,
              'X-Clerk-Token': 'true',
            }
          : {},
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    },
  );

  log('Connecting to realtime...');
  client.realtime.connect();

  return client;
}
