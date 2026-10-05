// Shared nav links (the navbar and the footer previously duplicated the same 5 links).
export interface NavLink {
  href: string
  /** Label shown in the navbar. */
  label: string
  /** Label shown in the footer. */
  footerLabel: string
}

export const NAV_LINKS: NavLink[] = [
  { href: '/dogs', label: 'Browse', footerLabel: 'Browse Dogs' },
  { href: '/about', label: 'About', footerLabel: 'About' },
  { href: '/faq', label: 'FAQ', footerLabel: 'FAQ' },
  { href: '/contact', label: 'Contact', footerLabel: 'Contact' },
  { href: '/merch', label: 'Shop', footerLabel: 'Shop' },
]
