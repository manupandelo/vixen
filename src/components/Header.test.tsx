import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Header } from "./Header";

describe("Header", () => {
  it("opens and closes the mobile menu", async () => {
    const user = userEvent.setup();
    render(<Header />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /abrir menú/i }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /cerrar menú/i }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
