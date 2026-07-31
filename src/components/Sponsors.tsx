import Image from "next/image";

import { content } from "@/content";

export function Sponsors() {
  const { site } = content;

  return (
    <section
      aria-labelledby="sponsors-title"
      className="border-t border-white/7 bg-[var(--color-surface)]"
    >
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid border-x border-white/7 lg:grid-cols-[minmax(13rem,0.7fr)_minmax(0,2.3fr)]">
          <div className="flex flex-col justify-center border-b border-white/7 px-6 py-7 sm:px-8 lg:border-b-0 lg:border-r lg:py-9">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-accent)]">
              Juegan con nosotros
            </p>
            <h2
              id="sponsors-title"
              className="mt-2 max-w-xs text-xl font-semibold tracking-[-0.02em] text-white"
            >
              Marcas que acompañan al club
            </h2>
          </div>

          <ul
            aria-label="Sponsors oficiales"
            className="grid grid-cols-2 sm:grid-cols-4"
          >
            {site.sponsors.map((sponsor, index) => (
              <li
                key={sponsor.name}
                className={`group relative flex min-h-28 items-center justify-center px-6 py-7 transition-colors duration-300 hover:bg-white/[0.035] sm:min-h-32 ${
                  index % 2 === 0 ? "border-r border-white/7" : ""
                } ${
                  index < 2 ? "border-b border-white/7 sm:border-b-0" : ""
                } ${
                  index < site.sponsors.length - 1
                    ? "sm:border-r sm:border-white/7"
                    : ""
                }`}
              >
                <Image
                  src={sponsor.logo}
                  alt={sponsor.name}
                  width={sponsor.width}
                  height={sponsor.height}
                  sizes="(max-width: 640px) 35vw, 12rem"
                  className={`max-h-[3.5rem] sm:max-h-[4.5rem] w-[80%] max-w-[140px] object-contain opacity-90 saturate-50 sm:opacity-70 sm:saturate-0 sm:grayscale transition-all duration-300 group-hover:opacity-100 group-hover:saturate-100 group-hover:grayscale-0 ${
                    sponsor.invert ? "brightness-0 invert group-hover:brightness-100 group-hover:invert-0" : ""
                  }`}
                />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
