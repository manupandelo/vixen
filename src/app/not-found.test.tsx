import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import NotFound from "./not-found";

describe("global not found page", () => {
  it("renders the branded fallback for unmatched routes", () => {
    render(<NotFound />);

    expect(
      screen.getByRole("heading", {
        name: "No encontramos esta página",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Volver al inicio" }),
    ).toHaveAttribute("href", "/");

    const description = screen.getByText(/la dirección puede estar mal escrita/i);
    expect(description).toHaveClass("text-[1rem]/7");
    expect(description).not.toHaveClass("text-base/7");
  });
});
