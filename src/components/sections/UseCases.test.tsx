import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { content } from "@/content";
import { UseCases } from "./UseCases";

function getPanel(title: string) {
  const heading = screen.getByRole("heading", { level: 3, name: title });
  const panel = heading.closest("article");

  expect(panel).not.toBeNull();

  return panel as HTMLElement;
}

describe("UseCases", () => {
  it("uses the content-model conversion paths for fútbol and pádel", () => {
    render(<UseCases />);

    const futbolPanel = getPanel(content.useCases.futbol.title);
    expect(
      within(futbolPanel).getByRole("link", {
        name: content.useCases.futbol.cta.label,
      }),
    ).toHaveAttribute("href", content.useCases.futbol.cta.href);

    const padelPanel = getPanel(content.useCases.padel.title);
    expect(
      within(padelPanel).getByRole("link", {
        name: content.useCases.padel.primaryCta.label,
      }),
    ).toHaveAttribute("href", content.useCases.padel.primaryCta.href);
    expect(
      within(padelPanel).getByRole("link", {
        name: content.useCases.padel.secondaryCta.label,
      }),
    ).toHaveAttribute("href", content.useCases.padel.secondaryCta.href);
  });
});
