import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Button } from "./Button";

describe("Button", () => {
  it("renders a link with the given href and label", () => {
    render(<Button href="/futbol">Inscribite</Button>);
    const link = screen.getByRole("link", { name: "Inscribite" });
    expect(link).toHaveAttribute("href", "/futbol");
  });

  it("applies the secondary variant class", () => {
    render(
      <Button href="#" variant="secondary">
        X
      </Button>,
    );
    expect(screen.getByRole("link", { name: "X" }).className).toContain("border");
  });
});
