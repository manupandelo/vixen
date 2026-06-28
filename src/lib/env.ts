import "server-only";

const PUBLIC_SUPABASE_PLACEHOLDERS = new Set([
  "https://example.supabase.co",
  "replace-with-anon-key",
]);

function assertValidSupabaseUrl(url: string) {
  try {
    const parsedUrl = new URL(url);

    if (
      parsedUrl.protocol !== "https:" ||
      !parsedUrl.hostname.endsWith(".supabase.co")
    ) {
      throw new Error();
    }
  } catch {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL must be a valid Supabase URL.");
  }
}

export function getPublicSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error("Missing public Supabase environment variables.");
  }

  if (
    PUBLIC_SUPABASE_PLACEHOLDERS.has(url) ||
    PUBLIC_SUPABASE_PLACEHOLDERS.has(anonKey)
  ) {
    throw new Error("Replace placeholder Supabase environment variables.");
  }

  assertValidSupabaseUrl(url);

  return { url, anonKey };
}

export function getSupabaseServiceRoleKey() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!key) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY.");
  }

  if (key === "replace-with-service-role-key") {
    throw new Error("Replace placeholder SUPABASE_SERVICE_ROLE_KEY.");
  }

  return key;
}
