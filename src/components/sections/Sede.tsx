import { content } from "@/content";
import { SectionShell } from "@/components/SectionShell";
import { SectionHeading } from "@/components/SectionHeading";

export function Sede() {
  const { sede } = content;
  const mapSrc = `https://www.google.com/maps?q=${encodeURIComponent(
    sede.mapQuery,
  )}&output=embed`;
  return (
    <SectionShell id="sede" className="border-t border-white/5">
      <div className="grid gap-10 md:grid-cols-2">
        <div>
          <SectionHeading kicker="Dónde estamos" title={sede.title} />
          <p className="mt-4 text-lg">{sede.addressLabel}</p>
          <ul className="mt-6 grid grid-cols-2 gap-3 text-sm text-[var(--color-muted)]">
            {sede.amenities.map((a) => (
              <li key={a} className="flex items-center gap-2">
                <span className="text-[var(--color-accent)]">●</span>
                {a}
              </li>
            ))}
          </ul>
        </div>
        <iframe
          title="Mapa de Vixen Club"
          src={mapSrc}
          loading="lazy"
          className="h-72 w-full rounded-2xl border border-white/5 md:h-full"
        />
      </div>
    </SectionShell>
  );
}
