import { content } from "@/content";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { Button } from "@/components/Button";

export function Hero() {
  const { hero } = content;
  return (
    <section className="relative flex min-h-[88vh] items-center overflow-hidden bg-gradient-to-br from-[var(--color-surface)] via-[var(--color-base)] to-[var(--color-base)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(198,240,0,0.15),transparent_55%)]" />
      <div className="relative mx-auto w-full max-w-6xl px-5 py-24 sm:px-8">
        <p className="mb-4 text-sm font-semibold uppercase tracking-[0.3em] text-[var(--color-accent)]">
          {hero.kicker}
        </p>
        <h1 className="text-display max-w-4xl whitespace-pre-line">
          {hero.title}
        </h1>
        <p className="mt-6 max-w-xl text-lg text-[var(--color-muted)]">
          {hero.subtitle}
        </p>
        <div className="mt-10 flex flex-wrap gap-4">
          <Button href={buildWhatsAppUrl(hero.primaryCta.message)}>
            {hero.primaryCta.label}
          </Button>
          <Button
            href={buildWhatsAppUrl(hero.secondaryCta.message)}
            variant="secondary"
          >
            {hero.secondaryCta.label}
          </Button>
        </div>
      </div>
    </section>
  );
}
