export function SectionHeading({
  kicker,
  title,
  align = "left",
  as: Tag = "h2",
}: {
  kicker?: string;
  title: string;
  align?: "left" | "center";
  as?: "h1" | "h2";
}) {
  return (
    <div className={align === "center" ? "text-center" : "text-left"}>
      {kicker && (
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-accent)]">
          {kicker}
        </p>
      )}
      <Tag className="text-display-sm">{title}</Tag>
    </div>
  );
}
