import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { content } from "@/content";
import { Hero } from "./Hero";

describe("Hero", () => {
  it("renders both CTAs with hrefs from the content model", () => {
    render(<Hero />);

    expect(
      screen.getByRole("link", { name: content.hero.primaryCta.label }),
    ).toHaveAttribute("href", content.hero.primaryCta.href);
    expect(
      screen.getByRole("link", { name: content.hero.secondaryCta.label }),
    ).toHaveAttribute("href", content.hero.secondaryCta.href);
  });
});
