import { Button } from "@/components/Button";
import { SectionShell } from "@/components/SectionShell";
import { VenueImage } from "@/components/VenueImage";
import { content } from "@/content";

const useCaseRows = [
  {
    id: "futbol",
    eyebrow: "Equipo, copa o inscripción",
    lead: "WhatsApp directo con el club",
    sectionClass:
      "bg-[linear-gradient(180deg,color-mix(in_srgb,var(--color-accent)_18%,black_18%),color-mix(in_srgb,var(--color-accent)_10%,black_36%))]",
    textClass: "text-white",
    bodyClass: "text-white/78",
    pointClass: "border-white/12 text-white/84",
    eyebrowClass: "text-white/55",
    leadClass: "text-white",
    noteClass: "text-white/62",
    pointsClass: "sm:grid-cols-3",
    image: {
      src: "/futbol1.jpg",
      alt: "Partido de fútbol 7 en una cancha iluminada de Vixen Club",
    },
    points: ["Cancha por turno", "Equipos y cupos", "Copas activas"],
    title: content.useCases.futbol.title,
    body: content.useCases.futbol.body,
    ctas: [] as const,
    note: "Equipos, cupos e inscripciones se resuelven directo con Vixen.",
  },
  {
    id: "padel",
    eyebrow: "Turnos, clases y torneo",
    lead: "Reserva online",
    sectionClass:
      "bg-[linear-gradient(180deg,rgba(255,255,255,0.028),rgba(255,255,255,0.008))]",
    textClass: "text-white",
    bodyClass: "text-[var(--color-muted)]",
    pointClass: "border-white/10 text-white/78",
    eyebrowClass: "text-white/55",
    leadClass: "text-[var(--color-accent)]",
    noteClass: "text-white/58",
    pointsClass: "sm:grid-cols-3",
    image: {
      src: "/padel1.jpg",
      alt: "Jugadores de pádel en una de las canchas de Vixen Club",
    },
    points: ["Turnos en ATC", "Clases", "Americanos"],
    title: content.useCases.padel.title,
    body: content.useCases.padel.body,
    ctas: [{ ...content.useCases.padel.primaryCta, variant: "primary" as const }],
    note: "ATC resuelve la reserva; el club acompaña el resto.",
  },
] as const;

export function UseCases() {
  return (
    <section id="disciplinas" aria-labelledby="use-cases-title" className="border-t border-white/5 pt-16 sm:pt-24 pb-0">
      <div className="mx-auto max-w-5xl px-6 mb-16">
        <div className="grid gap-6 border-b border-white/8 pb-8 lg:grid-cols-[0.88fr_1.12fr] lg:items-end">
          <div>
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-accent)]">
              Actividades
            </p>
            <h2 id="use-cases-title" className="text-display-sm text-4xl sm:text-5xl">
              Fútbol 7 y pádel.
            </h2>
          </div>
          <p className="max-w-2xl text-[var(--color-muted)] lg:justify-self-end text-lg">
            Dos ritmos del mismo club: fútbol para equipo, cancha o torneo;
            pádel para reservar rápido y seguir jugando.
          </p>
        </div>
      </div>

      <div className="flex flex-col">
        {useCaseRows.map((row, index) => (
          <article
            key={row.id}
            className="group relative w-full border-t border-white/5 overflow-hidden"
          >
            <div className={`grid lg:grid-cols-2 ${index % 2 !== 0 ? 'lg:grid-flow-dense' : ''}`}>
              {/* Contenedor de Imagen (50% ancho en desktop) */}
              <div className={`relative min-h-[50vh] lg:min-h-[75vh] ${index % 2 !== 0 ? 'lg:col-start-2' : 'lg:col-start-1'}`}>
                <VenueImage
                  src={row.image.src}
                  alt={row.image.alt}
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="w-full h-full object-cover opacity-80 transition-transform duration-1000 group-hover:scale-105 group-hover:opacity-100"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#090b0a] via-[#090b0a]/30 to-transparent lg:hidden" />
                <div className={`absolute inset-0 bg-gradient-to-r from-[#090b0a] via-transparent to-transparent hidden lg:block ${index % 2 !== 0 ? 'bg-gradient-to-l' : ''}`} />
              </div>

              {/* Contenedor de Texto */}
              <div className={`relative z-10 flex flex-col justify-center p-8 sm:p-16 lg:p-24 bg-[#090b0a] ${index % 2 !== 0 ? 'lg:col-start-1' : 'lg:col-start-2'}`}>
                <div className={`flex flex-col items-start gap-y-2 text-[0.72rem] font-semibold uppercase tracking-[0.16em] sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-4 sm:text-xs sm:tracking-[0.2em] ${row.eyebrowClass}`}>
                  <span>{row.eyebrow}</span>
                  <span className="hidden h-px w-10 bg-current/30 sm:block" />
                  <span className={row.leadClass}>{row.lead}</span>
                </div>

                <h3 className={`mt-6 text-display-sm text-4xl sm:text-5xl ${row.textClass}`}>
                  {row.title}
                </h3>
                <p className={`mt-6 max-w-xl text-[1.1rem] sm:text-[1.15rem] leading-relaxed ${row.bodyClass}`}>
                  {row.body}
                </p>

                <ul className="mt-10 space-y-4 text-[0.95rem]">
                  {row.points.map((point) => (
                    <li
                      key={point}
                      className={`flex items-center gap-3 ${row.pointClass}`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)]" />
                      {point}
                    </li>
                  ))}
                </ul>

                {row.ctas.length > 0 ? (
                  <div className="mt-10 flex flex-wrap gap-4">
                    {row.ctas.map((cta) => (
                      <Button key={cta.href} href={cta.href} variant={cta.variant} className="px-8 h-12">
                        {cta.label}
                      </Button>
                    ))}
                  </div>
                ) : null}

                <p className={`mt-8 max-w-lg text-sm leading-relaxed ${row.noteClass}`}>{row.note}</p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
