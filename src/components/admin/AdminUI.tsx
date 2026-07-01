import Link from "next/link";
import type { ReactNode } from "react";
import { AlertTriangle, ArrowLeft, CheckCircle2, ListChecks } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type AdminPageHeaderProps = {
  eyebrow: string;
  title: string;
  description?: string;
  backHref?: string;
  backLabel?: string;
  actions?: ReactNode;
  meta?: ReactNode;
  renderActions?: () => ReactNode;
  renderMeta?: () => ReactNode;
};

type AdminActionLinkProps = {
  href: string;
  children: ReactNode;
  icon?: ReactNode;
  variant?: "primary" | "secondary" | "quiet" | "danger";
  className?: string;
};

type AdminPanelProps = {
  children: ReactNode;
  className?: string;
};

type AdminMetricProps = {
  label: string;
  value: number | string;
  helper?: string;
};

type AdminStatusPillProps = {
  children: ReactNode;
  tone?: "accent" | "muted" | "warning" | "danger";
};

type AdminEmptyStateProps = {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
};

export type AdminActionItem = {
  title: string;
  description: string;
  href?: string;
  tone?: "accent" | "warning" | "muted";
};

type AdminActionItemListProps = {
  items: AdminActionItem[];
};

export const adminPrimaryActionClass =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-[0.85rem] border border-[color-mix(in_srgb,var(--color-accent)_72%,black)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--color-accent)_92%,white_8%),var(--color-accent))] px-4 py-2.5 text-sm font-semibold text-[#07110a] shadow-[0_10px_24px_rgb(60_191_113_/_0.12)] transition duration-200 hover:-translate-y-px hover:border-[var(--color-accent-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-base)]";

export const adminSecondaryActionClass =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-[0.85rem] border border-white/12 bg-white/[0.03] px-4 py-2.5 text-sm font-semibold text-white/78 transition hover:border-[var(--color-accent)] hover:bg-white/[0.06] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-base)]";

export const adminQuietActionClass =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-[0.75rem] px-3 py-2 text-sm font-semibold text-white/58 transition hover:bg-white/[0.055] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-base)]";

const adminActionClassByVariant: Record<
  NonNullable<AdminActionLinkProps["variant"]>,
  string
> = {
  primary: adminPrimaryActionClass,
  secondary: adminSecondaryActionClass,
  quiet: adminQuietActionClass,
  danger:
    "inline-flex min-h-11 items-center justify-center gap-2 rounded-[0.85rem] border border-[var(--color-warm)]/45 bg-[var(--color-warm)]/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--color-warm)]/18 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-warm)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-base)]",
};

const adminStatusPillToneClass: Record<
  NonNullable<AdminStatusPillProps["tone"]>,
  string
> = {
  accent:
    "border-[var(--color-accent)]/35 bg-[var(--color-accent)]/10 text-[var(--color-accent)]",
  muted: "border-white/12 bg-white/[0.035] text-white/66",
  warning:
    "border-[var(--color-warm)]/35 bg-[var(--color-warm)]/10 text-white/86",
  danger: "border-[var(--color-warm)]/50 bg-[var(--color-warm)]/16 text-white",
};

export function AdminPage({ children }: { children: ReactNode }) {
  return <div className="grid gap-6 sm:gap-7">{children}</div>;
}

export function AdminPageHeader({
  eyebrow,
  title,
  description,
  backHref,
  backLabel,
  actions,
  meta,
  renderActions,
  renderMeta,
}: AdminPageHeaderProps) {
  const headerActions = renderActions ? renderActions() : actions;
  const headerMeta = renderMeta ? renderMeta() : meta;

  return (
    <section className="grid gap-5 border-b border-white/10 pb-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
      <div className="min-w-0">
        {backHref ? (
          <Link href={backHref} className={cn(adminQuietActionClass, "-ml-3 mb-4 w-fit")}>
            <ArrowLeft size={16} aria-hidden="true" />
            {backLabel ?? "Volver"}
          </Link>
        ) : null}
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-accent)] sm:text-sm">
          {eyebrow}
        </p>
        <div className="mt-2 flex flex-wrap items-end gap-3">
          <h1 className="max-w-4xl text-3xl font-semibold tracking-normal text-white sm:text-4xl">
            {title}
          </h1>
          {headerMeta}
        </div>
        {description ? (
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--color-muted)]">
            {description}
          </p>
        ) : null}
      </div>

      {headerActions ? (
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
          {headerActions}
        </div>
      ) : null}
    </section>
  );
}

