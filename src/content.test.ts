import { describe, it, expect } from "vitest";
import { content } from "./content";

describe("content", () => {
  it("exposes real contact facts", () => {
    expect(content.site.email).toBe("info@vixen.com.ar");
    expect(content.site.phoneDisplay).toBe("(011) 15 3773 0713");
    expect(content.site.address).toContain("Pilar");
    expect(content.site.whatsappNumber).toBe("5491137730713");
    expect(content.site.sponsors).toContain("PUMA");
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

  it("exposes the ATC reservation URL for pádel", () => {
    expect(content.site.padelReservationUrl).toBe(
      "https://atcsports.io/venues/vixen-club-gba",
    );
  });

  it("exposes the base WhatsApp URL once in the content model", () => {
    expect(content.site.whatsappUrl).toBe(
      `https://wa.me/${content.site.whatsappNumber}`,
    );
  });

  it("defines a real hero image and trust-first CTAs", () => {
    expect(content.hero.image).toEqual({
      src: "/vixen1.jpg",
      alt: "Vista general del predio de Vixen Club con canchas y sector social",
    });
    expect(content.hero.primaryCta.href).toContain(content.site.whatsappUrl);
    expect(content.hero.secondaryCta.href).toBe(content.site.padelReservationUrl);
    expect(content.hero.proof).toEqual([
      "Pilar / Del Viso",
      "Pádel en ATC",
      "Fútbol 7",
      "Torneos y eventos",
    ]);
  });

  it("adds trust pills and separates fútbol and pádel conversion paths", () => {
    expect(content.trustPills).toContain("Reservas en ATC");
    expect(content.useCases.futbol.cta.href).toContain(content.site.whatsappUrl);
    expect(content.useCases.padel.primaryCta.href).toBe(
      content.site.padelReservationUrl,
    );
  });

  it("includes tournaments and richer venue amenities for later sections", () => {
    expect(content.tournaments.image.src).toBe("/copas_trofeos.jpg");
    expect(content.tournaments.cta.href).toContain(content.site.whatsappUrl);
    expect(content.sede.amenities).toEqual(
      expect.arrayContaining([
        "Wi-Fi",
        "Vestuario",
        "Estacionamiento",
        "Ayuda médica",
        "Torneos",
        "Cumpleaños",
        "Bar / Restaurante",
        "Quincho",
      ]),
    );
  });

  it("reuses site-level CTA URLs across home conversion entry points", () => {
    expect(content.hero.primaryCta.href).toContain(content.site.whatsappUrl);
    expect(content.useCases.futbol.cta.href).toContain(content.site.whatsappUrl);
    expect(content.tournaments.cta.href).toContain(content.site.whatsappUrl);
    expect(content.hero.secondaryCta.href).toBe(content.site.padelReservationUrl);
    expect(content.useCases.padel.primaryCta.href).toBe(
      content.site.padelReservationUrl,
    );
  });
});
