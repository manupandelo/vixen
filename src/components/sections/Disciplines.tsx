import Link from "next/link";
import { content } from "@/content";
import { SectionShell } from "@/components/SectionShell";
import { SectionHeading } from "@/components/SectionHeading";
import { ImagePlaceholder } from "@/components/ImagePlaceholder";

export function Disciplines() {
  return (
    <SectionShell>
      <SectionHeading kicker="Qué hacemos" title="Elegí tu cancha" />
      <div className="mt-10 grid gap-6 md:grid-cols-2">
        {content.disciplines.map((d) => (
          <Link
            key={d.id}
            href={d.href}
            className="group relative overflow-hidden rounded-2xl border border-white/5 bg-[var(--color-surface)] p-8 transition hover:border-[var(--color-accent)]/60"
          >
            <ImagePlaceholder
              tone={d.id === "futbol" ? "accent" : "warm"}
              className="mb-6 aspect-[16/9]"
              label={d.title}
            />
            <h3 className="text-display-sm text-2xl">{d.title}</h3>
            <p className="mt-2 text-[var(--color-muted)]">{d.blurb}</p>
            <span className="mt-4 inline-block text-sm font-semibold uppercase tracking-wide text-[var(--color-accent)]">
              Ver más →
            </span>
          </Link>
        ))}
      </div>
    </SectionShell>
  );
}
