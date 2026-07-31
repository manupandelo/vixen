import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { content } from "@/content";

import { Sede } from "./Sede";

describe("Sede", () => {
  it("balances a venue image, access map and practical club information", () => {
    render(<Sede />);

    expect(
      screen.getByRole("img", {
        name: "Sector de canchas de fútbol en Vixen Club",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByTitle("Mapa de Vixen Club"),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("link", { name: content.site.phoneDisplay }),
    ).toHaveAttribute("href", content.site.phoneHref);

    for (const amenity of content.sede.amenities) {
      expect(screen.getByText(amenity)).toBeInTheDocument();
    }
  });
});
