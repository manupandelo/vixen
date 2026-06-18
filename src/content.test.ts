import { describe, it, expect } from "vitest";
import { content } from "./content";

describe("content", () => {
  it("exposes real contact facts", () => {
    expect(content.site.email).toBe("info@vixen.com.ar");
    expect(content.site.phoneDisplay).toBe("(011) 15 3773 0713");
    expect(content.site.address).toContain("Pilar");
    expect(content.site.whatsappNumber).toBe("5491137730713");
  });

  it("has the five primary nav links", () => {
    expect(content.nav.map((n) => n.href)).toEqual([
      "/futbol",
      "/padel",
      "/#eventos",
      "/#sede",
      "/#contacto",
    ]);
  });

  it("lists fútbol and pádel disciplines", () => {
    expect(content.disciplines.map((d) => d.id)).toEqual(["futbol", "padel"]);
  });
});
