import { content } from "@/content";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";

export function WhatsAppButton() {
  return (
    <a
      href={content.hero.primaryCta.href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Escribinos por WhatsApp"
      className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-3 rounded-md border border-[#25D366]/35 bg-[linear-gradient(135deg,#25D366,#128C7E)] px-3 py-3 text-white shadow-[0_18px_40px_rgba(18,140,126,0.32)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_22px_48px_rgba(18,140,126,0.42)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-base)]"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-sm bg-white/12">
        <WhatsAppIcon className="h-6 w-6 text-white" />
      </span>
      <span className="hidden pr-1 sm:block">
        <span className="block text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-white/72">
          Vixen Club
        </span>
        <span className="block text-sm font-semibold">WhatsApp</span>
      </span>
    </a>
  );
}
