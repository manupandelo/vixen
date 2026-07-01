import { act } from "react";
import { createRoot } from "react-dom/client";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AdminToastProvider } from "./AdminToast";

describe("AdminToastProvider", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    window.history.replaceState(null, "", "/");
  });

  it("does not server-render the Sonner live region before hydration", () => {
    const html = renderToString(
      <AdminToastProvider>
        <main>Panel privado</main>
      </AdminToastProvider>,
    );

    expect(html).toContain("Panel privado");
    expect(html).toContain("data-admin-toast-region");
    expect(html).not.toContain("Notifications alt+T");
    expect(html).not.toContain("data-sonner-toaster");
  });

  it("hydrates without injecting the default Sonner viewport first", async () => {
    window.history.replaceState(null, "", "/admin?notice=tournament-created");
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    const html = renderToString(
      <AdminToastProvider>
        <main>Panel privado</main>
      </AdminToastProvider>,
    );
    const container = document.createElement("div");
    container.innerHTML = html;
    document.body.append(container);

    await act(async () => {
      hydrateRoot(
        container,
        <AdminToastProvider>
          <main>Panel privado</main>
        </AdminToastProvider>,
      );
      await new Promise((resolve) => window.setTimeout(resolve, 0));
    });

    expect(
      consoleError.mock.calls.some((call) =>
        String(call[0]).includes("Hydration failed"),
      ),
    ).toBe(false);
    expect(
      document.querySelector('[class*="bottom-4"][class*="right-4"]'),
    ).toBeNull();

    container.remove();
  });

  it("does not render Sonner on the first client pass", async () => {
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(
        <AdminToastProvider>
          <main>Panel privado</main>
        </AdminToastProvider>,
      );
    });

    expect(container).toHaveTextContent("Panel privado");
    expect(container.querySelector("[data-sonner-toaster]")).toBeNull();

    root.unmount();
    container.remove();
  });
});
