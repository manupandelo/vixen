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

  it("renders the hero facts as compact inline club proof points", () => {
    render(<Hero />);

    const heroSection = screen.getByRole("region", {
      name: /presentación del club/i,
    });

    for (const item of content.hero.proof) {
      expect(within(heroSection).getByText(item)).toBeInTheDocument();
    }
    expect(within(heroSection).queryByRole("list")).not.toBeInTheDocument();
  });

  it("uses an image-led hero with the shared green accent token", () => {
    render(<Hero />);

    const heroSection = screen.getByRole("region", { name: /presentación del club/i });
    const heroImage = within(heroSection).getByRole("img", {
      name: content.hero.image.alt,
    });

    expect(heroSection).toHaveClass(
      "relative",
      "min-h-[85vh]",
      "overflow-hidden",
    );
    expect(heroImage).toHaveAttribute("src", content.hero.image.src);
    expect(heroSection.innerHTML).toContain("text-[var(--color-accent)]");
    expect(heroSection.className).not.toContain("198,240,0");
  });

  it("composes the homepage main stack in the intended section order", () => {
    render(<HomePage />);

    const main = screen.getByRole("main");
    const mainChildren = Array.from(
      main.querySelectorAll<HTMLElement>(":scope > section"),
    );

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
        name: /fútbol 7 y pádel\./i,
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
      name: /fútbol 7 y pádel\./i,
    });
    const sedeRegion = screen.getByRole("region", { name: content.sede.title });
    expect(
      within(useCasesRegion).queryByRole("link", {
        name: content.useCases.futbol.cta.label,
      }),
    ).not.toBeInTheDocument();
    expect(
      within(useCasesRegion).getByRole("link", {
        name: content.useCases.padel.primaryCta.label,
      }),
    ).toHaveAttribute("href", content.useCases.padel.primaryCta.href);
    expect(
      within(useCasesRegion).queryByRole("link", {
        name: content.useCases.padel.secondaryCta.label,
      }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: content.tournaments.cta.label }),
    ).toHaveAttribute("href", content.tournaments.cta.href);
    expect(
      screen.queryByRole("link", { name: /consultar por un evento/i }),
    ).not.toBeInTheDocument();
    expect(
      within(sedeRegion).getByRole("link", { name: content.site.phoneDisplay }),
    ).toHaveAttribute("href", content.site.phoneHref);

    expect(
      screen.getByRole("region", { name: content.tournaments.title }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: content.eventos.title }),
    ).toBeInTheDocument();
    expect(sedeRegion).toBeInTheDocument();
  });
});
