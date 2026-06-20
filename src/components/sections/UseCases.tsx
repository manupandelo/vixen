import { Button } from "@/components/Button";
import { SectionShell } from "@/components/SectionShell";
import { VenueImage } from "@/components/VenueImage";
import { content } from "@/content";

const useCaseRows = [
  {
    id: "futbol",
    eyebrow: "Equipo, copa o inscripción",
    lead: "Canal directo con el club",
    panelClass:
      "border-[color-mix(in_srgb,var(--color-accent)_18%,transparent)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--color-accent)_14%,white_4%),color-mix(in_srgb,var(--color-accent)_10%,transparent))] text-[#081109]",
    textClass: "text-[#081109]",
    bodyClass: "text-[#102114]/78",
    pointClass: "border-[#102114]/14 text-[#102114]/84",
    eyebrowClass: "text-[#102114]/58",
    leadClass: "text-[#143620]",
    noteClass: "text-[#102114]/62",
    image: {
      src: "/futbol1.jpg",
      alt: "Partido de fútbol 7 en una cancha iluminada de Vixen Club",
    },
    points: content.futbol.points.map((point) => point.title),
    title: content.useCases.futbol.title,
    body: content.useCases.futbol.body,
    ctas: [] as const,
    note: "Inscripciones y consultas generales desde el WhatsApp del club.",
  },
  {
    id: "padel",
    eyebrow: "Turnos, clases y torneo",
    lead: "Reserva inmediata",
    panelClass:
      "border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.015))]",
    textClass: "text-white",
    bodyClass: "text-[var(--color-muted)]",
    pointClass: "border-white/10 text-white/78",
    eyebrowClass: "text-white/55",
    leadClass: "text-[var(--color-accent)]",
    noteClass: "text-white/58",
    image: {
      src: "/padel1.jpg",
      alt: "Jugadores de pádel en una de las canchas de Vixen Club",
    },
    points: content.padel.points.map((point) => point.title),
    title: content.useCases.padel.title,
    body: content.useCases.padel.body,
    ctas: [{ ...content.useCases.padel.primaryCta, variant: "primary" as const }],
    note: "Clases y torneos se coordinan con el club sin duplicar acciones.",
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
            Dos usos distintos del mismo club: fútbol para organizar equipo y
            competir; pádel para reservar y entrar a cancha sin vueltas.
          </p>
        </div>

        <div className="mt-8 flex flex-col gap-6">
          {useCaseRows.map((row, index) => (
            <article
              key={row.id}
              className={`grid gap-8 overflow-hidden rounded-[1.1rem] border p-5 sm:p-6 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)] lg:items-center lg:gap-10 ${row.panelClass}`}
            >
              <div className={index % 2 === 0 ? "lg:order-2" : ""}>
                <VenueImage
                  src={row.image.src}
                  alt={row.image.alt}
                  overlay={index !== 0}
                  objectPosition={index === 0 ? "center 38%" : "center 58%"}
                  className="aspect-[16/10] min-h-[18rem] lg:aspect-[5/4] lg:min-h-[22rem]"
                />
              </div>

              <div className={index % 2 === 0 ? "lg:order-1" : ""}>
                <div className={`flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-semibold uppercase tracking-[0.2em] ${row.eyebrowClass}`}>
                  <span>{row.eyebrow}</span>
                  <span className="hidden h-px w-10 bg-current/30 sm:block" />
                  <span className={row.leadClass}>{row.lead}</span>
                </div>

                <h3 className={`mt-4 text-display-sm text-2xl ${row.textClass}`}>
                  {row.title}
                </h3>
                <p className={`mt-3 max-w-xl ${row.bodyClass}`}>
                  {row.body}
                </p>

                <ul className="mt-6 grid gap-3 text-sm sm:grid-cols-3">
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
                  <div className="mt-8 flex flex-wrap gap-3">
                    {row.ctas.map((cta) => (
                      <Button key={cta.href} href={cta.href} variant={cta.variant}>
                        {cta.label}
                      </Button>
                    ))}
                  </div>
                ) : null}

                <p className={`mt-6 max-w-md text-sm ${row.noteClass}`}>{row.note}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </SectionShell>
  );
}
