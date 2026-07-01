import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AdminActionItemList } from "./AdminUI";

describe("AdminActionItemList", () => {
  it("renders actionable pending items with the shared admin pattern", () => {
    render(
      <AdminActionItemList
        items={[
          {
            title: "Completar equipos",
            description: "El torneo necesita al menos dos equipos.",
            href: "/admin/torneos/tournament-1?tab=equipos",
            tone: "warning",
          },
        ]}
      />,
    );

    const item = screen.getByTestId("admin-action-item");

    expect(item).toHaveAttribute(
      "href",
      "/admin/torneos/tournament-1?tab=equipos",
    );
    expect(item.className).toContain("rounded-[0.95rem]");
    expect(screen.getByText("Completar equipos")).toBeInTheDocument();
    expect(
      screen.getByText("El torneo necesita al menos dos equipos."),
    ).toBeInTheDocument();
  });
});
