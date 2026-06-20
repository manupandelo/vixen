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
    <SectionShell id="disciplinas" className="border-t border-white/5">
      <div role="region" aria-labelledby="use-cases-title">
        <div className="grid gap-6 border-b border-white/8 pb-8 lg:grid-cols-[0.88fr_1.12fr] lg:items-end">
          <div>
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-accent)]">
              Actividades
            </p>
            <h2 id="use-cases-title" className="text-display-sm">
              Fútbol 7 y pádel.
            </h2>
          </div>
          <p className="max-w-2xl text-[var(--color-muted)] lg:justify-self-end">
            Dos ritmos del mismo club: fútbol para equipo, cancha o torneo;
            pádel para reservar rápido y seguir jugando.
          </p>
        </div>

        <div className="mt-8 flex flex-col gap-8">
          {useCaseRows.map((row, index) => (
            <article
              key={row.id}
              className={`overflow-hidden rounded-[1.6rem] border border-white/6 px-4 py-5 sm:px-7 sm:py-7 ${row.sectionClass}`}
            >
              <div className="grid gap-8 lg:grid-cols-[minmax(0,0.94fr)_minmax(0,1.06fr)] lg:items-center lg:gap-12">
                <div className={`min-w-0 px-2 pt-2 sm:px-0 sm:pt-0 ${index % 2 === 0 ? "lg:order-2" : ""}`}>
                  <VenueImage
                    src={row.image.src}
                    alt={row.image.alt}
                    overlay={index === 0}
                    objectPosition={index === 0 ? "center 38%" : "center 58%"}
                    className="aspect-[16/10] min-h-[16rem] rounded-[1.25rem] sm:min-h-[18rem] lg:aspect-[6/5] lg:min-h-[24rem]"
                  />
                </div>

                <div className={`min-w-0 ${index % 2 === 0 ? "lg:order-1" : ""}`}>
                  <div className={`flex flex-col items-start gap-y-2 text-[0.72rem] font-semibold uppercase tracking-[0.16em] sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-4 sm:text-xs sm:tracking-[0.2em] ${row.eyebrowClass}`}>
                    <span>{row.eyebrow}</span>
                    <span className="hidden h-px w-10 bg-current/30 sm:block" />
                    <span className={row.leadClass}>{row.lead}</span>
                  </div>

                  <h3 className={`mt-4 text-display-sm text-2xl ${row.textClass}`}>
                    {row.title}
                  </h3>
                  <p className={`mt-3 max-w-2xl text-[1rem] sm:text-[1.02rem] ${row.bodyClass}`}>
                    {row.body}
                  </p>

                  <ul className={`mt-7 grid gap-x-5 gap-y-4 text-sm ${row.pointsClass}`}>
                    {row.points.map((point) => (
                      <li
                        key={point}
                        className={`list-none border-t pt-3 ${row.pointClass}`}
                      >
                        {point}
                      </li>
                    ))}
                  </ul>

                  {row.ctas.length > 0 ? (
                    <div className="mt-7 flex flex-wrap gap-3">
                      {row.ctas.map((cta) => (
                        <Button key={cta.href} href={cta.href} variant={cta.variant}>
                          {cta.label}
                        </Button>
                      ))}
                    </div>
                  ) : null}

                  <p className={`mt-5 max-w-lg text-sm leading-relaxed ${row.noteClass}`}>{row.note}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </SectionShell>
  );
}
