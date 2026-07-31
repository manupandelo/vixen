import { Trophy } from "lucide-react";

/**
 * Cierra la competencia: cuando hay campeón, es lo primero que se tiene que ver.
 */
export function ChampionBanner({
  teamName,
  categoryName,
}: {
  teamName: string;
  categoryName?: string | null;
}) {
  return (
    <section className="flex items-center gap-4 rounded-xl border border-[var(--color-accent)]/35 bg-[var(--color-accent)]/8 p-5 sm:p-6">
      <span className="grid size-14 shrink-0 place-items-center rounded-xl border border-[var(--color-accent)]/40 bg-[var(--color-accent)]/15 text-[var(--color-accent)]">
        <Trophy size={26} aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-accent)]">
          Campeón{categoryName ? ` · ${categoryName}` : ""}
        </p>
        <p className="mt-1 truncate text-2xl font-bold text-white">
          {teamName}
        </p>
      </div>
    </section>
  );
}
