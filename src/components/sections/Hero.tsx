import { content } from "@/content";
import { Button } from "@/components/Button";
import { VenueImage } from "@/components/VenueImage";

export function Hero() {
  const { hero } = content;

  return (
    <section className="relative overflow-hidden bg-[radial-gradient(circle_at_top,rgba(198,240,0,0.14),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.03),transparent_40%)] px-5 pb-10 pt-8 sm:px-8 lg:pb-16">
      <div className="mx-auto grid max-w-6xl gap-8 lg:min-h-[calc(100vh-7rem)] lg:grid-cols-[minmax(0,0.98fr)_minmax(0,1.02fr)] lg:items-center lg:gap-12">
        <div className="relative z-10">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.3em] text-[var(--color-accent)]">
            {hero.kicker}
          </p>
          <h1 className="text-display max-w-3xl text-balance">{hero.title}</h1>
          <p className="mt-6 max-w-xl text-lg text-[var(--color-muted)]">
            {hero.subtitle}
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Button href={hero.primaryCta.href}>{hero.primaryCta.label}</Button>
            <Button href={hero.secondaryCta.href} variant="secondary">
              {hero.secondaryCta.label}
            </Button>
          </div>
          <ul
            aria-label="Pruebas rápidas"
            className="metadata-strip mt-8"
          >
            {hero.proof.map((item) => (
              <li key={item} className="inline-flex items-center">
                {item}
              </li>
            ))}
          </ul>
        </div>

        <VenueImage
          src={hero.image.src}
          alt={hero.image.alt}
          priority
          overlay
          className="aspect-[4/5] min-h-[24rem] lg:aspect-[5/6]"
        />
      </div>
    </section>
  );
}
