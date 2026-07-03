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
      className="fixed bottom-[calc(env(safe-area-inset-bottom)+0.85rem)] right-[calc(env(safe-area-inset-right)+0.85rem)] z-40 inline-flex items-center gap-3 rounded-full border border-white/10 bg-[color-mix(in_srgb,var(--color-surface)_82%,var(--color-accent)_18%)] px-2.5 py-2.5 text-[var(--color-ink)] shadow-[0_18px_38px_rgba(0,0,0,0.34)] backdrop-blur-xl transition duration-200 hover:-translate-y-0.5 hover:border-[var(--color-accent)]/35 hover:bg-[color-mix(in_srgb,var(--color-surface)_78%,var(--color-accent)_22%)] hover:shadow-[0_22px_44px_rgba(0,0,0,0.38)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-base)] sm:bottom-[calc(env(safe-area-inset-bottom)+1.25rem)] sm:right-[calc(env(safe-area-inset-right)+1.25rem)] sm:px-3.5 sm:py-3"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-[var(--color-base)]/36">
        <Image
          src="/whatsapp-color-svgrepo-com.svg"
          alt="WhatsApp"
          width={24}
          height={24}
          className="h-5 w-5"
        />
      </span>
      <span className="hidden flex-col pr-1 leading-tight sm:flex">
        <span className="hidden text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-white/58 sm:block">
          Respuesta por WhatsApp
        </span>
        <span className="block text-sm font-semibold text-white">{label}</span>
      </span>
    </a>
  );
}
