import Image from "next/image";
import { content } from "@/content";

export function WhatsAppButton({
  message = "Hola! Quiero más info sobre Vixen Club.",
  label = "Hablar con Vixen",
}: {
  message?: string;
  label?: string;
}) {
  const href = `${content.site.whatsappUrl}?text=${encodeURIComponent(message)}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Hablar con Vixen Club por WhatsApp"
      className="fixed bottom-[max(1rem,env(safe-area-inset-bottom)+0.85rem)] right-[max(1rem,env(safe-area-inset-right)+0.85rem)] z-40 inline-flex items-center gap-3 rounded-full border border-white/10 bg-[color-mix(in_srgb,var(--color-surface)_82%,var(--color-accent)_18%)] p-3 text-[var(--color-ink)] shadow-xl backdrop-blur-xl transition duration-200 hover:-translate-y-0.5 hover:border-[var(--color-accent)]/35 hover:bg-[color-mix(in_srgb,var(--color-surface)_78%,var(--color-accent)_22%)] hover:shadow-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-base)] lg:bottom-[max(1.5rem,env(safe-area-inset-bottom)+1.25rem)] lg:right-[max(1.5rem,env(safe-area-inset-right)+1.25rem)] lg:py-2.5 lg:pl-3 lg:pr-4"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-[var(--color-base)]/36 lg:h-9 lg:w-9">
        <Image
          src="/whatsapp-color-svgrepo-com.svg"
          alt="WhatsApp"
          width={24}
          height={24}
          className="h-5 w-5 lg:h-4 lg:w-4"
        />
      </span>
      <span className="hidden flex-col pr-1 leading-tight lg:flex">
        <span className="hidden text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-white/58 lg:block">
          Respuesta por WhatsApp
        </span>
        <span className="block text-[0.8rem] font-semibold text-white">{label}</span>
      </span>
    </a>
  );
}
