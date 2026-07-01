import Image from "next/image";

const tones: Record<"accent" | "warm" | "neutral", string> = {
  accent: "from-[var(--color-accent)]/30 to-[var(--color-surface)]",
  warm: "from-[var(--color-warm)]/30 to-[var(--color-surface)]",
  neutral: "from-[var(--color-surface)] to-[var(--color-base)]",
};

const placeholderSrc =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1 1'%3E%3C/svg%3E";

export function ImagePlaceholder({
  label,
  className = "",
  tone = "neutral",
}: {
  label?: string;
  className?: string;
  tone?: "accent" | "warm" | "neutral";
}) {
  const alt = label ?? "Imagen de Vixen Club";

  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br ${tones[tone]} ${className}`}
    >
      <Image
        src={placeholderSrc}
        alt={alt}
        fill
        sizes="100vw"
        unoptimized
        className="object-cover opacity-0"
      />
      {label && (
        <span className="text-xs uppercase tracking-[0.3em] text-[var(--color-muted)]">
          {label}
        </span>
      )}
    </div>
  );
}
