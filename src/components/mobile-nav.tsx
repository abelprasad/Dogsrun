'use client'

import { useState } from 'react'
import Link from 'next/link'
import { NAV_LINKS } from '@/lib/navigation'

export default function MobileNav() {
  const [open, setOpen] = useState(false)

  return (
    <div className="md:hidden relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={open ? 'Close navigation menu' : 'Open navigation menu'}
        className="flex items-center justify-center w-10 h-10 rounded-lg text-[#9ca3af] hover:text-[#f59e0b] hover:bg-white/5 transition-colors"
      >
        {open ? (
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <line x1="4" y1="4" x2="16" y2="16" />
            <line x1="16" y1="4" x2="4" y2="16" />
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <line x1="3" y1="6" x2="17" y2="6" />
            <line x1="3" y1="10" x2="17" y2="10" />
            <line x1="3" y1="14" x2="17" y2="14" />
          </svg>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-48 rounded-xl border border-white/10 bg-[#1a1a1a] py-2 shadow-xl z-50">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="block px-4 py-2.5 text-sm font-medium text-[#9ca3af] hover:text-[#f59e0b] hover:bg-white/5 transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
