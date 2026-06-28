import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getPublicSupabaseEnv, getSupabaseServiceRoleKey } from "./env";

const ORIGINAL_ENV = process.env;

describe("Supabase env helpers", () => {
  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
  });

  it("returns validated public Supabase env values", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://project.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";

    expect(getPublicSupabaseEnv()).toEqual({
      url: "https://project.supabase.co",
      anonKey: "anon-key",
    });
  });

  it("rejects copied public placeholder values", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "replace-with-anon-key";

    expect(() => getPublicSupabaseEnv()).toThrow(
      "Replace placeholder Supabase environment variables.",
    );
  });

  it("rejects malformed public Supabase URLs", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "not-a-url";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";

    expect(() => getPublicSupabaseEnv()).toThrow(
      "NEXT_PUBLIC_SUPABASE_URL must be a valid Supabase URL.",
    );
  });

  it("returns the service role key when configured", () => {
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key";

    expect(getSupabaseServiceRoleKey()).toBe("service-role-key");
  });

  it("rejects the copied service role placeholder value", () => {
    process.env.SUPABASE_SERVICE_ROLE_KEY = "replace-with-service-role-key";

    expect(() => getSupabaseServiceRoleKey()).toThrow(
      "Replace placeholder SUPABASE_SERVICE_ROLE_KEY.",
    );
  });
});
