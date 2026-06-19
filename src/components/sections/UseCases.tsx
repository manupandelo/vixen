import { Button } from "@/components/Button";
import { SectionHeading } from "@/components/SectionHeading";
import { SectionShell } from "@/components/SectionShell";
import { VenueImage } from "@/components/VenueImage";
import { content } from "@/content";

const useCasePanels = [
  {
    id: "futbol",
    eyebrow: "Equipo, copa o inscripción",
    image: {
      src: "/futbol1.jpg",
      alt: "Partido de fútbol 7 en una cancha iluminada de Vixen Club",
    },
    points: content.futbol.points.map((point) => point.title),
    tone:
      "border-[var(--color-accent)]/20 bg-[linear-gradient(180deg,rgba(198,240,0,0.08),rgba(20,20,22,0.88)_28%)]",
    title: content.useCases.futbol.title,
    body: content.useCases.futbol.body,
    ctas: [{ ...content.useCases.futbol.cta, variant: "primary" as const }],
  },
  {
    id: "padel",
    eyebrow: "Turnos, clases y torneo",
    image: {
      src: "/padel1.jpg",
      alt: "Jugadores de pádel en una de las canchas de Vixen Club",
    },
    points: content.padel.points.map((point) => point.title),
    tone:
      "border-[var(--color-warm)]/25 bg-[linear-gradient(180deg,rgba(255,92,57,0.08),rgba(20,20,22,0.88)_28%)]",
    title: content.useCases.padel.title,
    body: content.useCases.padel.body,
    ctas: [
      { ...content.useCases.padel.primaryCta, variant: "primary" as const },
      { ...content.useCases.padel.secondaryCta, variant: "secondary" as const },
    ],
  },
] as const;

export function UseCases() {
  return (
    <SectionShell id="disciplinas" className="border-t border-white/5">
      <div className="max-w-3xl">
        <SectionHeading
          kicker="Canal correcto"
          title="Fútbol por WhatsApp. Pádel por ATC."
        />
        <p className="mt-4 text-[var(--color-muted)]">
          Cada bloque resuelve una intención distinta: fútbol para hablar con el
          club y organizar equipo; pádel para reservar turno directo o consultar
          por clases y torneos.
        </p>
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        {useCasePanels.map((panel) => (
          <article
            key={panel.id}
            className={`flex h-full flex-col overflow-hidden rounded-[1rem] border p-5 sm:p-6 ${panel.tone}`}
          >
            <VenueImage
              src={panel.image.src}
              alt={panel.image.alt}
              overlay
              className="aspect-[4/3]"
            />

            <p className="mt-6 text-xs font-semibold uppercase tracking-[0.18em] text-white/65">
              {panel.eyebrow}
            </p>
            <h3 className="mt-3 text-display-sm text-2xl">{panel.title}</h3>
            <p className="mt-3 max-w-xl text-[var(--color-muted)]">
              {panel.body}
            </p>

            <ul className="detail-list mt-6 text-sm">
              {panel.points.map((point) => (
                <li key={point} className="list-none">
                  {point}
                </li>
              ))}
            </ul>

            <div className="mt-8 flex flex-wrap gap-3">
              {panel.ctas.map((cta) => (
                <Button key={cta.href} href={cta.href} variant={cta.variant}>
                  {cta.label}
                </Button>
              ))}
            </div>
          </article>
        ))}
      </div>
    </SectionShell>
  );
}
