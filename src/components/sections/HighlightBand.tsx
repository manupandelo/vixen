import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { SectionShell } from "@/components/SectionShell";
import { SectionHeading } from "@/components/SectionHeading";
import { ImagePlaceholder } from "@/components/ImagePlaceholder";
import { Button } from "@/components/Button";

type BandData = {
  title: string;
  intro: string;
  points: { title: string; body: string }[];
  cta: { label: string; message: string };
};

export function HighlightBand({
  data,
  reverse = false,
  tone = "accent",
}: {
  data: BandData;
  reverse?: boolean;
  tone?: "accent" | "warm";
}) {
  return (
    <SectionShell className="border-t border-white/5">
      <div className="grid items-center gap-10 md:grid-cols-2">
        <div className={reverse ? "md:order-2" : ""}>
          <SectionHeading kicker="Disciplina" title={data.title} />
          <p className="mt-4 text-[var(--color-muted)]">{data.intro}</p>
          <ul className="mt-6 space-y-4">
            {data.points.map((p) => (
              <li key={p.title}>
                <p className="font-semibold">{p.title}</p>
                <p className="text-sm text-[var(--color-muted)]">{p.body}</p>
              </li>
            ))}
          </ul>
          <Button
            href={buildWhatsAppUrl(data.cta.message)}
            className="mt-8"
          >
            {data.cta.label}
          </Button>
        </div>
        <ImagePlaceholder
          tone={tone}
          label={data.title}
          className={`aspect-[4/5] w-full ${reverse ? "md:order-1" : ""}`}
        />
      </div>
    </SectionShell>
  );
}
