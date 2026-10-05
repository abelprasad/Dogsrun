import Link from "next/link";
import type { ReactNode } from "react";

interface PaginationProps {
  page: number;
  totalPages: number;
  /** Build the href for a given page number. */
  getHref: (page: number) => string;
  /** Left-hand summary, e.g. "Page 1 of 5 · 42 dogs". */
  summary?: ReactNode;
  className?: string;
}

const pageButton =
  "border border-[#13241d]/20 bg-[#fff9ef] px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-[#13241d] transition hover:bg-[#13241d] hover:text-[#f4b942]";
const activePage =
  "px-4 py-2 text-xs font-black uppercase tracking-[0.16em] transition bg-[#f4b942] text-[#13241d]";

// Prev / next + page numbers. Renders nothing when there is a single page.
export default function Pagination({
  page,
  totalPages,
  getHref,
  summary,
  className = "mt-12 flex items-center justify-between border-t border-[#13241d]/10 pt-8",
}: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className={className}>
      {summary ? (
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#7a877f]">
          {summary}
        </p>
      ) : null}
      <div className="flex gap-2">
        {page > 1 && (
          <Link href={getHref(page - 1)} className={pageButton}>
            ← Prev
          </Link>
        )}
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
          <Link key={p} href={getHref(p)} className={p === page ? activePage : pageButton}>
            {p}
          </Link>
        ))}
        {page < totalPages && (
          <Link href={getHref(page + 1)} className={pageButton}>
            Next →
          </Link>
        )}
      </div>
    </div>
  );
}
