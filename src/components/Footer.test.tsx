import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Footer } from "./Footer";

describe("Footer", () => {
  it("renders the institutional footer without the closing CTA panel", () => {
    render(<Footer />);

    expect(
      screen.queryByText(/cerrá la visita con una acción clara/i),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /vixen club/i })).toHaveAttribute(
      "href",
      "/",
    );
    expect(screen.getByText(/las azucenas 3941/i)).toBeInTheDocument();

    const sponsors = screen.getByRole("list", { name: /sponsors/i });
    expect(within(sponsors).getByText(/puma/i)).toBeInTheDocument();

    expect(
      screen.getByRole("link", { name: /\(011\) 15 3773 0713/i }),
    ).toHaveAttribute("href", "tel:+5491137730713");
    expect(
      screen.getByRole("link", { name: /info@vixen\.com\.ar/i }),
    ).toHaveAttribute("href", "mailto:info@vixen.com.ar");

    const socials = screen.getByRole("navigation", { name: /redes sociales/i });
    expect(
      within(socials).getByRole("link", { name: /instagram/i }),
    ).toHaveAttribute("href", expect.stringContaining("instagram.com"));
    expect(
      within(socials).getByRole("link", { name: /facebook/i }),
    ).toHaveAttribute("href", expect.stringContaining("facebook.com"));
  });
});
