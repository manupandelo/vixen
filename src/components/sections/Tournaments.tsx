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
      className="border-t border-white/5 bg-[var(--color-surface)] py-20 sm:py-28"
    >
      <section aria-labelledby="tournaments-title">
        <div className="grid gap-12 lg:grid-cols-[1fr_1fr] lg:items-center">
          <div className="relative rounded-[2rem] overflow-hidden group w-full aspect-[4/5] sm:aspect-square lg:aspect-[4/5]">
            <VenueImage
              src={tournaments.image.src}
              alt={tournaments.image.alt}
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#090b0a]/80 via-[#090b0a]/20 to-transparent opacity-80" />
          </div>

          <div className="flex flex-col">
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-accent)] drop-shadow-[0_0_10px_rgba(var(--color-accent-rgb),0.5)]">
              Actividad visible
            </p>
            <h2 id="tournaments-title" className="text-display-sm text-4xl sm:text-5xl text-white">
              {tournaments.title}
            </h2>
            <p className="mt-6 max-w-lg text-[1.1rem] sm:text-[1.15rem] leading-relaxed text-[var(--color-muted)]">
              {tournaments.body}
            </p>

            <div className="mt-12 rounded-[2rem] bg-white/5 border border-white/10 p-8 sm:p-10 shadow-[0_30px_60px_rgba(0,0,0,0.5)]">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-[var(--color-accent)] mb-8">
                Señales de confianza
              </p>
              <ol className="space-y-6">
                {tournamentProof.map((point, index) => (
                  <li
                    key={point}
                    className="flex gap-4 border-b border-white/5 pb-6 last:border-0 last:pb-0"
                  >
                    <span className="text-sm font-black tracking-[0.2em] text-[var(--color-accent)]/60 pt-0.5">
                      0{index + 1}
                    </span>
                    <span className="text-[1.05rem] leading-relaxed text-white/90 font-medium">
                      {point}
                    </span>
                  </li>
                ))}
              </ol>
              <Button href={tournaments.cta.href} className="mt-8 w-full h-14">
                {tournaments.cta.label}
              </Button>
            </div>
          </div>
        </div>
      </section>
    </SectionShell>
  );
}
