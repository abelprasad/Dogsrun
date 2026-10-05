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
  "border border-[#13241d]/20 bg-[#fff9ef] px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-[#13241d] transition hover:bg-[#13241d] hover:text-[#c08a3e]";
const activePage =
  "px-4 py-2 text-xs font-black uppercase tracking-[0.16em] transition bg-[#c08a3e] text-[#13241d]";

// Window page numbers to current ± 2 with ellipsis, so large page counts
// don't overflow on mobile or flood the tab order (M-F8).
function windowedPages(page: number, totalPages: number): (number | "…")[] {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
  const pages: (number | "…")[] = [1];
  const start = Math.max(2, page - 2);
  const end = Math.min(totalPages - 1, page + 2);
  if (start > 2) pages.push("…");
  for (let p = start; p <= end; p++) pages.push(p);
  if (end < totalPages - 1) pages.push("…");
  pages.push(totalPages);
  return pages;
}

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
      <nav aria-label="Pagination" className="flex gap-2">
        {page > 1 && (
          <Link href={getHref(page - 1)} className={pageButton} aria-label="Previous page">
            ← Prev
          </Link>
        )}
        {windowedPages(page, totalPages).map((p, i) =>
          p === "…" ? (
            <span key={`ellipsis-${i}`} aria-hidden="true" className="px-2 py-2 text-xs font-black text-[#7a877f]">
              …
            </span>
          ) : (
            <Link
              key={p}
              href={getHref(p)}
              className={p === page ? activePage : pageButton}
              aria-label={p === page ? `Page ${p}, current page` : `Go to page ${p}`}
              aria-current={p === page ? "page" : undefined}
            >
              {p}
            </Link>
          )
        )}
        {page < totalPages && (
          <Link href={getHref(page + 1)} className={pageButton} aria-label="Next page">
            Next →
          </Link>
        )}
      </nav>
    </div>
  );
}
