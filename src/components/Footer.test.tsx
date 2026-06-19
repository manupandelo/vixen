import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { content } from "@/content";
import { Footer } from "./Footer";

describe("Footer", () => {
  it("repeats WhatsApp and ATC actions", () => {
    render(<Footer />);

    expect(
      screen.getByRole("link", { name: /reservá pádel en atc/i }),
    ).toHaveAttribute("href", content.site.padelReservationUrl);
    expect(screen.getByRole("link", { name: /whatsapp/i })).toHaveAttribute(
      "href",
      content.hero.primaryCta.href,
    );
    expect(
      screen.getByRole("link", { name: /\(011\) 15 3773 0713/i }),
    ).toBeInTheDocument();
  });
});
