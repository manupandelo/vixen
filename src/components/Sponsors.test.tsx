import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Sponsors } from "./Sponsors";

describe("Sponsors", () => {
  it("shows the official sponsor logos in the club brand strip", () => {
    render(<Sponsors />);

    const expectedLogos = [
      ["PUMA", "puma.png"],
      ["Heineken", "heineken.png"],
      ["Fernet Branca", "branca.png"],
      ["Prestigio", "prestigio.png"],
    ];

    for (const [name, file] of expectedLogos) {
      expect(screen.getByRole("img", { name })).toHaveAttribute(
        "src",
        expect.stringContaining(file),
      );
    }
  });
});
