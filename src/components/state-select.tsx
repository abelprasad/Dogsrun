'use client'

import { US_STATES } from '@/lib/us-states'

interface StateSelectProps {
  value: string
  onChange: (value: string) => void
  className?: string
  placeholder?: string
}

export default function StateSelect({ value, onChange, className = '', placeholder = 'State' }: StateSelectProps) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className={`w-full border border-[#13241d]/20 bg-[#fffaf2] px-4 py-2.5 focus:outline-none focus:border-[#f4b942] focus:ring-1 focus:ring-[#f4b942] text-[#13241d] transition-all text-sm ${className}`}
    >
      <option value="">{placeholder}</option>
      {US_STATES.map(s => (
        <option key={s} value={s}>{s}</option>
      ))}
    </select>
  )
}
