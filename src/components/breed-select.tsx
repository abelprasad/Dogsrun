'use client'

import { useState, useRef, useEffect } from 'react'

const COMMON_BREEDS = [
  'American Pit Bull Terrier',
  'American Staffordshire Terrier',
  'Australian Shepherd',
  'Basset Hound',
  'Beagle',
  'Bernese Mountain Dog',
  'Bichon Frise',
  'Border Collie',
  'Boston Terrier',
  'Boxer',
  'Bulldog',
  'Cavalier King Charles Spaniel',
  'Chihuahua',
  'Chow Chow',
  'Cocker Spaniel',
  'Dachshund',
  'Dalmatian',
  'Doberman Pinscher',
  'French Bulldog',
  'German Shepherd',
  'Golden Retriever',
  'Great Dane',
  'Greyhound',
  'Havanese',
  'Husky',
  'Jack Russell Terrier',
  'Labrador Retriever',
  'Maltese',
  'Miniature Schnauzer',
  'Pomeranian',
  'Poodle',
  'Pug',
  'Rottweiler',
  'Saint Bernard',
  'Shih Tzu',
  'Terrier Mix',
  'Vizsla',
  'Weimaraner',
  'Welsh Corgi',
  'Yorkshire Terrier',
]

interface BreedSelectProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export default function BreedSelect({ value, onChange, placeholder = 'Search breed...', className = '' }: BreedSelectProps) {
  const [query, setQuery] = useState(value)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const filtered = query.length > 0
    ? COMMON_BREEDS.filter(b => b.toLowerCase().includes(query.toLowerCase()))
    : COMMON_BREEDS

  // Sync external value changes
  useEffect(() => {
    setQuery(value)
  }, [value])

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function handleSelect(breed: string) {
    setQuery(breed)
    onChange(breed)
    setOpen(false)
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setQuery(e.target.value)
    onChange(e.target.value) // allow custom breed
    setOpen(true)
  }

  return (
    <div ref={ref} className="relative">
      <input
        type="text"
        value={query}
        onChange={handleInputChange}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        className={`w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-[#f59e0b] focus:ring-1 focus:ring-[#f59e0b] text-[#111] placeholder-[#9ca3af] transition-all text-sm ${className}`}
      />
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-56 overflow-y-auto">
          {filtered.length > 0 ? (
            filtered.map(breed => (
              <button
                key={breed}
                type="button"
                onMouseDown={() => handleSelect(breed)}
                className="w-full text-left px-4 py-2.5 text-sm text-[#111] hover:bg-[#fffbeb] transition-colors"
              >
                {breed}
              </button>
            ))
          ) : (
            <div className="px-4 py-2.5 text-sm text-[#9ca3af]">
              No match — press Enter to use <span className="font-semibold text-[#111]">&ldquo;{query}&rdquo;</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
