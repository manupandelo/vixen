import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ImagePlaceholder } from "./ImagePlaceholder";

describe("ImagePlaceholder", () => {
  it("uses a native image element with accessible alt text", () => {
    render(<ImagePlaceholder label="Fútbol 7" />);

    const image = screen.getByRole("img", { name: "Fútbol 7" });

    expect(image.tagName).toBe("IMG");
    expect(image).toHaveAttribute("alt", "Fútbol 7");
  });
});
