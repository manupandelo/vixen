import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { SectionShell } from "@/components/SectionShell";
import { SectionHeading } from "@/components/SectionHeading";
import { Stat } from "@/components/Stat";
import { Button } from "@/components/Button";
import { ImagePlaceholder } from "@/components/ImagePlaceholder";
import { VenueImage } from "@/components/VenueImage";
import { content } from "@/content";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "Pádel — Vixen Club",
  description:
    "Torneos americanos, clases y alquiler de canchas de pádel en Pilar.",
};

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
            <p className="mb-4 text-sm font-bold uppercase tracking-[0.3em] text-[var(--color-accent)] drop-shadow-[0_0_10px_rgba(var(--color-accent-rgb),0.5)]">
              Pilar · Buenos Aires
            </p>
            <h1 className="text-7xl sm:text-8xl md:text-9xl font-black uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-white/40 drop-shadow-2xl">
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
          <div className="grid gap-6 lg:grid-cols-3">
            {padel.facilities.map((p, i) => {
              const images = ["/padel1.jpg", "/padel2.jpg", "/padel4.jpg"];
              return (
                <div
                  key={p.title}
                  className="group relative overflow-hidden rounded-[1.5rem] border border-white/10 p-8 min-h-[22rem] flex flex-col justify-end transition duration-500 hover:border-white/30 hover:shadow-[0_0_40px_rgba(255,255,255,0.05)]"
                >
                  <div className="absolute inset-0 z-0">
                    <VenueImage
                      src={images[i]}
                      alt={p.title}
                      className="w-full h-full object-cover opacity-70 transition-all duration-700 group-hover:scale-[1.05] group-hover:opacity-100"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#090b0a] via-[#090b0a]/40 to-transparent opacity-90 transition-opacity duration-500 group-hover:opacity-70" />
                  </div>
                  
                  <div className="relative z-10 transition-transform duration-500 group-hover:-translate-y-1">
                    <h3 className="text-display-sm text-2xl text-white">
                      {p.title}
                    </h3>
                    <p className="mt-3 text-[1.05rem] leading-relaxed text-white/80">
                      {p.body}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

        </SectionShell>
      </main>
      <Footer />
      <WhatsAppButton 
        label="Consultas Pádel" 
        message="Hola! Tengo una consulta sobre el área de pádel." 
      />
    </>
  );
}
