import { redirect } from 'next/navigation'
import { requireAuthContext, dashboardPathFor } from '@/lib/auth-context'
import Link from 'next/link'
import SignOutButton from '@/app/dashboard/sign-out-button'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, org, isAdmin } = await requireAuthContext()

  if (!isAdmin) redirect(dashboardPathFor(org, false))
  const dashboardHref = org ? dashboardPathFor(org, true) : '/'

  return (
    <div>
      <div className="bg-[#13241d] py-2 px-8 sticky top-0 z-50 border-b border-white/5">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-6">
            <Link href="/admin">
              <span className="text-xs font-bold text-[#f4b942] uppercase tracking-[0.24em]">Admin Panel</span>
            </Link>
            <Link
              href={dashboardHref}
              className="text-xs font-bold text-[#f5f0e8]/30 hover:text-[#f5f0e8]/70 uppercase tracking-[0.24em] transition-colors"
            >
              {org ? 'Dashboard ->' : 'Public Site ->'}
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs font-bold text-[#f5f0e8]/40 uppercase tracking-[0.24em]">{user.email}</span>
            <SignOutButton />
          </div>
        </div>
      </div>
      {children}
    </div>
  )
}
