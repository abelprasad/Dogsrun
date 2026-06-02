'use client'

import { useRouter, useSearchParams } from 'next/navigation'

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY', 'DC',
]

interface BrowseStateFilterProps {
  tab: string
  currentState: string
}

export default function BrowseStateFilter({ tab, currentState }: BrowseStateFilterProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', tab)
    params.delete('page')
    if (e.target.value) {
      params.set('state', e.target.value)
    } else {
      params.delete('state')
    }
    router.push(`/dogs?${params.toString()}`)
  }

  return (
    <div className="mb-8 flex items-center gap-3">
      <label className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#7a877f] shrink-0">
        Filter by State
      </label>
      <select
        value={currentState}
        onChange={handleChange}
        className="border border-[#13241d]/20 bg-[#fffaf2] px-4 py-2.5 text-sm text-[#13241d] transition-all focus:border-[#f4b942] focus:outline-none focus:ring-1 focus:ring-[#f4b942] w-40"
      >
        <option value="">All States</option>
        {US_STATES.map(s => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>
      {currentState && (
        <button
          onClick={() => {
            const params = new URLSearchParams(searchParams.toString())
            params.set('tab', tab)
            params.delete('state')
            params.delete('page')
            router.push(`/dogs?${params.toString()}`)
          }}
          className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#d95f4b] hover:underline"
        >
          Clear
        </button>
      )}
    </div>
  )
}
