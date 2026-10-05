import type { ReactNode } from "react";

interface PageHeaderProps {
  eyebrow?: ReactNode;
  title: ReactNode;
  sub?: ReactNode;
  actions?: ReactNode;
  /** Override the default dashboard green-header shell. */
  className?: string;
  /** Override the default inner container (e.g. to add a flex row for actions). */
  innerClassName?: string;
  titleClassName?: string;
  subClassName?: string;
  eyebrowClassName?: string;
}

// The green dashboard header (eyebrow + title + sub) shared across pages.
export default function PageHeader({
  eyebrow,
  title,
  sub,
  actions,
  className = "bg-[#13241d] pb-12 px-8 pt-8 border-t border-white/5",
  innerClassName = "max-w-7xl mx-auto",
  titleClassName = "text-4xl md:text-5xl font-black tracking-tight text-[#f4b942]",
  subClassName = "text-[#f5f0e8]/50 mt-2 text-sm",
  eyebrowClassName = "text-xs uppercase tracking-[0.24em] text-[#f4b942]/70 mb-3 font-bold",
}: PageHeaderProps) {
  return (
    <header className={className}>
      <div className={innerClassName}>
        <div>
          {eyebrow ? <p className={eyebrowClassName}>{eyebrow}</p> : null}
          <h1 className={titleClassName}>{title}</h1>
          {sub ? <p className={subClassName}>{sub}</p> : null}
        </div>
        {actions}
      </div>
    </header>
  );
}
