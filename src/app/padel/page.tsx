import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Sponsors } from "@/components/Sponsors";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { SectionShell } from "@/components/SectionShell";
import { Button } from "@/components/Button";
import { VenueImage } from "@/components/VenueImage";
import { content } from "@/content";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "Pádel — Vixen Club",
  description:
    "Torneos americanos, clases y alquiler de canchas de pádel en Pilar.",
};

const facilityImages = ["/padel1.jpg", "/padel2.jpg", "/padel4.jpg"] as const;

export default function PadelPage() {
  const { padel } = content;
  return (
    <>
      <Header />
      <main>
        <div className="relative w-full min-h-[85vh] flex items-center justify-center overflow-hidden border-b border-white/5">
          <div className="absolute inset-0 z-0">
            <VenueImage
              src="/padel3.jpg"
              alt="Canchas de pádel en Vixen Club"
              priority
              overlay
              objectPosition="center 50%"
              className="w-full h-full object-cover opacity-100"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#090b0a] via-[#090b0a]/20 to-transparent" />
          </div>

          <div className="relative z-10 w-full max-w-5xl mx-auto px-6 flex flex-col items-center text-center mt-20">
            <p className="mb-4 text-[0.8rem] font-bold uppercase tracking-[0.2em] text-[var(--color-accent)]">
              Pilar · Buenos Aires
            </p>
            <h1 className="text-7xl sm:text-8xl md:text-9xl font-black uppercase tracking-tighter text-white">
              {padel.title}
            </h1>
            <p className="mt-6 max-w-2xl text-lg sm:text-xl text-white/70 font-medium leading-relaxed">
              {padel.intro}
            </p>

            <div className="mt-10 flex flex-wrap justify-center gap-y-2 text-[0.8rem] sm:text-[0.85rem] font-bold uppercase tracking-[0.25em] text-white/70">
              <span>Alquiler de canchas</span>
              <span className="mx-4 text-[var(--color-accent)] opacity-60">•</span>
              <span>Clases con Profes</span>
              <span className="mx-4 text-[var(--color-accent)] opacity-60 hidden sm:inline">•</span>
              <span className="w-full sm:w-auto mt-2 sm:mt-0">Torneos Americanos</span>
            </div>

            <div className="mt-12 flex flex-wrap justify-center gap-4">
              <Button href={buildWhatsAppUrl(padel.cta.message)} className="px-8 h-14 text-sm">
                {padel.cta.label}
              </Button>
            </div>
          </div>
        </div>

        <SectionShell className="border-t border-white/5 py-16 sm:py-24">
          <div className="mb-9 grid gap-5 border-b border-white/8 pb-7 lg:grid-cols-[0.78fr_1.22fr] lg:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-accent)]">
                Dentro de la cancha
              </p>
              <h2 className="mt-3 text-display-sm text-4xl sm:text-5xl">
                Todo listo para jugar
              </h2>
            </div>
            <p className="max-w-2xl text-[1rem]/7 text-[var(--color-muted)] lg:justify-self-end">
              Canchas, iluminación y un tercer tiempo que forman parte de la
              misma experiencia.
            </p>
          </div>

          <div className="grid gap-3 lg:grid-cols-[minmax(0,1.22fr)_minmax(18rem,0.78fr)] lg:grid-rows-2">
            {padel.facilities.map((p, i) => {
              const isFeatured = i === 0;

              return (
                <article
                  key={p.title}
                  className={`group relative flex min-h-[22rem] flex-col justify-end overflow-hidden border border-white/9 transition-colors duration-500 hover:border-white/22 ${
                    isFeatured
                      ? "rounded-[1.5rem] lg:row-span-2 lg:min-h-[43rem]"
                      : "rounded-xl lg:min-h-0"
                  }`}
                >
                  <div className="absolute inset-0 z-0">
                    <VenueImage
                      src={facilityImages[i]}
                      alt={p.title}
                      className={`h-full w-full object-cover transition duration-700 group-hover:scale-[1.035] ${
                        isFeatured
                          ? "opacity-88"
                          : "opacity-75 group-hover:opacity-90"
                      }`}
                    />
                    <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_24%,rgb(9_11_10_/_0.2)_48%,rgb(9_11_10_/_0.95)_100%)]" />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_18%,rgb(60_191_113_/_0.11),transparent_34%)] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                  </div>



                  <div
                    className={`relative z-10 p-7 transition-transform duration-500 group-hover:-translate-y-1 sm:p-9 ${
                      isFeatured ? "lg:p-11" : ""
                    }`}
                  >
                    <h3
                      className={`text-display-sm text-white ${
                        isFeatured ? "text-3xl sm:text-4xl" : "text-2xl"
                      }`}
                    >
                      {p.title}
                    </h3>
                    <p
                      className={`mt-4 leading-relaxed text-white/72 ${
                        isFeatured
                          ? "max-w-lg text-[1.05rem]"
                          : "max-w-md text-[0.95rem]"
                      }`}
                    >
                      {p.body}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        </SectionShell>
      </main>
      <Sponsors />
      <Footer />
      <WhatsAppButton 
        label="Consultas Pádel" 
        message="Hola! Tengo una consulta sobre el área de pádel." 
      />
    </>
  );
}
