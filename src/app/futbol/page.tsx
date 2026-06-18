import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { SectionShell } from "@/components/SectionShell";
import { SectionHeading } from "@/components/SectionHeading";
import { Stat } from "@/components/Stat";
import { Button } from "@/components/Button";
import { ImagePlaceholder } from "@/components/ImagePlaceholder";
import { content } from "@/content";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "Fútbol 7 — Vixen Club",
  description:
    "Torneos de fútbol 7 masculino y femenino en Pilar. Inscripción temporada 2026.",
};

export default function FutbolPage() {
  const { futbol } = content;
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
          <div className="mt-10 flex gap-10">
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
          <div className="grid gap-8 md:grid-cols-3">
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
      </main>
      <Footer />
      <WhatsAppButton />
    </>
  );
}
