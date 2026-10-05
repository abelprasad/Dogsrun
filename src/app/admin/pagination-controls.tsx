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
    `px-3 py-1.5 text-xs font-bold uppercase tracking-[0.1em] transition-colors ${
      active
        ? 'bg-[#13241d] text-[#f4b942]'
        : 'bg-[#f5f0e8] text-[#5d6a64] hover:bg-[#13241d]/10'
    } ${disabled ? 'opacity-40 pointer-events-none' : ''}`

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 py-4">
      <p className="text-xs text-[#5d6a64]">
        Page {page} of {totalPages} · {total} total
      </p>
      <div className="flex items-center gap-1">
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
