import { content } from "@/content";
import { Button } from "@/components/Button";
import { VenueImage } from "@/components/VenueImage";

export function Hero() {
  const { hero } = content;

  return (
    <section
      aria-label="Presentación del club"
      className="relative overflow-hidden bg-[radial-gradient(circle_at_top,rgba(198,240,0,0.18),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.05),transparent_42%)] px-5 pb-12 pt-8 sm:px-8 lg:pb-20 lg:pt-10"
    >
      <div className="mx-auto grid max-w-6xl gap-8 lg:min-h-[calc(100vh-5.5rem)] lg:grid-cols-[minmax(0,0.94fr)_minmax(0,1.06fr)] lg:items-center lg:gap-14">
        <div className="relative z-10 lg:pr-4">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.3em] text-[var(--color-accent)]">
            {hero.kicker}
          </p>
          <h1 className="text-display max-w-3xl text-balance text-[clamp(3.2rem,8vw,6.3rem)] leading-[0.92]">
            {hero.title}
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-[var(--color-muted)] sm:text-xl">
            {hero.subtitle}
          </p>
          <div className="mt-8 flex flex-wrap gap-4 lg:mt-10">
            <Button href={hero.primaryCta.href}>{hero.primaryCta.label}</Button>
            <Button href={hero.secondaryCta.href} variant="secondary">
              {hero.secondaryCta.label}
            </Button>
          </div>
          <div className="mt-8 rounded-[1rem] border border-white/10 bg-white/[0.025] p-4 sm:p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-accent)]">
              Datos del club
            </p>
            <ul aria-label="Datos del club" className="metadata-strip mt-4">
              {hero.proof.map((item) => (
                <li key={item} className="inline-flex items-center">
                  {item}
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
          className="aspect-[4/5] min-h-[26rem] shadow-[0_30px_80px_rgba(0,0,0,0.28)] lg:aspect-[5/6]"
        />
      </div>
    </section>
  );
}
