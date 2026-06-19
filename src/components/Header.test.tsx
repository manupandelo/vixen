import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { content } from "@/content";
import { Header } from "./Header";

describe("Header", () => {
  it("shows WhatsApp as the only header CTA", () => {
    render(<Header />);

    expect(
      screen.getByRole("link", { name: /whatsapp/i }),
    ).toHaveAttribute("href", content.hero.primaryCta.href);
    expect(
      screen.queryByRole("link", { name: /reservá pádel/i }),
    ).not.toBeInTheDocument();
  });

  it("keeps the navigation and WhatsApp contact action in separate groups", () => {
    render(<Header />);

    const navigation = screen.getByRole("navigation", { name: /principal/i });
    const contactGroup = screen.getByRole("group", { name: /contacto rápido/i });

    expect(within(navigation).queryByRole("link", { name: /whatsapp/i })).not.toBeInTheDocument();
    expect(
      within(contactGroup).getByRole("link", { name: /whatsapp/i }),
    ).toHaveAttribute("href", content.hero.primaryCta.href);
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
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /cerrar menú/i }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("traps keyboard focus inside the mobile dialog", async () => {
    const user = userEvent.setup();
    render(<Header />);

    await user.click(screen.getByRole("button", { name: /abrir menú/i }));
    const dialog = screen.getByRole("dialog", { name: /menú principal/i });
    const dialogScope = within(dialog);
    const closeButton = dialogScope.getByRole("button", { name: /cerrar menú/i });
    const logoLink = dialogScope.getByRole("link", { name: /vixen club/i });
    const lastAction = dialogScope.getByRole("link", { name: /whatsapp/i });

    expect(closeButton).toHaveFocus();

    await user.keyboard("{Shift>}{Tab}{/Shift}");
    expect(logoLink).toHaveFocus();

    await user.keyboard("{Shift>}{Tab}{/Shift}");
    expect(lastAction).toHaveFocus();

    await user.tab();
    expect(logoLink).toHaveFocus();
  });

  it("hamburger button reflects aria-expanded state", async () => {
    const user = userEvent.setup();
    render(<Header />);
    const toggle = screen.getByRole("button", { name: /abrir menú/i });

    expect(toggle).toHaveAttribute("aria-expanded", "false");

    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
  });

  it("closes the mobile menu when Escape is pressed", async () => {
    const user = userEvent.setup();
    render(<Header />);
    const toggle = screen.getByRole("button", { name: /abrir menú/i });

    await user.click(toggle);
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(toggle).toHaveFocus();
  });
});
