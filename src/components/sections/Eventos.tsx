import { content } from "@/content";
import { SectionShell } from "@/components/SectionShell";
import { VenueImage } from "@/components/VenueImage";

const eventMoments = [
  {
    title: "After y tercer tiempo",
    body: "Bar y sector social para quedarse después de jugar, sin salir del predio.",
  },
  {
    title: "Cumpleaños y grupos",
    body: "Formatos privados y reuniones coordinadas dentro del ritmo real del club.",
  },
  {
    title: "Una jornada completa",
    body: "Cancha, torneo y cierre social en un mismo lugar, con vista directa a la actividad.",
  },
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
        className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start lg:gap-14"
      >
        <div className="lg:pt-5">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-accent)]">
            Después del partido
          </p>
          <h2 id="eventos-title" className="text-display-sm">
            {eventos.title}
          </h2>
          <p className="mt-4 max-w-xl text-[var(--color-muted)]">
            {eventos.body}
          </p>

          <div className="mt-10 divide-y divide-white/10 border-y border-white/10">
            {eventMoments.map((moment) => (
              <article key={moment.title} className="py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-accent)]">
                  {moment.title}
                </p>
                <p className="mt-2 max-w-lg text-sm text-white/76">
                  {moment.body}
                </p>
              </article>
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-[1.15fr_0.85fr] sm:items-start">
          <VenueImage
            src="/vixen2.jpg"
            alt="Sector social de Vixen Club con mesas y vista a las canchas"
            className="aspect-[4/5] min-h-[21rem] sm:min-h-[24rem]"
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
              <div className="mt-4 space-y-3 border-b border-white/10 pb-4">
                <div className="flex items-center justify-between gap-4 text-sm text-white/72">
                  <span>Bar y quincho</span>
                  <span className="text-white/42">01</span>
                </div>
                <div className="flex items-center justify-between gap-4 text-sm text-white/72">
                  <span>Eventos privados</span>
                  <span className="text-white/42">02</span>
                </div>
                <div className="flex items-center justify-between gap-4 text-sm text-white/72">
                  <span>Vista a cancha</span>
                  <span className="text-white/42">03</span>
                </div>
              </div>
              <p className="mt-4 max-w-xs text-sm text-white/58">
                Una parte más del club, no un bloque aislado para repetir la
                misma acción.
              </p>
            </div>
          </div>
        </div>
      </div>
    </SectionShell>
  );
}
