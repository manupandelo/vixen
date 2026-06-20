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

          <div className="mt-7 border-t border-white/10 pt-5">
            <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_13rem] sm:items-start">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--color-accent)]">
                  Club social
                </p>
                <p className="mt-3 max-w-lg text-sm text-white/72">
                  Bar, vista a cancha y formatos privados dentro del mismo
                  recorrido del club, sin sentirse como un bloque aparte.
                </p>
              </div>
              <VenueImage
                src="/canchas4.jpg"
                alt="Canchas iluminadas y predio activo en Vixen Club"
                className="aspect-[16/11] min-h-[11rem] max-w-[13rem] rounded-[1.1rem] sm:justify-self-end"
              />
            </div>
            <div className="mt-5 grid gap-3 border-t border-white/10 pt-4 sm:grid-cols-3 sm:gap-4">
              <div className="border-t border-white/10 pt-3 text-sm text-white/72 sm:border-t-0 sm:pt-0">
                Bar y quincho
              </div>
              <div className="border-t border-white/10 pt-3 text-sm text-white/72 sm:border-t-0 sm:pt-0">
                Eventos privados
              </div>
              <div className="border-t border-white/10 pt-3 text-sm text-white/72 sm:border-t-0 sm:pt-0">
                Vista a cancha
              </div>
            </div>
          </div>
        </div>

        <div>
          <VenueImage
            src="/vixen2.jpg"
            alt="Sector social de Vixen Club con mesas y vista a las canchas"
            className="aspect-[4/5] min-h-[21rem] sm:min-h-[28rem]"
          />
        </div>
      </div>
    </SectionShell>
  );
}
