import { content } from "@/content";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { SectionShell } from "@/components/SectionShell";
import { SectionHeading } from "@/components/SectionHeading";
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
      <div className="grid items-center gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-12">
        <div>
          <SectionHeading kicker="Después del partido" title={eventos.title} />
          <p className="mt-4 max-w-2xl text-[var(--color-muted)]">
            {eventos.body}
          </p>

          <ul className="mt-8 grid gap-3">
            {eventProof.map((point) => (
              <li
                key={point}
                className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] px-5 py-4 text-sm text-white/82"
              >
                {point}
              </li>
            ))}
          </ul>

          <Button href={buildWhatsAppUrl(eventos.cta.message)} className="mt-8">
            {eventos.cta.label}
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-[1.1fr_0.9fr]">
          <VenueImage
            src="/vixen2.jpg"
            alt="Sector social de Vixen Club con mesas y vista a las canchas"
            className="aspect-[4/5] min-h-[20rem] sm:min-h-[24rem]"
          />
          <div className="grid gap-4">
            <VenueImage
              src="/canchas4.jpg"
              alt="Canchas iluminadas y predio activo en Vixen Club"
              className="aspect-[4/3] min-h-[10rem]"
            />
            <div className="rounded-[1.75rem] border border-[var(--color-accent)]/25 bg-[linear-gradient(180deg,rgba(198,240,0,0.08),rgba(255,255,255,0.03))] p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--color-accent)]">
                Formato real
              </p>
              <p className="mt-3 text-lg text-white">
                Un cierre de jornada pensado para grupos, fechas y eventos del club.
              </p>
            </div>
          </div>
        </div>
      </div>
    </SectionShell>
  );
}
