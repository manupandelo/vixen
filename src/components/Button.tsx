import Link from "next/link";

type Variant = "primary" | "secondary" | "ghost";

const styles: Record<Variant, string> = {
  primary:
    "border border-[var(--color-accent-strong)] bg-[var(--color-accent)] text-[#07110a] hover:bg-[var(--color-accent-strong)] active:scale-[0.98]",
  secondary:
    "border border-white/20 bg-white/[0.03] text-white/90 hover:bg-white/[0.08] hover:text-white active:scale-[0.98]",
  ghost:
    "text-white/60 hover:text-[var(--color-accent)] hover:bg-white/5 active:scale-[0.98]",
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
  const cls = `inline-flex min-h-[44px] items-center justify-center rounded-lg px-5 py-2.5 text-[0.95rem] font-bold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-base)] ${styles[variant]} ${className}`;
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
