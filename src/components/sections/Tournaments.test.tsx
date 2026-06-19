import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { content } from "@/content";
import { Tournaments } from "./Tournaments";

describe("Tournaments", () => {
  it("uses the tournament trophy image from the content model", () => {
    render(<Tournaments />);

    expect(
      screen.getByRole("img", { name: content.tournaments.image.alt }),
    ).toHaveAttribute("src", content.tournaments.image.src);
  });
});
