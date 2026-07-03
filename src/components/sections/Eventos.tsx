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
      className="border-t border-white/5 bg-[var(--color-surface)] py-20 sm:py-28"
    >
      <section
        aria-labelledby="eventos-title"
        className="grid gap-12 lg:grid-cols-[1fr_1fr] lg:items-center"
      >
        <div className="flex flex-col">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-accent)]">
            Después del partido
          </p>
          <h2 id="eventos-title" className="text-display-sm text-4xl sm:text-5xl">
            {eventos.title}
          </h2>
          <p className="mt-6 text-[1.1rem] sm:text-[1.15rem] leading-relaxed text-[var(--color-muted)]">
            {eventos.body}
          </p>

          <div className="mt-12 grid gap-8 sm:grid-cols-2">
            {eventMoments.map((moment) => (
              <div key={moment.title} className="flex flex-col">
                <p className="text-[1.05rem] font-bold text-white mb-2">{moment.title}</p>
                <p className="text-[0.95rem] text-white/60 leading-relaxed">{moment.body}</p>
              </div>
            ))}
            
            <div className="flex flex-col sm:col-span-2 mt-4 pt-8 border-t border-white/10">
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-[var(--color-accent)] mb-3">
                Club social
              </p>
              <h3 className="text-xl font-bold text-white mb-3">
                Bar y quincho con vista a cancha
              </h3>
              <p className="text-[0.95rem] text-white/60 max-w-lg leading-relaxed">
                Formatos privados dentro del mismo recorrido del club, sin sentirse como un bloque aparte.
              </p>
            </div>
          </div>
        </div>

        <div className="relative rounded-[2rem] overflow-hidden group w-full h-[600px] lg:h-[800px]">
          <VenueImage
            src="/vixen2.jpg"
            alt="Sector social de Vixen Club con mesas y vista a las canchas"
            className="absolute inset-0 w-full h-full object-cover opacity-90 transition-transform duration-700 group-hover:scale-105"
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
        </div>
      </section>
    </SectionShell>
  );
}