export function AdminActionLink({
  href,
  children,
  icon,
  variant = "secondary",
  className,
}: AdminActionLinkProps) {
  return (
    <Link href={href} className={cn(adminActionClassByVariant[variant], className)}>
      {icon}
      {children}
    </Link>
  );
}

export function AdminPanel({ children, className }: AdminPanelProps) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-[1rem] border border-white/10 bg-[#101411] shadow-[0_22px_70px_rgb(0_0_0_/_0.18)]",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function AdminMetric({ label, value, helper }: AdminMetricProps) {
  return (
    <div className="rounded-[0.95rem] border border-white/10 bg-white/[0.025] px-4 py-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/48">
        {label}
      </p>
      <p className="mt-2 text-3xl font-semibold text-white">{value}</p>
      {helper ? (
        <p className="mt-1 text-xs leading-5 text-[var(--color-muted)]">
          {helper}
        </p>
      ) : null}
    </div>
  );
}

export function AdminStatusPill({
  children,
  tone = "accent",
}: AdminStatusPillProps) {
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold",
        adminStatusPillToneClass[tone],
      )}
    >
      {children}
    </span>
  );
}

function AdminActionItemIcon({ tone }: { tone: AdminActionItem["tone"] }) {
  if (tone === "warning") {
    return <AlertTriangle size={18} aria-hidden="true" />;
  }

  if (tone === "muted") {
    return <ListChecks size={18} aria-hidden="true" />;
  }

  return <CheckCircle2 size={18} aria-hidden="true" />;
}

export function AdminActionItemList({ items }: AdminActionItemListProps) {
  return (
    <div className="grid gap-3" data-testid="admin-action-item-list">
      {items.map((item) => {
        const tone = item.tone ?? "accent";
        const iconClass =
          tone === "warning"
            ? "text-[var(--color-warm)]"
            : "text-[var(--color-accent)]";
        const className = cn(
          "group rounded-[0.95rem] border p-4 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-base)]",
          tone === "warning"
            ? "border-[var(--color-warm)]/35 bg-[var(--color-warm)]/8 focus-visible:ring-[var(--color-warm)]"
            : "border-white/10 bg-black/16 focus-visible:ring-[var(--color-accent)]",
          item.href
            ? "hover:border-[var(--color-accent)]/35 hover:bg-white/[0.035]"
            : "",
        );
        const content = (
          <div className="flex gap-3">
            <span className={cn("mt-0.5", iconClass)}>
              <AdminActionItemIcon tone={tone} />
            </span>
            <div>
              <p className="font-semibold text-white transition group-hover:text-[var(--color-accent)]">
                {item.title}
              </p>
              <p className="mt-1 text-sm leading-6 text-[var(--color-muted)]">
                {item.description}
              </p>
            </div>
          </div>
        );

        if (item.href) {
          return (
            <Link
              key={`${item.title}-${item.href}`}
              href={item.href}
              className={className}
              data-testid="admin-action-item"
            >
              {content}
            </Link>
          );
        }

        return (
          <div
            key={item.title}
            className={className}
            data-testid="admin-action-item"
          >
            {content}
          </div>
        );
      })}
    </div>
  );
}

export function AdminEmptyState({
  eyebrow,
  title,
  description,
  action,
}: AdminEmptyStateProps) {
  return (
    <AdminPanel className="p-6 sm:p-8">
      <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-accent)] sm:text-sm">
            {eyebrow}
          </p>
          <h2 className="mt-3 text-2xl font-semibold text-white">{title}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-muted)]">
            {description}
          </p>
        </div>
        {action}
      </div>
    </AdminPanel>
  );
}

export function AdminTableHeader({
  children,
  className,
}: {
  children: ReactNode;
  className: string;
}) {
  return (
    <div
      className={cn(
        "hidden gap-4 border-b border-white/10 px-5 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-white/44 lg:grid",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function AdminMobileField({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("grid gap-1", className)}>
      <span className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-white/38 lg:hidden">
        {label}
      </span>
      {children}
    </div>
  );
}
