import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { content } from "@/content";
import HomePage from "@/app/page";
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

  it("keeps the homepage composition focused on the hero and the four core sections", () => {
    render(<HomePage />);

    const main = screen.getByRole("main");

    expect(screen.queryByRole("banner")).not.toBeInTheDocument();
    expect(screen.queryByRole("contentinfo")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /escribinos por whatsapp/i }),
    ).not.toBeInTheDocument();
    expect(
      within(main).getByRole("heading", { level: 1, name: content.hero.title }),
    ).toBeInTheDocument();
    expect(
      within(main).getByRole("heading", {
        name: "Fútbol por WhatsApp. Pádel por ATC.",
      }),
    ).toBeInTheDocument();
    expect(
      within(main).getByRole("heading", { name: content.tournaments.title }),
    ).toBeInTheDocument();
    expect(
      within(main).getByRole("heading", { name: content.eventos.title }),
    ).toBeInTheDocument();
    expect(
      within(main).getByRole("heading", { name: content.sede.title }),
    ).toBeInTheDocument();
  });
});
