import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { SectionShell } from "@/components/SectionShell";
import { SectionHeading } from "@/components/SectionHeading";
import { Button } from "@/components/Button";
import { VenueImage } from "@/components/VenueImage";
import { TournamentSummaryCard } from "@/components/football/TournamentSummaryCard";
import { content } from "@/content";
import { getActivePublicFootballTournaments } from "@/features/football-tournaments/data";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "Fútbol 7 — Vixen Club",
  description:
    "Torneos de fútbol 7 masculino y femenino en Pilar. Inscripción temporada 2026.",
};

export default async function FutbolPage() {
  const { futbol } = content;
  const tournaments = await getActivePublicFootballTournaments();

  return (
    <>
      <Header />
      <main>
        <div className="relative w-full min-h-[85vh] flex items-center justify-center overflow-hidden border-b border-white/5">
          <div className="absolute inset-0 z-0">
            <VenueImage
              src="/futbol3.jpg"
              alt="Partido de fútbol 7 en Vixen Club"
              priority
              overlay
              objectPosition="center 45%"
              className="w-full h-full object-cover opacity-60"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#090b0a] via-[#090b0a]/60 to-transparent" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,#090b0a_100%)] opacity-80" />
          </div>

          <div className="relative z-10 w-full max-w-5xl mx-auto px-6 flex flex-col items-center text-center mt-20">
            <p className="mb-4 text-sm font-bold uppercase tracking-[0.3em] text-[var(--color-accent)] drop-shadow-[0_0_10px_rgba(var(--color-accent-rgb),0.5)]">
              Pilar · Buenos Aires
            </p>
            <h1 className="text-7xl sm:text-8xl md:text-9xl font-black uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-white/40 drop-shadow-2xl">
              {futbol.title}
            </h1>
            <p className="mt-6 max-w-2xl text-lg sm:text-xl text-white/70 font-medium leading-relaxed">
              {futbol.intro}
            </p>

            <div className="mt-12 flex flex-wrap justify-center gap-4">
              <div className="flex items-center gap-3 px-6 py-3 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
                <span className="text-white font-bold tracking-widest uppercase">7v7</span>
                <span className="text-white/40 text-xs uppercase tracking-widest">Formato</span>
              </div>
              <div className="flex items-center gap-3 px-6 py-3 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
                <span className="text-white font-bold tracking-widest uppercase">M/F</span>
                <span className="text-white/40 text-xs uppercase tracking-widest">Categorías</span>
              </div>
              <div className="flex items-center gap-3 px-6 py-3 rounded-full border border-[var(--color-accent)]/30 bg-[var(--color-accent)]/10 backdrop-blur-md shadow-[0_0_20px_rgba(var(--color-accent-rgb),0.15)]">
                <span className="w-2 h-2 rounded-full bg-[var(--color-accent)] animate-pulse" />
                <span className="text-[var(--color-accent)] font-bold tracking-widest uppercase text-sm">
                  Inscripción 2026 Abierta
                </span>
              </div>
            </div>

            <div className="mt-12 flex flex-wrap justify-center gap-4">
              <Button href={buildWhatsAppUrl(futbol.cta.message)} className="px-8 h-14 text-sm">
                {futbol.cta.label}
              </Button>
              <Button
                href="#torneos"
                variant="secondary"
                className="px-8 h-14 text-sm border-white/20 bg-white/5 backdrop-blur-md hover:bg-white/10 hover:border-white/40 transition-all"
              >
                Ver torneos activos
              </Button>
            </div>
          </div>
        </div>

        <SectionShell id="torneos" className="border-t border-white/5 py-12 sm:py-14 lg:py-16">
          <div className="grid gap-6 border-b border-white/8 pb-8 lg:grid-cols-[0.82fr_1.18fr] lg:items-end">
            <SectionHeading
              kicker="Competencia"
              title="Torneos activos"
            />
            <p className="max-w-2xl text-[var(--color-muted)] lg:justify-self-end">
              Un resumen rápido de los torneos que están publicados o en juego.
              El fixture completo, posiciones e historial viven en la sección de
              torneos.
            </p>
          </div>

          {tournaments.length === 0 ? (
            <div className="mt-8 rounded-lg border border-white/8 bg-white/[0.025] px-5 py-8">
              <h3 className="text-display-sm text-2xl">
                Torneos próximamente
              </h3>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--color-muted)]">
                Cuando haya torneos activos, este espacio va a mostrar la
                síntesis pública y el acceso al detalle.
              </p>
            </div>
          ) : (
            <div className="mt-8 grid gap-5 lg:grid-cols-2">
              {tournaments.map((tournament) => (
                <TournamentSummaryCard
                  key={tournament.id}
                  tournament={tournament}
                />
              ))}
            </div>
          )}
          <Button href="/futbol/torneos" variant="secondary" className="mt-8">
            Ver todos los torneos
          </Button>
        </SectionShell>

        <SectionShell className="border-t border-white/5 bg-[var(--color-surface)] py-10 sm:py-12 lg:py-14">
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {futbol.points.map((p) => (
              <div key={p.title}>
                <h3 className="text-display-sm text-lg">{p.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--color-muted)]">
                  {p.body}
                </p>
              </div>
            ))}
          </div>
        </SectionShell>
      </main>
      <Footer />
      <WhatsAppButton 
        label="Consultas Fútbol" 
        message="Hola! Tengo una consulta sobre fútbol 7." 
      />
    </>
  );
}
