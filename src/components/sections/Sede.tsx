import { content } from "@/content";
import { SectionShell } from "@/components/SectionShell";

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
    { label: "Reserva pádel", value: "ATC Sports" },
    { label: "Predio", value: "Fútbol 7 + pádel + espacio social" },
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
            Predio operativo para jugar, competir y organizar encuentros en
            Pilar, con acceso claro, servicios en cancha y espacio social para
            quedarse.
          </p>

          <dl className="mt-8 divide-y divide-white/10 border-y border-white/10">
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

          <div className="mt-8 flex flex-wrap gap-3 text-sm">
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
              className="inline-flex items-center justify-center rounded-md border border-white/12 bg-white/5 px-5 py-3 text-white transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-base)]"
            >
              {site.phoneDisplay}
            </a>
          </div>

          <div className="mt-8">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-accent)]">
              Servicios del predio
            </p>
            <ul className="mt-4 grid gap-x-6 gap-y-3 sm:grid-cols-2">
              {sede.amenities.map((amenity) => (
                <li
                  key={amenity}
                  className="list-none border-b border-white/8 pb-2 text-sm text-white/82"
                >
                  {amenity}
                </li>
              ))}
            </ul>
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
