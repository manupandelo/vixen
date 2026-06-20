import type { ReactNode } from "react";
import { content } from "@/content";
import { SectionShell } from "@/components/SectionShell";

function AmenityIcon({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-[var(--color-accent)]">
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="h-5 w-5"
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
  const mapHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    sede.mapQuery,
  )}`;
  const operationalFacts = [
    { label: "Dirección", value: sede.addressLabel },
    { label: "Teléfono", value: site.phoneDisplay },
  ] as const;

  return (
    <SectionShell id="sede" className="border-t border-white/5">
      <div
        role="region"
        aria-labelledby="sede-title"
        className="grid gap-10 lg:grid-cols-[0.88fr_1.12fr] lg:items-start lg:gap-12"
      >
        <div>
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-accent)]">
            Dónde estamos
          </p>
          <h2 id="sede-title" className="text-display-sm">
            {sede.title}
          </h2>
          <p className="mt-4 max-w-xl text-lg text-white/88">
            Predio operativo en Pilar, con acceso claro y los servicios
            puntuales para jugar cómodo y resolver la jornada sin salir del club.
          </p>

          <div className="mt-10">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-accent)]">
              Servicios útiles
            </p>
            <ul className="mt-5 grid gap-3 sm:grid-cols-2">
              {sede.amenities.map((amenity) => (
                <li
                  key={amenity}
                  className="list-none border border-white/8 bg-white/[0.02] px-4 py-4"
                >
                  <div className="flex items-start gap-3">
                    <AmenityIcon>{amenityGlyph(amenity)}</AmenityIcon>
                    <span className="pt-2 text-sm text-white/82">{amenity}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <dl className="mt-10 divide-y divide-white/10 border-y border-white/10">
            {operationalFacts.map((fact) => (
              <div
                key={fact.label}
                className="grid gap-2 py-4 sm:grid-cols-[9.5rem_1fr] sm:gap-4"
              >
                <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-accent)]">
                  {fact.label}
                </dt>
                <dd className="text-sm text-white/82">{fact.value}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3 text-sm">
            <a
              href={mapHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-md border border-white/12 bg-white/5 px-5 py-3 text-white transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-base)]"
            >
              Abrir en Google Maps
            </a>
            <a
              href={site.phoneHref}
              className="text-white/72 transition hover:text-[var(--color-accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-base)]"
            >
              {site.phoneDisplay}
            </a>
          </div>
        </div>

        <div className="space-y-4">
          <iframe
            title="Mapa de Vixen Club"
            src={mapSrc}
            loading="lazy"
            className="h-80 w-full rounded-[0.95rem] border border-white/8 bg-white/5 md:h-[34rem]"
          />
          <div className="flex flex-col gap-2 border-t border-white/10 pt-4 sm:flex-row sm:items-baseline sm:justify-between">
            <p className="text-sm text-white/82">{sede.addressLabel}</p>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-accent)]">
              Pilar · Buenos Aires
            </p>
          </div>
        </div>
      </div>
    </SectionShell>
  );
}
