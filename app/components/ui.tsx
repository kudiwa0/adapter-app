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
    primary: "border-transparent bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)]",
    secondary: "border-[var(--line)] bg-[var(--surface)] text-[var(--text-primary)] hover:bg-[var(--background)]",
    danger: "border-transparent bg-[var(--danger)] text-white hover:bg-[var(--danger-hover)]",
ghost: "border-transparent bg-transparent text-[var(--text-secondary)] hover:bg-[var(--background)]",
   };

  return (
    <button
      className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-55 ${variants[variant]} ${className}`}
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
    <label className="grid gap-2 text-sm font-medium text-[#2d392f]">
      <span>{label}</span>
      {children}
      {error ? <span className="text-xs text-[#b42318]">{error}</span> : null}
    </label>
  );
}

export const inputClass =
  "min-h-10 w-full rounded-md border border-[#cbd8cc] bg-white px-3 py-2 text-sm text-[#17201b] shadow-sm transition placeholder:text-[#758176] focus:border-[#2f6b4f]";

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
      className={`rounded-lg border border-[#d8e1d8] bg-white shadow-[0_18px_50px_rgba(23,32,27,0.06)] ${className}`}
    >
      {title || description || action ? (
        <div className="flex flex-col gap-3 border-b border-[#e3e9e3] px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            {title ? (
              <h2 className="text-base font-semibold text-[#17201b]">{title}</h2>
            ) : null}
            {description ? (
              <p className="mt-1 text-sm text-[#637166]">{description}</p>
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
    success: "border-[#bfe6d5] bg-[#e9f8f1] text-[#13795b]",
    warning: "border-[#f4d8a8] bg-[#fff6e6] text-[#8a4b05]",
    danger: "border-[#f3c1bd] bg-[#fff0ee] text-[#b42318]",
    neutral: "border-[#d8e1d8] bg-[#f5f8f4] text-[#4c5b4f]",
  };

  return (
    <span
      className={`inline-flex w-fit items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${tones[tone]}`}
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
    <div className="rounded-lg border border-dashed border-[#cbd8cc] bg-[#f8faf7] p-8 text-center">
      <h3 className="text-sm font-semibold text-[#17201b]">{title}</h3>
      <p className="mt-2 text-sm text-[#637166]">{description}</p>
    </div>
  );
}

export function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="rounded-md border border-[#f3c1bd] bg-[#fff0ee] px-4 py-3 text-sm font-medium text-[#8f1f16]">
      {message}
    </div>
  );
}

export function LoadingRows({ rows = 4 }: { rows?: number }) {
  return (
    <div className="grid gap-3">
      {Array.from({ length: rows }).map((_, index) => (
        <div
          className="h-12 animate-pulse rounded-md bg-[#eef3ee]"
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
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#2f6b4f]">
        {eyebrow}
      </p>
      <h1 className="mt-2 text-2xl font-semibold text-[#17201b] sm:text-3xl">
        {title}
      </h1>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-[#5c695f]">
        {description}
      </p>
    </header>
  );
}
