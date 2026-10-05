'use client'

import { useId } from 'react'

export const DOG_COLORS = [
  'Black', 'White', 'Brown', 'Tan', 'Golden', 'Red',
  'Gray', 'Brindle', 'Merle', 'Spotted', 'Cream', 'Blue',
]

const COLOR_SWATCHES: Record<string, string> = {
  Black: '#1a1a1a',
  White: '#f5f0e8',
  Brown: '#7c4a1e',
  Tan: '#c8996b',
  Golden: '#c08a3e',
  Red: '#b94a2c',
  Gray: '#6b7280',
  Brindle: '#5c4a2a',
  Merle: '#7a6fa0',
  Spotted: '#13241d',
  Cream: '#f0e6cc',
  Blue: '#4a6fa0',
}

interface ColorPickerProps {
  selected: string[]
  onChange: (colors: string[]) => void
  label?: string
  id?: string
}

export default function ColorPicker({ selected, onChange, label = 'Color(s)', id }: ColorPickerProps) {
  const fallbackId = useId()
  const labelId = id ?? fallbackId
  function toggle(color: string) {
    if (selected.includes(color)) {
      onChange(selected.filter(c => c !== color))
    } else {
      onChange([...selected, color])
    }
  }

  return (
    <div>
      {label && (
        <label id={labelId} className="mb-3 block text-xs font-bold uppercase tracking-[0.18em] text-[#5d6a64]">{label}</label>
      )}
      <div role="group" aria-labelledby={labelId} className="flex flex-wrap gap-2">
        {DOG_COLORS.map(color => {
          const isSelected = selected.includes(color)
          return (
            <button
              key={color}
              type="button"
              onClick={() => toggle(color)}
              className={`flex items-center gap-2 border px-3 py-2 text-xs font-black transition-all ${
                isSelected
                  ? 'border-[#c08a3e] bg-[#c08a3e] text-[#13241d]'
                  : 'border-[#13241d]/15 bg-[#f5f0e8] text-[#5d6a64] hover:border-[#c08a3e] hover:text-[#13241d]'
              }`}
            >
              <span
                className="h-3 w-3 shrink-0 border border-black/10"
                style={{ backgroundColor: COLOR_SWATCHES[color] }}
              />
              {color}
            </button>
          )
        })}
      </div>
      {selected.length === 0 && (
        <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#9ca3af]">Select all that apply — leave empty to accept all colors</p>
      )}
    </div>
  )
}
