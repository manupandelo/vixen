import type { ReactNode } from "react";
import Image from "next/image";
import { Button } from "@/components/Button";

import { content } from "@/content";
import { SectionShell } from "@/components/SectionShell";

function AmenityIcon({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <span className="flex h-5 w-5 shrink-0 items-center justify-center text-[var(--color-accent)]">
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="h-[1.1rem] w-[1.1rem]"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {children}
      </svg>
    </span>
  );
}

function amenityGlyph(label: (typeof content.sede.amenities)[number]) {
  switch (label) {
    case "Wi-Fi":
      return (
        <>
          <path d="M5 9.5a11 11 0 0 1 14 0" />
          <path d="M7.8 12.3a6.9 6.9 0 0 1 8.4 0" />
          <path d="M10.6 15.2a2.8 2.8 0 0 1 2.8 0" />
          <circle cx="12" cy="18" r="1" fill="currentColor" stroke="none" />
        </>
      );
    case "Vestuarios":
      return (
        <>
          <path d="M8 4.5h8v15H8Z" />
          <path d="M11 8h2" />
          <path d="M11 12h2" />
          <path d="M11 16h2" />
        </>
      );
    case "Estacionamiento":
      return (
        <>
          <path d="M8 19V5h5a3 3 0 0 1 0 6H8" />
          <path d="M8 11h5" />
        </>
      );
    case "Ayuda médica":
      return (
        <>
          <path d="M12 20s-6-3.8-6-9a3.4 3.4 0 0 1 6-2.2A3.4 3.4 0 0 1 18 11c0 5.2-6 9-6 9Z" />
          <path d="M12 9v4" />
          <path d="M10 11h4" />
        </>
      );
    default:
      return <circle cx="12" cy="12" r="5" />;
  }
}

export function Sede() {
  const { sede, site } = content;
  const mapSrc = `https://www.google.com/maps?q=${encodeURIComponent(
    sede.mapQuery,
  )}&output=embed`;

  return (
    <SectionShell
      id="sede"
      className="border-t border-white/5 bg-[var(--color-surface)] py-16 sm:py-24"
    >
      <section aria-labelledby="sede-title">
        {/* Full width Intro */}
        <header className="mb-10 sm:mb-14 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 lg:gap-12">
          <div className="max-w-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-accent)]">
              Alberti · Pilar
            </p>
            <h2 id="sede-title" className="mt-4 text-display-sm">
              {sede.title}
            </h2>
          </div>
          <p className="text-[1.1rem] leading-relaxed text-white/70 max-w-[55ch] lg:pb-1">
            {sede.body}
          </p>
        </header>

        {/* 2-Column Layout */}
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-14 lg:items-stretch">
          
          {/* Left Column: Photo */}
          <div className="relative w-full aspect-[4/3] lg:aspect-[5/4] overflow-hidden rounded-[1.25rem] border border-white/10 group order-2 lg:order-1 flex flex-col justify-end">
            <Image
              src="/canchas3.jpg"
              alt="Sector de canchas de fútbol en Vixen Club"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="absolute inset-0 object-cover object-[center_65%] saturate-[0.85] brightness-[0.85] transition-transform duration-1000 motion-safe:group-hover:scale-[1.03]"
            />
            {/* Soft gradient only for the small caption text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#090b0a]/80 via-transparent to-transparent pointer-events-none" />
            
            <div className="relative z-10 p-6 pointer-events-none">
              <span className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-white/90 drop-shadow-md">
                Canchas de Fútbol 7
              </span>
            </div>
          </div>

          {/* Right Column: Contact, Map, Amenities */}
          <div className="flex flex-col gap-8 order-3 lg:order-2">
            
            {/* Contact Data & CTA */}
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between border-l-2 border-[var(--color-accent)]/30 pl-5">
              <div className="flex gap-6 sm:gap-8 flex-col sm:flex-row lg:flex-col xl:flex-row xl:items-start">
                <div className="flex-1">
                  <p className="text-[0.65rem] uppercase tracking-[0.16em] text-white/40">
                    Dirección
                  </p>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(sede.mapQuery)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-block text-[0.95rem] font-medium text-white/90 hover:text-[var(--color-accent)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] leading-snug"
                  >
                    {sede.addressLabel}
                  </a>
                </div>
                
                <div className="flex-1">
                  <p className="text-[0.65rem] uppercase tracking-[0.16em] text-white/40">
                    Teléfono
                  </p>
                  <a
                    href={site.phoneHref}
                    className="mt-1 inline-block text-[0.95rem] font-medium text-white/90 hover:text-[var(--color-accent)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
                  >
                    {site.phoneDisplay}
                  </a>
                </div>
              </div>
              <Button
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(sede.mapQuery)}`}
                variant="secondary"
                className="w-full lg:w-auto shrink-0 h-12 px-6"
              >
                Cómo llegar
              </Button>
            </div>

            {/* Map */}
            <div className="editorial-panel relative flex flex-col overflow-hidden h-[260px] lg:flex-1 lg:min-h-0">
              <div className="bg-black/20 px-4 py-2 border-b border-white/5">
                <span className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-white/40">
                  Mapa de acceso
                </span>
              </div>
              <iframe
                title="Mapa de Vixen Club"
                src={mapSrc}
                sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox"
                referrerPolicy="no-referrer-when-downgrade"
                loading="lazy"
                className="flex-1 w-full grayscale invert-[0.92] hue-rotate-180 contrast-[1.05] opacity-80 transition-opacity hover:opacity-100"
              />
            </div>

            {/* Amenities */}
            <div className="border-t border-white/5 pt-6">
              <h3 className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-white/40 mb-5">
                Servicios en el predio
              </h3>
              <ul className="grid grid-cols-2 gap-y-5 gap-x-4">
              {sede.amenities.map((amenity) => (
                <li
                  key={amenity}
                  className="flex items-center gap-3"
                >
                  <AmenityIcon>{amenityGlyph(amenity)}</AmenityIcon>
                  <span className="text-[0.95rem] text-white/80">
                    {amenity}
                  </span>
                </li>
              ))}
              </ul>
            </div>

          </div>
        </div>
      </section>
    </SectionShell>
  );
}
