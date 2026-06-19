import { render, screen } from "@testing-library/react";
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
    expect(screen.getByText(/sponsors/i)).toBeInTheDocument();
    expect(screen.getByText(/puma/i)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /\(011\) 15 3773 0713/i }),
    ).toBeInTheDocument();
  });
});
