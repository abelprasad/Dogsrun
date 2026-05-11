'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import SignOutButton from './sign-out-button'

interface DashboardNavProps {
  orgName: string
  orgType: 'shelter' | 'rescue'
  isAdmin: boolean
}

export default function DashboardNav({ orgName, orgType, isAdmin }: DashboardNavProps) {
  const pathname = usePathname()
  const links = orgType === 'rescue'
    ? [
        { href: '/dashboard/rescue', label: 'Incoming Alerts' },
        { href: '/dashboard/criteria', label: 'Matching Criteria' },
      ]
    : [
        { href: '/dashboard', label: 'Dashboard', exact: true },
        { href: '/dashboard/dogs', label: 'My Dogs' },
        { href: '/dashboard/dogs/new', label: 'Add Dog' },
      ]

  const isActive = (href: string, exact?: boolean) => (
    exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`)
  )

  return (
    <div className="bg-[#13241d] py-2 px-8">
      <div className="max-w-7xl mx-auto flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-6">
          {links.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-xs font-bold uppercase tracking-[0.24em] transition-colors ${
                isActive(link.href, link.exact)
                  ? 'text-[#f4b942]'
                  : 'text-[#f5f0e8]/40 hover:text-[#f4b942]'
              }`}
            >
              {link.label}
            </Link>
          ))}
          {isAdmin && (
            <Link
              href="/admin"
              className="text-xs font-bold text-[#f5f0e8]/40 hover:text-[#f4b942] uppercase tracking-[0.24em] transition-colors"
            >
              Admin
            </Link>
          )}
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs font-bold text-[#f5f0e8]/40 uppercase tracking-[0.24em]">{orgName}</span>
          <SignOutButton />
        </div>
      </div>
    </div>
  )
}
