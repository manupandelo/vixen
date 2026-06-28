import "server-only";

import { createClient } from "@supabase/supabase-js";

import {
  getPublicSupabaseEnv,
  getSupabaseServiceRoleKey,
} from "@/lib/env";

export function createSupabaseAdminClient() {
  const { url } = getPublicSupabaseEnv();
  const serviceRoleKey = getSupabaseServiceRoleKey();

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
