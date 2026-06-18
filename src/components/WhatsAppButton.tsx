import { buildWhatsAppUrl } from "@/lib/whatsapp";

export function WhatsAppButton() {
  return (
    <a
      href={buildWhatsAppUrl("Hola! Quiero más info de Vixen.")}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Escribinos por WhatsApp"
      className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-accent)] text-[var(--color-base)] shadow-lg transition hover:scale-105"
    >
      <span className="text-2xl font-bold">✆</span>
    </a>
  );
}
