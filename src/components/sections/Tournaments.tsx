import { Button } from "@/components/Button";
import { SectionHeading } from "@/components/SectionHeading";
import { SectionShell } from "@/components/SectionShell";
import { VenueImage } from "@/components/VenueImage";
import { content } from "@/content";

const tournamentProof = [
  "Copas visibles, fechas activas y un club que muestra movimiento real.",
  "Torneos de fútbol 7 con fixture, categorías y cierre competitivo.",
  "Americanos y eventos de pádel que suman ritmo al calendario del predio.",
] as const;

export function Tournaments() {
  const { tournaments } = content;

  return (
    <SectionShell
      id="torneos"
      className="border-t border-white/5 bg-[var(--color-surface)]"
    >
      <div className="grid items-center gap-8 lg:grid-cols-[0.92fr_1.08fr] lg:gap-12">
        <VenueImage
          src={tournaments.image.src}
          alt={tournaments.image.alt}
          className="aspect-[4/3] min-h-[22rem] lg:aspect-[4/5]"
        />

        <div>
          <SectionHeading
            kicker="Actividad visible"
            title={tournaments.title}
          />
          <p className="mt-4 max-w-2xl text-[var(--color-muted)]">
            {tournaments.body}
          </p>

          <ul className="mt-8 grid gap-3">
            {tournamentProof.map((point) => (
              <li
                key={point}
                className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] px-5 py-4 text-sm text-white/82"
              >
                {point}
              </li>
            ))}
          </ul>

          <Button href={tournaments.cta.href} className="mt-8">
            {tournaments.cta.label}
          </Button>
        </div>
      </div>
    </SectionShell>
  );
}
