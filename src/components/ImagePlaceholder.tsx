const tones: Record<"accent" | "warm" | "neutral", string> = {
  accent: "from-[var(--color-accent)]/30 to-[var(--color-surface)]",
  warm: "from-[var(--color-warm)]/30 to-[var(--color-surface)]",
  neutral: "from-[var(--color-surface)] to-[var(--color-base)]",
};

export function ImagePlaceholder({
  label,
  className = "",
  tone = "neutral",
}: {
  label?: string;
  className?: string;
  tone?: "accent" | "warm" | "neutral";
}) {
  return (
    <div
      role="img"
      aria-label={label ?? "Imagen de Vixen Club"}
      className={`flex items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br ${tones[tone]} ${className}`}
    >
      {label && (
        <span className="text-xs uppercase tracking-[0.3em] text-[var(--color-muted)]">
          {label}
        </span>
      )}
    </div>
  );
}
