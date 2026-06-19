import Image from "next/image";
import { content } from "@/content";

export function WhatsAppButton() {
  return (
    <a
      href={content.hero.primaryCta.href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Escribinos por WhatsApp"
      className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-3 rounded-md border border-[#25D366]/30 bg-[linear-gradient(135deg,#25D366,#17A884)] px-3 py-3 text-white shadow-[0_16px_34px_rgba(23,168,132,0.22)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_20px_42px_rgba(23,168,132,0.3)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-base)]"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-sm bg-white/14">
        <Image
          src="/whatsapp-color-svgrepo-com.svg"
          alt="WhatsApp"
          width={24}
          height={24}
          className="h-6 w-6"
        />
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
