import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { SectionShell } from "@/components/SectionShell";
import { SectionHeading } from "@/components/SectionHeading";
import { Stat } from "@/components/Stat";
import { Button } from "@/components/Button";
import { ImagePlaceholder } from "@/components/ImagePlaceholder";
import { PublicTournamentPanel } from "@/components/football/PublicTournamentPanel";
import { content } from "@/content";
import { getPublicFootballTournaments } from "@/features/football-tournaments/data";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "Fútbol 7 — Vixen Club",
  description:
    "Torneos de fútbol 7 masculino y femenino en Pilar. Inscripción temporada 2026.",
};

export default async function FutbolPage() {
  const { futbol } = content;
  const tournaments = await getPublicFootballTournaments();

  return (
    <>
      <Header />
      <main>
        <SectionShell className="pt-28">
          <SectionHeading
            kicker="Pilar · Buenos Aires"
            title={futbol.title}
            as="h1"
          />
          <p className="mt-4 max-w-2xl text-lg text-[var(--color-muted)]">
            {futbol.intro}
          </p>
          <div className="mt-10 flex flex-wrap gap-10">
            <Stat value="7v7" label="Formato" />
            <Stat value="M/F" label="Categorías" />
            <Stat value="2026" label="Inscripción" />
          </div>
          <ImagePlaceholder
            tone="accent"
            label="Fútbol 7"
            className="mt-10 aspect-[21/9] w-full"
          />
        </SectionShell>

        <SectionShell className="border-t border-white/5 bg-[var(--color-surface)]">
          <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-4">
            {futbol.points.map((p) => (
              <div key={p.title}>
                <h3 className="text-display-sm text-xl">{p.title}</h3>
                <p className="mt-2 text-[var(--color-muted)]">{p.body}</p>
              </div>
            ))}
          </div>
          <Button href={buildWhatsAppUrl(futbol.cta.message)} className="mt-10">
            {futbol.cta.label}
          </Button>
        </SectionShell>

        <SectionShell id="torneos" className="border-t border-white/5">
          <div className="grid gap-6 border-b border-white/8 pb-8 lg:grid-cols-[0.82fr_1.18fr] lg:items-end">
            <SectionHeading
              kicker="Torneos publicados"
              title="Fixture y posiciones"
            />
            <p className="max-w-2xl text-[var(--color-muted)] lg:justify-self-end">
              Seguimiento público de tablas, próximos partidos y resultados
              recientes de los torneos de fútbol activos en Vixen Club.
            </p>
          </div>

          {tournaments.length === 0 ? (
            <div className="mt-8 rounded-lg border border-white/8 bg-white/[0.025] px-5 py-8">
              <h3 className="text-display-sm text-2xl">
                Fixture y resultados próximamente
              </h3>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--color-muted)]">
                Cuando haya torneos publicados, este espacio va a mostrar la
                tabla de posiciones, los próximos partidos y los últimos
                resultados.
              </p>
            </div>
          ) : (
            <div className="mt-8 space-y-10">
              {tournaments.map((tournament) => (
                <PublicTournamentPanel
                  key={tournament.id}
                  tournament={tournament}
                />
              ))}
            </div>
          )}
        </SectionShell>
      </main>
      <Footer />
      <WhatsAppButton />
    </>
  );
}
