import { content } from "@/content";
import { SectionShell } from "@/components/SectionShell";
import { Button } from "@/components/Button";
import { VenueImage } from "@/components/VenueImage";

const eventProof = [
  "Bar y sector social para cerrar el partido con tiempo real de club.",
  "Cumpleaños, despedidas y formatos privados coordinados con el equipo.",
  "Predio activo para combinar cancha, torneo y tercer tiempo en un mismo lugar.",
] as const;

export function Eventos() {
  const { eventos } = content;
  return (
    <SectionShell
      id="eventos"
      className="border-t border-white/5 bg-[var(--color-surface)]"
    >
      <div
        role="region"
        aria-labelledby="eventos-title"
        className="grid gap-10 lg:grid-cols-[0.84fr_1.16fr] lg:items-center lg:gap-12"
      >
        <div className="lg:pt-4">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-accent)]">
            Después del partido
          </p>
          <h2 id="eventos-title" className="text-display-sm">
            {eventos.title}
          </h2>
          <p className="mt-4 max-w-xl text-[var(--color-muted)]">
            {eventos.body}
          </p>

          <div className="mt-8 space-y-4 border-y border-white/10 py-6">
            {eventProof.map((point) => (
              <p key={point} className="text-sm text-white/78">
                {point}
              </p>
            ))}
          </div>

          <Button href={eventos.cta.href} className="mt-8">
            {eventos.cta.label}
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-[1.18fr_0.82fr] sm:items-start">
          <VenueImage
            src="/vixen2.jpg"
            alt="Sector social de Vixen Club con mesas y vista a las canchas"
            className="aspect-[4/5] min-h-[20rem] sm:min-h-[24rem]"
          />
          <div className="flex flex-col gap-4 sm:pl-4">
            <VenueImage
              src="/canchas4.jpg"
              alt="Canchas iluminadas y predio activo en Vixen Club"
              className="aspect-[4/3] min-h-[12rem]"
            />
            <div className="border-t border-white/10 pt-4">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--color-accent)]">
                Club social
              </p>
              <p className="mt-3 max-w-xs text-base text-white/76">
                Un formato simple: jugás, te quedás y el club coordina el resto
                con una conversación directa.
              </p>
            </div>
          </div>
        </div>
      </div>
    </SectionShell>
  );
}
