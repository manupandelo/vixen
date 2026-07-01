import { describe, it, expect } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { content } from "@/content";
import { Header } from "./Header";

describe("Header", () => {
  it("shows Instagram and Facebook as the header quick actions", () => {
    render(<Header />);

    expect(
      screen.getByRole("link", { name: /instagram/i }),
    ).toHaveAttribute("href", content.site.instagram);
    expect(
      screen.getByRole("link", { name: /facebook/i }),
    ).toHaveAttribute("href", content.site.facebook);
    expect(screen.queryByRole("link", { name: /whatsapp/i })).not.toBeInTheDocument();
  });

  it("keeps the navigation and social actions in separate groups", () => {
    render(<Header />);

    const navigation = screen.getByRole("navigation", { name: /principal/i });
    const socialNavigation = screen.getByRole("navigation", {
      name: /redes sociales/i,
    });

    expect(within(navigation).queryByRole("link", { name: /instagram/i })).not.toBeInTheDocument();
    expect(
      within(socialNavigation).getByRole("link", { name: /instagram/i }),
    ).toHaveAttribute("href", content.site.instagram);
    expect(
      within(socialNavigation).getByRole("link", { name: /facebook/i }),
    ).toHaveAttribute("href", content.site.facebook);
  });

  it("keeps the mobile menu active until large screens to avoid tablet crowding", () => {
    render(<Header />);

    const navigation = screen.getByRole("navigation", { name: /principal/i });
    const socialNavigation = screen.getByRole("navigation", {
      name: /redes sociales/i,
    });
    const toggle = screen.getByRole("button", { name: /abrir menú/i });

    expect(navigation).toHaveClass("hidden");
    expect(navigation).toHaveClass("lg:flex");
    expect(socialNavigation).toHaveClass("hidden");
    expect(socialNavigation).toHaveClass("lg:flex");
    expect(toggle).toHaveClass("lg:hidden");
  });

  it("renders the logo as the home link label for Vixen Club", () => {
    render(<Header />);

    expect(screen.getByRole("link", { name: /vixen club/i })).toHaveAttribute(
      "href",
      "/",
    );
  });

  it("opens and closes the mobile menu", async () => {
    const user = userEvent.setup();
    render(<Header />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /abrir menú/i }));
    const dialog = screen.getByRole("dialog", { name: /menú principal/i });
    expect(dialog).toBeInTheDocument();
    expect(dialog.tagName).toBe("DIALOG");

    await user.click(screen.getByRole("button", { name: /cerrar menú/i }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("uses native dialog semantics for the mobile menu", async () => {
    const user = userEvent.setup();
    render(<Header />);

    await user.click(screen.getByRole("button", { name: /abrir menú/i }));
    const dialog = screen.getByRole("dialog", { name: /menú principal/i });
    const dialogScope = within(dialog);
    const closeButton = dialogScope.getByRole("button", { name: /cerrar menú/i });

    expect(dialog.tagName).toBe("DIALOG");
    expect(dialog).toHaveAttribute("open");
    expect(closeButton).toHaveFocus();
  });

  it("hamburger button reflects aria-expanded state", async () => {
    const user = userEvent.setup();
    render(<Header />);
    const toggle = screen.getByRole("button", { name: /abrir menú/i });

    expect(toggle).toHaveAttribute("aria-expanded", "false");

    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
  });

  it("syncs state when the native dialog closes", async () => {
    const user = userEvent.setup();
    render(<Header />);
    const toggle = screen.getByRole("button", { name: /abrir menú/i });

    await user.click(toggle);
    const dialog = screen.getByRole("dialog");

    fireEvent(dialog, new Event("close"));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(toggle).toHaveFocus();
  });
});
