import { content } from "@/content";
import { Button } from "@/components/Button";
import { VenueImage } from "@/components/VenueImage";

export function Hero() {
  const { hero } = content;

  return (
    <section
      aria-label="Presentación del club"
      className="relative overflow-hidden bg-[radial-gradient(circle_at_top,color-mix(in_srgb,var(--color-accent)_18%,transparent),transparent_34%),linear-gradient(180deg,var(--color-surface-2),var(--color-base)_42%)] px-4 pb-10 pt-7 sm:px-8 lg:pb-14 lg:pt-8"
    >
      <div className="mx-auto grid max-w-7xl gap-8 lg:min-h-[calc(100vh-5.5rem)] lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)] lg:items-center lg:gap-14">
        <div className="relative z-10 min-w-0 lg:pr-4">
          <p className="mb-4 text-[0.92rem] font-semibold uppercase tracking-[0.22em] text-[var(--color-accent)] sm:text-sm sm:tracking-[0.3em]">
            {hero.kicker}
          </p>
          <h1 className="text-display max-w-2xl text-balance text-[clamp(2.35rem,9vw,5.45rem)] leading-[0.92]">
            {hero.title}
          </h1>
          <p className="mt-5 max-w-md text-[1.05rem] text-[var(--color-muted)] sm:text-[1.1rem]">
            {hero.subtitle}
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row lg:mt-8">
            <Button href={hero.primaryCta.href} className="w-full sm:w-auto">
              {hero.primaryCta.label}
            </Button>
            <Button href={hero.secondaryCta.href} variant="secondary" className="w-full sm:w-auto">
              {hero.secondaryCta.label}
            </Button>
          </div>

          <div className="mt-8 border-t border-white/10 pt-5">
            <ul
              aria-label="Datos del club"
              className="grid gap-3 min-[420px]:grid-cols-2"
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
          objectPosition="center 62%"
          className="aspect-[5/4] min-h-[19rem] shadow-[0_30px_80px_rgba(0,0,0,0.28)] sm:min-h-[22rem] lg:aspect-[6/5] lg:min-h-[34rem]"
        />
      </div>
    </section>
  );
}
