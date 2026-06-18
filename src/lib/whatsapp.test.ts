import { describe, it, expect } from "vitest";
import { buildWhatsAppUrl } from "./whatsapp";

describe("buildWhatsAppUrl", () => {
  it("returns base wa.me link with no message", () => {
    expect(buildWhatsAppUrl()).toBe("https://wa.me/5491137730713");
  });

  it("appends URL-encoded message text", () => {
    expect(buildWhatsAppUrl("Hola, quiero reservar")).toBe(
      "https://wa.me/5491137730713?text=Hola%2C%20quiero%20reservar",
    );
  });
});
