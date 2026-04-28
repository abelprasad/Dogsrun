'use client'

export const DOG_COLORS = [
  'Black',
  'White',
  'Brown',
  'Tan',
  'Golden',
  'Red',
  'Gray',
  'Brindle',
  'Merle',
  'Spotted',
  'Cream',
  'Blue',
]

interface ColorPickerProps {
  selected: string[]
  onChange: (colors: string[]) => void
  label?: string
}

export default function ColorPicker({ selected, onChange, label = 'Color(s)' }: ColorPickerProps) {
  function toggle(color: string) {
    if (selected.includes(color)) {
      onChange(selected.filter(c => c !== color))
    } else {
      onChange([...selected, color])
    }
  }

  return (
    <div>
      {label && <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>}
      <div className="flex flex-wrap gap-2">
        {DOG_COLORS.map(color => (
          <button
            key={color}
            type="button"
            onClick={() => toggle(color)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
              selected.includes(color)
                ? 'bg-[#f59e0b] text-[#451a03] border-[#f59e0b]'
                : 'bg-white text-[#6b7280] border-gray-200 hover:border-[#f59e0b] hover:text-[#111]'
            }`}
          >
            {color}
          </button>
        ))}
      </div>
      {selected.length === 0 && (
        <p className="text-xs text-[#9ca3af] mt-2 uppercase tracking-widest font-bold">Select all that apply</p>
      )}
    </div>
  )
}
