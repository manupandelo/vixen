import { content } from "@/content";

export function Sponsors() {
  const { site } = content;
  
  return (
    <section className="border-t border-white/5 bg-[#0a0d0b] py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <h3 className="text-sm font-bold text-white mb-6 text-center sm:text-left">
          Sponsors Oficiales
        </h3>
        <ul
          aria-label="Sponsors"
          className="flex flex-wrap items-center justify-center sm:justify-start gap-4 sm:gap-6"
        >
          {site.sponsors.map((sponsor) => (
            <li 
              key={sponsor} 
              className="relative w-28 h-14 sm:w-32 sm:h-16 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden hover:bg-white/10 transition-colors cursor-pointer"
            >
              <span className="text-sm font-bold text-white/40 text-center">{sponsor}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
