import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { content } from "@/content";
import { WhatsAppButton } from "./WhatsAppButton";

describe("WhatsAppButton", () => {
  it("keeps the WhatsApp CTA label visible on mobile and offsets it for safe areas", () => {
    render(<WhatsAppButton />);

    const link = screen.getByRole("link", {
      name: /hablar con vixen club por whatsapp/i,
    });
    const actionLabel = within(link).getByText(/hablar con vixen/i);
    const labelGroup = actionLabel.parentElement;

    expect(link).toHaveAttribute("href", content.hero.primaryCta.href);
    expect(link).toHaveClass("bottom-[calc(env(safe-area-inset-bottom)+1.25rem)]");
    expect(link).toHaveClass("right-[calc(env(safe-area-inset-right)+1.25rem)]");
    expect(labelGroup).not.toBeNull();
    expect(labelGroup).not.toHaveClass("hidden");
    expect(actionLabel).not.toHaveClass("hidden");
    expect(within(link).getByText(/respuesta por whatsapp/i)).toHaveClass("hidden");
    expect(within(link).getByText(/respuesta por whatsapp/i)).toHaveClass("sm:block");
    expect(within(link).getByRole("img", { name: /whatsapp/i })).toHaveAttribute(
      "src",
      expect.stringContaining("whatsapp-color-svgrepo-com.svg"),
    );
  });
});
