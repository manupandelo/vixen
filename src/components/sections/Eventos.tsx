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
            
            <div className="flex flex-col sm:col-span-2 mt-4 pt-8 border-t border-white/10">
              <h3 className="text-xl font-bold text-white mb-3">
                Bar y quincho con vista a cancha
              </h3>
              <p className="text-[0.95rem] text-white/60 max-w-lg leading-relaxed mb-6">
                Formatos privados dentro del mismo recorrido del club, sin sentirse como un bloque aparte.
              </p>

              <div className="rounded-xl bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/30 p-5 flex items-start gap-4">
                <span className="text-[var(--color-accent)] text-2xl" aria-hidden="true">🍻</span>
                <div>
                  <p className="font-bold text-white text-[1.05rem]">Promo Tercer Tiempo</p>
                  <p className="text-white/70 text-sm mt-1">2x1 en Fernet Branca y picadas todos los jueves reservando tu cancha. ¡Exclusivo para jugadores!</p>
                </div>
              </div>
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
