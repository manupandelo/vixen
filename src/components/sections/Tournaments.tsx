import { Button } from "@/components/Button";
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
      <div role="region" aria-labelledby="tournaments-title">
        <div className="grid gap-6 border-b border-white/8 pb-8 lg:grid-cols-[0.82fr_1.18fr] lg:items-end">
          <div>
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-accent)]">
              Actividad visible
            </p>
            <h2 id="tournaments-title" className="text-display-sm">
              {tournaments.title}
            </h2>
          </div>
          <p className="max-w-2xl text-[var(--color-muted)] lg:justify-self-end">
            {tournaments.body}
          </p>
        </div>

        <div className="grid gap-8 pt-8 lg:grid-cols-[1.08fr_0.92fr] lg:items-end lg:gap-12">
          <VenueImage
            src={tournaments.image.src}
            alt={tournaments.image.alt}
            className="aspect-[16/10] min-h-[23rem] lg:aspect-[5/4]"
          />

          <div className="lg:pb-4">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-accent)]">
              Señales de confianza
            </p>
            <ol className="mt-6 space-y-4">
              {tournamentProof.map((point, index) => (
                <li
                  key={point}
                  className="grid gap-2 border-t border-white/10 pt-4 sm:grid-cols-[auto_1fr] sm:gap-4"
                >
                  <span className="text-xs font-semibold tracking-[0.22em] text-white/42">
                    0{index + 1}
                  </span>
                  <span className="text-sm text-white/78">{point}</span>
                </li>
              ))}
            </ol>

            <Button href={tournaments.cta.href} className="mt-8">
              {tournaments.cta.label}
            </Button>
          </div>
        </div>
      </div>
    </SectionShell>
  );
}
