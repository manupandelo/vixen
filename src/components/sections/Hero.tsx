"use client";

import { motion } from "framer-motion";
import { content } from "@/content";
import { Button } from "@/components/Button";
import { VenueImage } from "@/components/VenueImage";

export function Hero() {
  const { hero } = content;

  return (
    <section aria-label="Presentación del club" className="relative w-full min-h-[85vh] flex items-center justify-center overflow-hidden border-b border-white/5">
      <div className="absolute inset-0 z-0">
        <VenueImage
          src={hero.image.src}
          alt={hero.image.alt}
          priority
          overlay
          objectPosition="center 62%"
          className="w-full h-full object-cover opacity-100"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#090b0a] via-[#090b0a]/20 to-transparent" />
      </div>

      <div className="relative z-10 w-full max-w-5xl mx-auto px-6 flex flex-col items-center text-center mt-20">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.6 }}
          className="mb-4 text-sm font-bold uppercase tracking-[0.3em] text-[var(--color-accent)] drop-shadow-[0_0_10px_rgba(var(--color-accent-rgb),0.5)]"
        >
          {hero.kicker}
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="text-7xl sm:text-8xl md:text-[8rem] leading-[0.9] font-black uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-white/40 drop-shadow-2xl text-balance"
        >
          {hero.title}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="mt-6 max-w-2xl text-lg sm:text-xl text-white/70 font-medium leading-relaxed"
        >
          {hero.subtitle}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="mt-10 flex flex-wrap justify-center gap-y-2 text-[0.8rem] sm:text-[0.85rem] font-bold uppercase tracking-[0.25em] text-white/70"
        >
          {hero.proof.map((item, index) => (
            <span key={item} className="flex items-center">
              <span>{item}</span>
              {index < hero.proof.length - 1 && (
                <span className="mx-4 text-[var(--color-accent)] opacity-60">•</span>
              )}
            </span>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="mt-12 flex flex-wrap justify-center gap-4"
        >
          <Button href={hero.primaryCta.href} className="px-8 h-14 text-sm">
            {hero.primaryCta.label}
          </Button>
          <Button
            href={hero.secondaryCta.href}
            variant="secondary"
            className="px-8 h-14 text-sm border-white/20 bg-white/5 backdrop-blur-md hover:bg-white/10 hover:border-white/40 transition-all"
          >
            {hero.secondaryCta.label}
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
