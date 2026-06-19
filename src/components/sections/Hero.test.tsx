import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { content } from "@/content";
import { Hero } from "./Hero";

describe("Hero", () => {
  it("renders the hero title as the page h1 with the expected CTA semantics", () => {
    render(<Hero />);

    expect(
      screen.getByRole("heading", { level: 1, name: content.hero.title }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: content.hero.image.alt }),
    ).toHaveAttribute("src", content.hero.image.src);
    expect(
      screen.getByRole("link", { name: content.hero.primaryCta.label }),
    ).toHaveAttribute("href", content.hero.primaryCta.href);
    expect(
      screen.getByRole("link", { name: content.hero.secondaryCta.label }),
    ).toHaveAttribute("href", content.hero.secondaryCta.href);
  });

  it("renders the club facts line as a labeled list", () => {
    render(<Hero />);

    const proofList = screen.getByRole("list", { name: /datos del club/i });

    expect(proofList).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(content.hero.proof.length);
    for (const item of content.hero.proof) {
      expect(screen.getByText(item)).toBeInTheDocument();
    }
  });
});
