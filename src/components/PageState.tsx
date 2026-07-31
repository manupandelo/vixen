import type { ReactNode } from "react";
import Image from "next/image";

import { Button } from "@/components/Button";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Sponsors } from "@/components/Sponsors";

type PageStateProps = {
  code: string;
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
  fallbackHref: string;
  fallbackLabel: string;
};

export function PageState({
  code,
  eyebrow,
  title,
  description,
  action,
  fallbackHref,
  fallbackLabel,
}: PageStateProps) {
  return (
    <>
      <Header />
      <main className="overflow-hidden">
        <section className="relative px-5 py-10 sm:px-8 sm:py-14 lg:py-16">
          <div className="mx-auto w-full max-w-7xl">
            <section
              aria-labelledby="page-state-title"
              className="relative grid overflow-hidden border-y border-white/8 lg:min-h-[38rem] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]"
            >
              <div className="relative z-10 flex flex-col bg-[var(--color-base)] px-1 py-10 sm:px-8 sm:py-12 lg:px-12 lg:py-14">
                <div>
                  <div className="flex items-center gap-3">
                    <span
                      aria-hidden="true"
                      className="h-px w-9 bg-[var(--color-accent)]"
                    />
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-accent)]">
                      {eyebrow}
                    </p>
                  </div>

                  <h1
                    id="page-state-title"
                    className="mt-8 max-w-[11ch] font-[family-name:var(--font-display-family)] text-[clamp(3rem,4.4vw,4.5rem)] font-black uppercase leading-[0.9] tracking-[-0.04em] text-balance"
                  >
                    {title}
                  </h1>
                  <p className="mt-7 max-w-[31rem] border-l border-[var(--color-accent)]/35 pl-5 text-[1rem]/7 text-[#aab2ac] text-pretty">
                    {description}
                  </p>
                </div>

                <div className="mt-12">
                  <div className="flex flex-wrap gap-3">
                    {action}
                    <Button
                      href={fallbackHref}
                      variant={action ? "secondary" : "primary"}
                      className="min-w-40"
                    >
                      {fallbackLabel}
                    </Button>
                  </div>
                  <p className="mt-7 text-xs uppercase tracking-[0.16em] text-white/36">
                    Vixen Club · Pilar
                  </p>
                </div>
              </div>

              <div
                aria-hidden="true"
                className="relative min-h-[24rem] overflow-hidden border-t border-white/8 lg:min-h-full lg:border-l lg:border-t-0"
              >
                <Image
                  src="/vixen1.jpg"
                  alt=""
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 52vw"
                  className="object-cover object-[center_80%] saturate-[0.78] contrast-[1.08]"
                />
                <div className="absolute inset-0 bg-[linear-gradient(90deg,var(--color-base)_0%,rgb(8_15_10_/_0.58)_20%,rgb(8_15_10_/_0.16)_68%,rgb(8_12_9_/_0.48)_100%)]" />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgb(9_11_10_/_0.12),rgb(5_10_7_/_0.7))]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_24%,rgb(60_191_113_/_0.13),transparent_38%)]" />

                <span className="absolute right-5 top-5 text-xs font-semibold uppercase tracking-[0.18em] text-white/68 sm:right-8 sm:top-8">
                  Página fuera de juego
                </span>
                <span className="absolute -bottom-[0.08em] right-3 font-[family-name:var(--font-display-family)] text-[clamp(8rem,20vw,16rem)] font-black leading-none tracking-[-0.08em] text-white/[0.19] sm:right-7">
                  {code}
                </span>

                <div className="absolute bottom-8 left-6 flex items-center gap-3 text-[var(--color-accent)] sm:bottom-10 sm:left-8">
                  <span className="h-2 w-2 bg-current" />
                  <span className="text-xs font-semibold uppercase tracking-[0.18em]">
                    Encontrá tu próximo partido
                  </span>
                </div>
              </div>
            </section>
          </div>
        </section>
      </main>
      <Sponsors />
      <Footer />
    </>
  );
}
