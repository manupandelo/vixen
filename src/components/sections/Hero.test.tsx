import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { content } from "@/content";
import { Hero } from "./Hero";

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
    const mainChildren = Array.from(main.querySelectorAll(":scope > section"));

    expect(mainChildren).toHaveLength(5);
    expect(
      within(mainChildren[0]).getByRole("heading", {
        level: 1,
        name: content.hero.title,
      }),
    ).toBeInTheDocument();
    expect(
      within(mainChildren[1]).getByRole("heading", {
        level: 2,
        name: /fútbol por whatsapp\. pádel por atc\./i,
      }),
    ).toBeInTheDocument();
    expect(
      within(mainChildren[2]).getByRole("heading", {
        level: 2,
        name: content.tournaments.title,
      }),
    ).toBeInTheDocument();
    expect(
      within(mainChildren[3]).getByRole("heading", {
        level: 2,
        name: content.eventos.title,
      }),
    ).toBeInTheDocument();
    expect(
      within(mainChildren[4]).getByRole("heading", {
        level: 2,
        name: content.sede.title,
      }),
    ).toBeInTheDocument();
  });

  it("keeps the mid-page homepage stack wired to content-owned conversion links", () => {
    render(<HomePage />);

    const useCasesRegion = screen.getByRole("region", {
      name: /fútbol por whatsapp\. pádel por atc\./i,
    });
    expect(
      within(useCasesRegion).getByRole("link", {
        name: content.useCases.futbol.cta.label,
      }),
    ).toHaveAttribute("href", content.useCases.futbol.cta.href);
    expect(
      within(useCasesRegion).getByRole("link", {
        name: content.useCases.padel.primaryCta.label,
      }),
    ).toHaveAttribute("href", content.useCases.padel.primaryCta.href);
    expect(
      screen.getByRole("link", { name: content.tournaments.cta.label }),
    ).toHaveAttribute("href", content.tournaments.cta.href);
    expect(
      screen.getByRole("link", { name: content.eventos.cta.label }),
    ).toHaveAttribute("href", content.eventos.cta.href);
    expect(
      screen.getByRole("link", { name: content.site.phoneDisplay }),
    ).toHaveAttribute("href", content.site.phoneHref);

    expect(
      screen.getByRole("region", { name: content.tournaments.title }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: content.eventos.title }),
    ).toBeInTheDocument();
    expect(screen.getByRole("region", { name: content.sede.title })).toBeInTheDocument();
  });
});
