import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { content } from "@/content";
import { WhatsAppButton } from "./WhatsAppButton";

describe("WhatsAppButton", () => {
  it("links to WhatsApp and offsets the floating action for safe areas", () => {
    render(<WhatsAppButton />);

    const link = screen.getByRole("link", {
      name: /hablar con vixen club por whatsapp/i,
    });
    const actionLabel = within(link).getByText(/hablar con vixen/i);
    const labelGroup = actionLabel.parentElement;

    expect(link).toHaveAttribute(
      "href",
      `${content.site.whatsappUrl}?text=${encodeURIComponent(
        "Hola! Quiero más info sobre Vixen Club.",
      )}`,
    );
    expect(link).toHaveClass(
      "bottom-[calc(env(safe-area-inset-bottom)+0.85rem)]",
    );
    expect(link).toHaveClass(
      "right-[calc(env(safe-area-inset-right)+0.85rem)]",
    );
    expect(link).toHaveClass(
      "sm:bottom-[calc(env(safe-area-inset-bottom)+1.25rem)]",
    );
    expect(link).toHaveClass(
      "sm:right-[calc(env(safe-area-inset-right)+1.25rem)]",
    );
    expect(labelGroup).not.toBeNull();
    expect(labelGroup).toHaveClass("hidden");
    expect(labelGroup).toHaveClass("sm:flex");
    expect(actionLabel).not.toHaveClass("hidden");
    expect(within(link).getByText(/respuesta por whatsapp/i)).toHaveClass(
      "hidden",
    );
    expect(within(link).getByText(/respuesta por whatsapp/i)).toHaveClass(
      "sm:block",
    );
    expect(
      within(link).getByRole("img", { name: /whatsapp/i }),
    ).toHaveAttribute(
      "src",
      expect.stringContaining("whatsapp-color-svgrepo-com.svg"),
    );
  });
});
