import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Eventos } from "./Eventos";

describe("Eventos", () => {
  it("presents the Thursday promotion as an editorial club strip", () => {
    render(<Eventos />);

    const promotion = screen.getByRole("complementary", {
      name: "Promoción del tercer tiempo",
    });

    expect(promotion).toHaveTextContent("El tercer tiempo también se juega");
    expect(promotion).toHaveTextContent("2×1");
    expect(promotion).not.toHaveTextContent("🍻");
  });
});
