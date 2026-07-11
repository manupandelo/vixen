import "server-only";

import { createClient } from "@supabase/supabase-js";

import { getPublicSupabaseEnv } from "@/lib/env";

export function createSupabasePublicClient() {
  const { url, anonKey } = getPublicSupabaseEnv();

  return createClient(url, anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
