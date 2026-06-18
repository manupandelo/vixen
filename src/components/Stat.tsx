export function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="text-display-sm text-[var(--color-accent)]">{value}</p>
      <p className="mt-1 text-sm uppercase tracking-wide text-[var(--color-muted)]">
        {label}
      </p>
    </div>
  );
}
