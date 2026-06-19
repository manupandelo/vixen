import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { content } from "@/content";
import { WhatsAppButton } from "./WhatsAppButton";

describe("WhatsAppButton", () => {
  it("renders the floating WhatsApp CTA with branded iconography", () => {
    render(<WhatsAppButton />);

    const link = screen.getByRole("link", { name: /escribinos por whatsapp/i });

    expect(link).toHaveAttribute("href", content.hero.primaryCta.href);
    expect(within(link).getByText("Vixen Club")).toBeInTheDocument();
    expect(within(link).getByTitle("WhatsApp")).toBeInTheDocument();
  });
});
