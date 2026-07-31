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

    expect(screen.queryByRole("list", { name: /sponsors/i })).not.toBeInTheDocument();

    const socials = screen.getByRole("navigation", { name: /redes sociales y contacto/i });
    expect(
      within(socials).getByRole("link", { name: /email/i }),
    ).toHaveAttribute("href", "mailto:info@vixen.com.ar");
    expect(
      within(socials).getByRole("link", { name: /instagram/i }),
    ).toHaveAttribute("href", expect.stringContaining("instagram.com"));
    expect(
      within(socials).getByRole("link", { name: /facebook/i }),
    ).toHaveAttribute("href", expect.stringContaining("facebook.com"));

    const secondaryNav = screen.getByRole("navigation", {
      name: /navegación secundaria/i,
    });
    expect(
      within(secondaryNav).getByRole("link", { name: /fútbol/i }),
    ).toHaveAttribute("href", "/futbol");
  });
});
