import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { content } from "@/content";

import PadelPage from "./page";

describe("PadelPage", () => {
  it("uses an asymmetric composition for the facility stories", () => {
    render(<PadelPage />);

    const [featured, ...supporting] = content.padel.facilities;
    const featuredPanel = screen
      .getByRole("heading", { name: featured.title })
      .closest("article");

    expect(featuredPanel).toHaveClass("lg:row-span-2");

    for (const facility of supporting) {
      expect(
        screen
          .getByRole("heading", { name: facility.title })
          .closest("article"),
      ).not.toHaveClass("lg:row-span-2");
    }
  });
});
