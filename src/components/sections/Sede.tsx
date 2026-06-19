import { content } from "@/content";
import { SectionShell } from "@/components/SectionShell";
import { SectionHeading } from "@/components/SectionHeading";

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
      <div className="grid gap-10 md:grid-cols-[0.95fr_1.05fr]">
        <div>
          <SectionHeading kicker="Dónde estamos" title={sede.title} />
          <p className="mt-4 max-w-xl text-lg text-white/88">
            Predio operativo para jugar, competir y organizar encuentros en Pilar,
            con acceso claro, servicios en cancha y espacio social para quedarse.
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {operationalFacts.map((fact) => (
              <div
                key={fact.label}
                className="editorial-panel px-5 py-4"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-accent)]">
                  {fact.label}
                </p>
                <p className="mt-2 text-sm text-white/82">{fact.value}</p>
              </div>
            ))}
          </div>

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
              href={`tel:+${site.whatsappNumber}`}
              className="inline-flex items-center justify-center rounded-md border border-white/12 bg-white/5 px-5 py-3 text-white transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-base)]"
            >
              {site.phoneDisplay}
            </a>
          </div>

          <ul className="mt-8 grid gap-3 sm:grid-cols-2">
            {sede.amenities.map((a) => (
              <li
                key={a}
                className="list-none border-l border-white/10 px-4 py-1 text-sm text-white/82"
              >
                {a}
              </li>
            ))}
          </ul>
        </div>
        <iframe
          title="Mapa de Vixen Club"
          src={mapSrc}
          loading="lazy"
          className="h-80 w-full rounded-[1rem] border border-white/5 bg-white/5 md:h-full"
        />
      </div>
    </SectionShell>
  );
}
