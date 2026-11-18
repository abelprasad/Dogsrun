import type { ReactNode } from "react";

interface PageHeaderProps {
  eyebrow?: ReactNode;
  title: ReactNode;
  sub?: ReactNode;
  actions?: ReactNode;
  /** "overview" is the larger dashboard-home header; "default" is used by sub-pages. */
  variant?: "default" | "overview";
}

const STYLES = {
  default: {
    shell: "bg-[#13241d] pb-12 px-8 pt-8 border-t border-white/5",
    title: "text-4xl md:text-5xl font-black tracking-tight text-[#c08a3e]",
    sub: "text-[#f5f0e8]/50 mt-2 text-sm",
  },
  overview: {
    shell: "bg-[#13241d] px-5 py-14 sm:px-8 lg:px-12",
    title: "text-4xl font-black leading-tight tracking-tight text-[#f4b942] sm:text-5xl",
    sub: "mt-2 text-[#c8d3ce]",
  },
} as const;

const EYEBROW = "text-xs uppercase tracking-[0.24em] text-[#c08a3e]/70 mb-3 font-bold";

// The green dashboard header (eyebrow + title + sub) shared across pages.
export default function PageHeader({
  eyebrow,
  title,
  sub,
  actions,
  variant = "default",
}: PageHeaderProps) {
  const styles = STYLES[variant];
  const inner = actions
    ? "max-w-7xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-4"
    : "max-w-7xl mx-auto";
  return (
    <header className={styles.shell}>
      <div className={inner}>
        <div>
          {eyebrow ? <p className={EYEBROW}>{eyebrow}</p> : null}
          <h1 className={styles.title}>{title}</h1>
          {sub ? <p className={styles.sub}>{sub}</p> : null}
        </div>
        {actions}
      </div>
    </header>
  );
}
