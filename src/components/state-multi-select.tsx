'use client'

import { useState, useRef, useEffect } from 'react'

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
  const [query, setQuery] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  const filtered = query.length > 0
    ? US_STATES.filter(s => s.toLowerCase().startsWith(query.toLowerCase()))
    : US_STATES

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function toggle(state: string) {
    if (selected.includes(state)) {
      onChange(selected.filter(s => s !== state))
    } else {
      onChange([...selected, state])
      setQuery('')
    }
  }

  function remove(state: string) {
    onChange(selected.filter(s => s !== state))
  }

  return (
    <div ref={ref} className="relative">
      {label && (
        <label className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-[#5d6a64]">{label}</label>
      )}

      {/* Selected tags */}
      {selected.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1">
          {selected.map(state => (
            <span key={state} className="flex items-center gap-1 border border-[#13241d]/15 bg-[#f5f0e8] px-2 py-1 text-xs font-black text-[#13241d]">
              {state}
              <button type="button" onClick={() => remove(state)} className="text-[#5d6a64] hover:text-red-500 leading-none">x</button>
            </span>
          ))}
        </div>
      )}

      {/* Search input */}
      <input
        type="text"
        value={query}
        onChange={e => { setQuery(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        placeholder={selected.length === 0 ? 'Type a state (e.g. PA, NY)...' : 'Add another state...'}
        className="w-full border border-[#13241d]/20 bg-[#fffaf2] px-4 py-3 text-sm text-[#13241d] placeholder-[#5d6a64]/50 transition-all focus:border-[#f4b942] focus:outline-none focus:ring-1 focus:ring-[#f4b942]"
      />

      {/* Dropdown */}
      {open && filtered.length > 0 && (
        <div className="absolute z-50 mt-1 w-full border border-[#13241d]/20 bg-[#fffaf2] shadow-lg max-h-48 overflow-y-auto">
          {filtered.map(state => (
            <button
              key={state}
              type="button"
              onMouseDown={() => toggle(state)}
              className={`w-full px-4 py-2.5 text-left text-sm font-black transition-colors ${
                selected.includes(state)
                  ? 'bg-[#f4b942] text-[#13241d]'
                  : 'text-[#13241d] hover:bg-[#f5f0e8]'
              }`}
            >
              {state}
              {selected.includes(state) && <span className="ml-2 text-[#13241d]/50">✓</span>}
            </button>
          ))}
        </div>
      )}

      {selected.length === 0 && (
        <p className="mt-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-[#5d6a64]/70">Leave empty for all states</p>
      )}
    </div>
  )
}
