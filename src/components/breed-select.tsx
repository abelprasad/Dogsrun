'use client'

import { useState, useRef, useEffect } from 'react'

const COMMON_BREEDS = [
  // Sporting
  'Brittany Spaniel', 'Cocker Spaniel', 'English Setter', 'English Springer Spaniel',
  'German Shorthaired Pointer', 'German Wirehaired Pointer', 'Golden Retriever',
  'Irish Setter', 'Labrador Retriever', 'Pointer', 'Vizsla', 'Weimaraner',
  // Hound
  'Afghan Hound', 'Basset Hound', 'Beagle', 'Bloodhound', 'Borzoi',
  'Dachshund', 'Greyhound', 'Ibizan Hound', 'Irish Wolfhound', 'Plott Hound',
  'Rhodesian Ridgeback', 'Saluki', 'Whippet',
  // Working
  'Akita', 'Alaskan Malamute', 'Bernese Mountain Dog', 'Boerboel', 'Boxer',
  'Bullmastiff', 'Cane Corso', 'Doberman Pinscher', 'Giant Schnauzer',
  'Great Dane', 'Great Pyrenees', 'Leonberger', 'Mastiff',
  'Newfoundland', 'Portuguese Water Dog', 'Presa Canario', 'Rottweiler',
  'Saint Bernard', 'Samoyed', 'Siberian Husky',
  // Terrier
  'Airedale Terrier', 'American Pit Bull Terrier', 'American Staffordshire Terrier',
  'Australian Terrier', 'Border Terrier', 'Bull Terrier', 'Cairn Terrier',
  'Jack Russell Terrier', 'Jack (Parson) Russell Terrier', 'Manchester Terrier',
  'Miniature Bull Terrier', 'Miniature Schnauzer', 'Norfolk Terrier',
  'Pit Bull Terrier', 'Scottish Terrier', 'Soft Coated Wheaten Terrier',
  'Staffordshire Bull Terrier', 'Welsh Terrier', 'West Highland White Terrier',
  'Yorkshire Terrier',
  // Toy
  'Affenpinscher', 'Brussels Griffon', 'Cavalier King Charles Spaniel',
  'Chihuahua', 'Chihuahua - Long Haired', 'Chihuahua - Smooth Coated',
  'Chinese Crested', 'Havanese', 'Italian Greyhound', 'Maltese',
  'Miniature Pinscher', 'Papillon', 'Pekingese', 'Pomeranian',
  'Poodle - Toy', 'Pug', 'Shih Tzu', 'Toy Fox Terrier',
  // Non-Sporting
  'American Bulldog', 'Bichon Frise', 'Boston Terrier', 'Bulldog',
  'Chow Chow', 'Dalmatian', 'English Bulldog', 'Feist',
  'Finnish Spitz', 'French Bulldog', 'Keeshond', 'Lhasa Apso',
  'Lowchen', 'Poodle - Standard', 'Poodle - Miniature',
  'Schipperke', 'Shiba Inu', 'Tibetan Spaniel',
  // Herding
  'Australian Cattle Dog', 'Australian Shepherd', 'Belgian Malinois',
  'Belgian Sheepdog', 'Belgian Tervuren', 'Border Collie', 'Bouvier des Flandres',
  'Briard', 'Cardigan Welsh Corgi', 'Collie', 'Dutch Shepherd',
  'German Shepherd', 'German Shepherd Dog', 'Miniature American Shepherd',
  'Old English Sheepdog', 'Pembroke Welsh Corgi', 'Shetland Sheepdog',
  // Hound / Misc
  'Alaskan Husky', 'Husky', 'Malinois', 'Mutt',
  // Mix variants common in shelters
  'American Bulldog mix', 'American Pit Bull Terrier mix',
  'American Staffordshire Terrier mix', 'Boerboel mix',
  'Boxer mix', 'Chihuahua mix', 'Chihuahua - Smooth Coated mix',
  'Chow Chow mix', 'French Bulldog mix', 'German Shepherd Dog mix',
  'German Shepherd mix', 'Great Pyrenees mix',
  'Jack (Parson) Russell Terrier mix', 'Labrador Retriever mix',
  'Pit Bull Terrier mix', 'Rottweiler mix', 'Siberian Husky mix',
  'Staffordshire Bull Terrier mix', 'Terrier Mix',
].sort()

// Deduplicate
const BREEDS = [...new Set(COMMON_BREEDS)]

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
    ? BREEDS.filter(b => b.toLowerCase().includes(query.toLowerCase()))
    : BREEDS

  useEffect(() => { setQuery(value) }, [value])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
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
    onChange(e.target.value)
    setOpen(true)
  }

  return (
    <div ref={ref} className={`relative ${className}`}>
      <input
        type="text"
        value={query}
        onChange={handleInputChange}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        className="w-full border border-[#13241d]/20 bg-[#fffaf2] px-4 py-3 text-sm text-[#13241d] placeholder-[#5d6a64]/50 transition-all focus:border-[#f4b942] focus:outline-none focus:ring-1 focus:ring-[#f4b942]"
      />
      {open && (
        <div className="absolute z-50 mt-1 w-full border border-[#13241d]/20 bg-[#fffaf2] shadow-lg max-h-56 overflow-y-auto">
          {filtered.length > 0 ? (
            filtered.map(breed => (
              <button
                key={breed}
                type="button"
                onMouseDown={() => handleSelect(breed)}
                className="w-full px-4 py-2.5 text-left text-sm font-black text-[#13241d] transition-colors hover:bg-[#f5f0e8]"
              >
                {breed}
              </button>
            ))
          ) : (
            <div className="px-4 py-2.5 text-sm text-[#5d6a64]">
              No match — press Enter to use <span className="font-black text-[#13241d]">&ldquo;{query}&rdquo;</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
