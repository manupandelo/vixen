import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { content } from "@/content";
import { TrustBand } from "./TrustBand";

describe("TrustBand", () => {
  it("renders an accessible trust section with list semantics", () => {
    render(<TrustBand />);

    const region = screen.getByRole("region", {
      name: "Pruebas de confianza",
    });
    const list = within(region).getByRole("list");
    const items = within(list).getAllByRole("listitem");

    expect(items).toHaveLength(content.trustPills.length);
    expect(items.map((item) => item.textContent)).toEqual([
      ...content.trustPills,
    ]);
  });
});
