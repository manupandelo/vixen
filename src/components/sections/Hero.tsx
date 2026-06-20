import { content } from "@/content";
import { Button } from "@/components/Button";
import { VenueImage } from "@/components/VenueImage";

export function Hero() {
  const { hero } = content;

  return (
    <section
      aria-label="Presentación del club"
      className="relative overflow-hidden bg-[radial-gradient(circle_at_top,color-mix(in_srgb,var(--color-accent)_18%,transparent),transparent_34%),linear-gradient(180deg,var(--color-surface-2),var(--color-base)_42%)] px-5 pb-12 pt-8 sm:px-8 lg:pb-18 lg:pt-8"
    >
      <div className="mx-auto grid max-w-7xl gap-8 lg:min-h-[calc(100vh-5.5rem)] lg:grid-cols-[minmax(0,0.86fr)_minmax(0,1.14fr)] lg:items-center lg:gap-16">
        <div className="relative z-10 lg:pr-4">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.3em] text-[var(--color-accent)]">
            {hero.kicker}
          </p>
          <h1 className="text-display max-w-3xl text-balance text-[clamp(3rem,7vw,5.9rem)] leading-[0.92]">
            {hero.title}
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-[var(--color-muted)] sm:text-xl">
            {hero.subtitle}
          </p>
          <div className="mt-8 flex flex-wrap gap-3 lg:mt-9">
            <Button href={hero.primaryCta.href}>{hero.primaryCta.label}</Button>
            <Button href={hero.secondaryCta.href} variant="secondary">
              {hero.secondaryCta.label}
            </Button>
          </div>

          <div className="mt-10 border-t border-white/10 pt-5">
            <ul
              aria-label="Datos del club"
              className="grid gap-4 sm:grid-cols-2"
            >
              {hero.proof.map((item) => (
                <li key={item} className="list-none border-l border-white/10 pl-4">
                  <span className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-white/72">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <VenueImage
          src={hero.image.src}
          alt={hero.image.alt}
          priority
          overlay
          className="aspect-[4/5] min-h-[24rem] shadow-[0_30px_80px_rgba(0,0,0,0.28)] lg:aspect-[4/5] lg:min-h-[38rem]"
        />
      </div>
    </section>
  );
}
