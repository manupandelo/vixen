import { describe, expect, it } from "vitest";

import nextConfig from "./next.config";

describe("next config", () => {
  it("pins Turbopack to the current app root for nested worktrees", () => {
    expect(nextConfig.turbopack?.root).toBe(process.cwd());
  });
});
