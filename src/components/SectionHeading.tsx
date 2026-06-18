export function SectionHeading({
  kicker,
  title,
  align = "left",
}: {
  kicker?: string;
  title: string;
  align?: "left" | "center";
}) {
  return (
    <div className={align === "center" ? "text-center" : "text-left"}>
      {kicker && (
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-accent)]">
          {kicker}
        </p>
      )}
      <h2 className="text-display-sm">{title}</h2>
    </div>
  );
}
