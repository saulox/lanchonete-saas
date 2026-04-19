'use client';

import { createBrowserClient } from '@supabase/ssr';
import { Database } from '@/types/database';
import { getSupabasePublishableKey } from './env';

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    getSupabasePublishableKey()
  );
}
