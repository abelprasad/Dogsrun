import { redirect } from 'next/navigation'
import { requireAuthContext, dashboardPathFor } from '@/lib/auth-context'
import DashboardNav from './dashboard-nav'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { org, isAdmin } = await requireAuthContext()

  if (!org) redirect(dashboardPathFor(org, isAdmin))

  return (
    <>
      <DashboardNav orgName={org.name} orgType={org.type} isAdmin={isAdmin} />
      {children}
    </>
  )
}
