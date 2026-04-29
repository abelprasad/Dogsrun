'use client'

import { useState } from 'react'

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY', 'DC',
]

interface StateMultiSelectProps {
  selected: string[]
  onChange: (states: string[]) => void
  label?: string
}

export default function StateMultiSelect({ selected, onChange, label = 'States Served' }: StateMultiSelectProps) {
  const [open, setOpen] = useState(false)

  function toggle(state: string) {
    if (selected.includes(state)) {
      onChange(selected.filter(s => s !== state))
    } else {
      onChange([...selected, state])
    }
  }

  return (
    <div>
      {label && <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-left text-sm text-[#111] bg-white focus:outline-none focus:border-[#f59e0b] focus:ring-1 focus:ring-[#f59e0b] transition-all flex items-center justify-between"
      >
        <span className={selected.length === 0 ? 'text-[#9ca3af]' : ''}>
          {selected.length === 0
            ? 'Select states...'
            : selected.length <= 4
            ? selected.join(', ')
            : `${selected.slice(0, 4).join(', ')} +${selected.length - 4} more`}
        </span>
        <svg className={`h-4 w-4 text-[#9ca3af] transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="mt-1 border border-gray-200 rounded-lg bg-white shadow-lg max-h-56 overflow-y-auto z-50 relative">
          <div className="p-2 border-b border-gray-100 flex gap-2">
            <button
              type="button"
              onClick={() => onChange([...US_STATES])}
              className="text-xs font-bold text-[#f59e0b] hover:underline"
            >
              All
            </button>
            <span className="text-[#9ca3af]">·</span>
            <button
              type="button"
              onClick={() => onChange([])}
              className="text-xs font-bold text-[#9ca3af] hover:text-[#111]"
            >
              Clear
            </button>
          </div>
          <div className="grid grid-cols-4 gap-0.5 p-2">
            {US_STATES.map(state => (
              <button
                key={state}
                type="button"
                onClick={() => toggle(state)}
                className={`px-2 py-1.5 rounded text-xs font-bold transition-colors ${
                  selected.includes(state)
                    ? 'bg-[#f59e0b] text-[#451a03]'
                    : 'text-[#6b7280] hover:bg-gray-100'
                }`}
              >
                {state}
              </button>
            ))}
          </div>
        </div>
      )}

      {selected.length === 0 && (
        <p className="text-xs text-[#9ca3af] mt-1.5">Leave empty to receive alerts from all states</p>
      )}
    </div>
  )
}
