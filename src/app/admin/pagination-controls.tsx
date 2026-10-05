'use client'

interface Props {
  page: number
  totalPages: number
  total: number
  pageSize: number
  onPageChange: (page: number) => void
}

export default function PaginationControls({ page, totalPages, total, pageSize, onPageChange }: Props) {
  if (totalPages <= 1) return null

  const start = Math.max(1, Math.min(page - 2, totalPages - 4))
  const end = Math.min(totalPages, start + 4)
  const pages: number[] = []
  for (let p = start; p <= end; p++) pages.push(p)

  const btn = (active: boolean, disabled = false) =>
    `border px-3 py-1.5 text-xs font-bold uppercase tracking-[0.1em] transition-colors ${
      active
        ? 'border-[#c08a3e] bg-[#c08a3e] text-[#140a08]'
        : 'border-white/15 text-[#f8f1e8]/55 hover:border-[#c08a3e]/60 hover:text-[#f8f1e8]'
    } ${disabled ? 'opacity-40 pointer-events-none' : ''}`

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 py-4">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#f8f1e8]/40">
        Page {page} of {totalPages} · {total} total
      </p>
      <div className="flex flex-wrap items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className={btn(false, page <= 1)}
        >
          ← Prev
        </button>
        {pages.map(p => (
          <button
            key={p}
            type="button"
            onClick={() => onPageChange(p)}
            className={btn(p === page)}
          >
            {p}
          </button>
        ))}
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className={btn(false, page >= totalPages)}
        >
          Next →
        </button>
      </div>
    </div>
  )
}
