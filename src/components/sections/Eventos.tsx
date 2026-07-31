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
            
            <div className="mt-4 flex flex-col border-t border-white/10 pt-8 sm:col-span-2">
              <h3 className="text-xl font-bold text-white mb-3">
                Bar y quincho con vista a cancha
              </h3>
              <p className="text-[0.95rem] text-white/60 max-w-lg leading-relaxed mb-6">
                Formatos privados dentro del mismo recorrido del club, sin sentirse como un bloque aparte.
              </p>

              <aside
                aria-label="Promoción del tercer tiempo"
                className="relative mt-2 grid overflow-hidden border-y border-white/12 bg-white/[0.018] sm:grid-cols-[minmax(0,1fr)_9rem]"
              >
                <span
                  aria-hidden="true"
                  className="absolute inset-y-0 left-0 w-1 bg-[var(--color-accent)]"
                />

                <div className="px-6 py-6 sm:px-7">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-accent)]">
                    Jueves en Vixen
                  </p>
                  <h4 className="mt-2 text-xl font-semibold tracking-[-0.025em] text-white">
                    El tercer tiempo también se juega
                  </h4>
                  <p className="mt-3 max-w-xl text-[0.95rem]/6 text-white/66">
                    2x1 en Fernet Branca y picadas reservando tu cancha.
                    Disponible para quienes vienen a jugar.
                  </p>
                </div>

                <div className="flex items-center justify-between border-t border-white/10 px-6 py-5 sm:flex-col sm:justify-center sm:border-l sm:border-t-0 sm:px-5">
                  <span className="font-[family-name:var(--font-display-family)] text-4xl font-black tracking-[-0.05em] text-white">
                    2×1
                  </span>
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-white/45 sm:mt-2">
                    Con reserva
                  </span>
                </div>
              </aside>
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
