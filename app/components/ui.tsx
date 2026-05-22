import type { ReactNode } from "react";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger" | "ghost";
};

export function Button({
  className = "",
  variant = "primary",
  ...props
}: ButtonProps) {
  const variants = {
    primary:
      "border-transparent bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)]",
    secondary:
      "border-[var(--line)] bg-[var(--surface)] text-[var(--text-primary)] hover:bg-[var(--background)]",
    danger:
      "border-transparent bg-[var(--danger)] text-white hover:bg-[var(--danger-hover)]",
    ghost:
      "border-transparent bg-transparent text-[var(--text-secondary)] hover:bg-[var(--background)]",
  };

  return (
    <button
      className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-[var(--radius-base)] border px-3 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-55 ${variants[variant]} ${className}`}
      {...props}
    />
  );
}

export function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="grid gap-2 text-sm font-medium text-[var(--text-primary)]">
      <span>{label}</span>
      {children}
      {error ? <span className="text-xs text-[var(--danger)]">{error}</span> : null}
    </label>
  );
}

export const inputClass =
  "min-h-10 w-full rounded-[var(--radius-md)] border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text-primary)] shadow-sm transition placeholder:text-[var(--text-muted)] focus:border-[var(--primary)]";

export function Panel({
  title,
  description,
  action,
  children,
  className = "",
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-[var(--radius-lg)] border border-[var(--line)] bg-[var(--surface)] shadow-sm ${className}`}
    >
      {title || description || action ? (
        <div className="flex flex-col gap-3 border-b border-[var(--line)] px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            {title ? (
              <h2 className="text-base font-semibold text-[var(--text-primary)]">{title}</h2>
            ) : null}
            {description ? (
              <p className="mt-1 text-sm text-[var(--text-secondary)]">{description}</p>
            ) : null}
          </div>
          {action}
        </div>
      ) : null}
      <div className="p-5">{children}</div>
    </section>
  );
}

export function StatusBadge({
  tone,
  children,
}: {
  tone: "success" | "warning" | "danger" | "neutral";
  children: ReactNode;
}) {
  const tones = {
    success:
      "border-[color-mix(in_srgb,var(--success)_24%,white)] bg-[color-mix(in_srgb,var(--success)_10%,white)] text-[var(--success)]",
    warning:
      "border-[color-mix(in_srgb,var(--warning)_32%,white)] bg-[color-mix(in_srgb,var(--warning)_12%,white)] text-[var(--warning)]",
    danger:
      "border-[color-mix(in_srgb,var(--danger)_24%,white)] bg-[color-mix(in_srgb,var(--danger)_10%,white)] text-[var(--danger)]",
    neutral:
      "border-[var(--line)] bg-[var(--surface)] text-[var(--text-secondary)]",
  };

  return (
    <span
      className={`inline-flex w-fit items-center rounded-[var(--radius-sm)] border px-2.5 py-1 text-xs font-semibold ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

export function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-dashed border-[var(--line)] bg-[var(--surface)] p-8 text-center">
      <h3 className="text-sm font-semibold text-[var(--text-primary)]">{title}</h3>
      <p className="mt-2 text-sm text-[var(--text-secondary)]">{description}</p>
    </div>
  );
}

export function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="rounded-[var(--radius-base)] border border-[color-mix(in_srgb,var(--danger)_24%,white)] bg-[color-mix(in_srgb,var(--danger)_10%,white)] px-4 py-3 text-sm font-medium text-[var(--danger)]">
      {message}
    </div>
  );
}

export function LoadingRows({ rows = 4 }: { rows?: number }) {
  return (
    <div className="grid gap-3">
      {Array.from({ length: rows }).map((_, index) => (
        <div
          className="h-12 animate-pulse rounded-[var(--radius-md)] bg-[var(--background)]"
          key={index}
        />
      ))}
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <header className="mb-6">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--primary)]">
        {eyebrow}
      </p>
      <h1 className="mt-2 text-2xl font-semibold text-[var(--text-primary)] sm:text-3xl">
        {title}
      </h1>
      <p className="mt-2 max-w-3xl text-sm leading-[1.6] text-[var(--text-secondary)]">
        {description}
      </p>
    </header>
  );
}
