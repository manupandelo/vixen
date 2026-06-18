import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SectionHeading } from "./SectionHeading";

describe("SectionHeading", () => {
  it("renders an h2 by default", () => {
    render(<SectionHeading title="Default Heading" />);
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(
      "Default Heading",
    );
  });

  it("renders an h1 when as='h1' is passed", () => {
    render(<SectionHeading title="Page Title" as="h1" />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Page Title",
    );
  });
});
