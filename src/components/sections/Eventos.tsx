import { content } from "@/content";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { SectionShell } from "@/components/SectionShell";
import { SectionHeading } from "@/components/SectionHeading";
import { Button } from "@/components/Button";

export function Eventos() {
  const { eventos } = content;
  return (
    <SectionShell
      id="eventos"
      className="border-t border-white/5 bg-[var(--color-surface)]"
    >
      <div className="max-w-2xl">
        <SectionHeading kicker="Después del partido" title={eventos.title} />
        <p className="mt-4 text-[var(--color-muted)]">{eventos.body}</p>
        <Button href={buildWhatsAppUrl(eventos.cta.message)} className="mt-8">
          {eventos.cta.label}
        </Button>
      </div>
    </SectionShell>
  );
}
