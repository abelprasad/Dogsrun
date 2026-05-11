import { redirect } from 'next/navigation'
import { requireAuthContext } from '@/lib/auth-context'
import DashboardNav from './dashboard-nav'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { org, isAdmin } = await requireAuthContext()

  if (!org) {
    if (isAdmin) redirect('/admin')
    redirect('/register')
  }

  return (
    <>
      <DashboardNav orgName={org.name} orgType={org.type} isAdmin={isAdmin} />
      {children}
    </>
  )
}
