import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { content } from "@/content";
import { Hero } from "./Hero";

vi.mock("@/components/sections/UseCases", () => ({
  UseCases: () => <section aria-label="UseCases section" data-testid="use-cases-section" />,
}));

vi.mock("@/components/sections/Tournaments", () => ({
  Tournaments: () => (
    <section aria-label="Tournaments section" data-testid="tournaments-section" />
  ),
}));

vi.mock("@/components/sections/Eventos", () => ({
  Eventos: () => <section aria-label="Eventos section" data-testid="eventos-section" />,
}));

vi.mock("@/components/sections/Sede", () => ({
  Sede: () => <section aria-label="Sede section" data-testid="sede-section" />,
}));

import HomePage from "@/app/page";

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

  it("renders the club facts line inside the hero with a visible Datos del club label", () => {
    render(<Hero />);

    const heroSection = screen.getByRole("region", { name: /presentación del club/i });
    const proofList = screen.getByRole("list", { name: /datos del club/i });

    expect(within(heroSection).getByText("Datos del club")).toBeInTheDocument();
    expect(within(heroSection).getByRole("list", { name: /datos del club/i })).toBe(proofList);
    expect(screen.getAllByRole("listitem")).toHaveLength(content.hero.proof.length);
    for (const item of content.hero.proof) {
      expect(screen.getByText(item)).toBeInTheDocument();
    }
  });

  it("uses the shared green brand tokens in the hero background treatment", () => {
    render(<Hero />);

    const heroSection = screen.getByRole("region", { name: /presentación del club/i });

    expect(heroSection).toHaveClass(
      "bg-[radial-gradient(circle_at_top,color-mix(in_srgb,var(--color-accent)_18%,transparent),transparent_34%),linear-gradient(180deg,var(--color-surface-2),var(--color-base)_42%)]",
    );
    expect(heroSection.className).not.toContain("198,240,0");
  });

  it("composes the homepage main stack in the intended section order", () => {
    render(<HomePage />);

    const main = screen.getByRole("main");
    const mainChildren = Array.from(main.children);

    expect(mainChildren).toHaveLength(5);
    expect(mainChildren.map((child) => child.getAttribute("aria-label"))).toEqual([
      "Presentación del club",
      "UseCases section",
      "Tournaments section",
      "Eventos section",
      "Sede section",
    ]);
  });
});
