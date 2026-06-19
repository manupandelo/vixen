import { content } from "@/content";

export function TrustBand() {
  return (
    <section
      aria-label="Pruebas de confianza"
      className="border-y border-white/5 bg-[var(--color-surface)]/70"
    >
      <div className="content-shell py-5">
        <ul className="metadata-strip">
          {content.trustPills.map((pill) => (
            <li key={pill} className="inline-flex items-center">
              {pill}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
