import Link from "next/link";

type Variant = "primary" | "secondary" | "ghost";

const styles: Record<Variant, string> = {
  primary:
    "border border-[color-mix(in_srgb,var(--color-accent)_72%,black)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--color-accent)_92%,white_8%),var(--color-accent))] text-[#07110a] shadow-[0_10px_24px_rgb(60_191_113_/_0.12)] hover:-translate-y-px hover:border-[var(--color-accent-strong)] hover:bg-[linear-gradient(180deg,var(--color-accent-strong),var(--color-accent))]",
  secondary:
    "border border-white/12 bg-white/[0.025] text-white/84 hover:-translate-y-px hover:border-white/22 hover:bg-white/[0.05] hover:text-white",
  ghost:
    "text-[var(--color-ink)] hover:text-[var(--color-accent)] hover:opacity-100",
};

export function Button({
  href,
  variant = "primary",
  children,
  className = "",
}: {
  href: string;
  variant?: Variant;
  children: React.ReactNode;
  className?: string;
}) {
  const isExternal = href.startsWith("http");
  const cls = `inline-flex items-center justify-center rounded-[0.95rem] px-5 py-3 text-sm font-semibold uppercase tracking-[0.14em] transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-base)] ${styles[variant]} ${className}`;
  if (isExternal) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={cls}>
      {children}
    </Link>
  );
}
