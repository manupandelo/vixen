import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import TournamentError from "./error";
import TournamentNotFound from "./not-found";

describe("tournament route states", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shows a recoverable message and retries a failed tournament load", () => {
    const retry = vi.fn();
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    render(
      <TournamentError
        error={new Error("Database unavailable")}
        unstable_retry={retry}
      />,
    );

    expect(
      screen.getByRole("heading", {
        name: "No pudimos cargar el torneo",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/volvé a intentarlo en unos minutos/i),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));

    expect(retry).toHaveBeenCalledOnce();
  });

  it("explains when a tournament page does not exist", () => {
    render(<TournamentNotFound />);

    expect(
      screen.getByRole("heading", {
        name: "Este torneo no está disponible",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Ver todos los torneos" }),
    ).toHaveAttribute("href", "/futbol/torneos");
    expect(
      screen.queryByRole("button", { name: "Reintentar" }),
    ).not.toBeInTheDocument();
  });
});
