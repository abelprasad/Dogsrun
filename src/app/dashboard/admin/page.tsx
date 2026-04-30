import { createClient } from '@supabase/supabase-js'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import SignOutButton from '../sign-out-button'
import AdminOrgTable from './org-table'
import AdminDogsTable from './dogs-table'

export default async function AdminPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: admin } = await supabase
    .from('admins').select('id').eq('email', user.email).maybeSingle()
  if (!admin) redirect('/dashboard')

  const serviceClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const [{ data: orgs }, { data: dogs }, { data: alerts }, { data: recentAlerts }] = await Promise.all([
    serviceClient.from('organizations').select('*').order('created_at', { ascending: false }),
    serviceClient.from('dogs').select('*, organizations(name)').order('created_at', { ascending: false }),
    serviceClient.from('alerts').select('rescue_id, status'),
    serviceClient.from('alerts')
      .select('*, dogs(name, breed), organizations!alerts_rescue_id_fkey(name)')
      .order('sent_at', { ascending: false })
      .limit(20),
  ])

  const totalOrgs = orgs?.length ?? 0
  const totalShelters = orgs?.filter(o => o.type === 'shelter').length ?? 0
  const totalRescues = orgs?.filter(o => o.type === 'rescue').length ?? 0
  const totalDogs = dogs?.length ?? 0
  const totalAlerts = alerts?.length ?? 0
  const totalInterested = alerts?.filter(a => a.status === 'responded').length ?? 0
  const responseRate = totalAlerts > 0 ? Math.round((totalInterested / totalAlerts) * 100) : 0
  const atRiskDogs = dogs?.filter(d => d.euthanasia_date && new Date(d.euthanasia_date) > new Date()).length ?? 0
  const pendingOrgs = orgs?.filter(o => o.approval_status === 'pending').length ?? 0

  const alertsByOrg: Record<string, { sent: number; responded: number }> = {}
  for (const alert of alerts ?? []) {
    if (!alertsByOrg[alert.rescue_id]) alertsByOrg[alert.rescue_id] = { sent: 0, responded: 0 }
    alertsByOrg[alert.rescue_id].sent++
    if (alert.status === 'responded') alertsByOrg[alert.rescue_id].responded++
  }

  const stats = [
    { label: 'Total Orgs', value: totalOrgs, color: '' },
    { label: 'Shelters', value: totalShelters, color: '' },
    { label: 'Rescues', value: totalRescues, color: '' },
    { label: 'Dogs Listed', value: totalDogs, color: '' },
    { label: 'Response Rate', value: `${responseRate}%`, color: '' },
    { label: 'Alerts Sent', value: totalAlerts, color: '' },
    { label: 'Interested', value: totalInterested, color: 'text-green-600' },
    { label: 'At Risk', value: atRiskDogs, color: atRiskDogs > 0 ? 'text-red-600' : '' },
    { label: 'Pending', value: pendingOrgs, color: pendingOrgs > 0 ? 'text-amber-600' : '' },
  ]

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-[#111] border-t border-white/5 py-2 px-8">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <span className="text-xs font-bold text-[#f59e0b] uppercase tracking-widest">Admin Panel</span>
          <div className="flex items-center gap-4">
            <span className="text-xs font-bold text-[#9ca3af] uppercase tracking-widest">{user.email}</span>
            <SignOutButton />
          </div>
        </div>
      </div>

      <header className="bg-[#fffbeb] border-b border-gray-200 py-12 px-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-[900] tracking-tight text-[#111] mb-2">Admin Panel</h1>
          <p className="text-[#6b7280]">Manage organizations, dogs, and network activity.</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-8 px-8 space-y-12">

        {/* Stats */}
        <section>
          <h2 className="text-xl font-bold text-[#111] mb-6">Overview</h2>
          <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-4">
            {stats.map(({ label, value, color }) => (
              <div key={label} className="bg-[#fffbeb] rounded-xl border border-gray-200 p-4 text-center">
                <div className={`text-2xl font-[900] mb-1 ${color || 'text-[#111]'}`}>{value}</div>
                <div className="text-[10px] font-semibold text-[#6b7280] uppercase tracking-widest leading-tight">{label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Organizations */}
        <section>
          <h2 className="text-xl font-bold text-[#111] mb-6">Organizations</h2>
          <AdminOrgTable orgs={orgs ?? []} alertsByOrg={alertsByOrg} />
        </section>

        {/* Dogs */}
        <section>
          <h2 className="text-xl font-bold text-[#111] mb-6">All Dogs</h2>
          <AdminDogsTable dogs={dogs ?? []} />
        </section>

        {/* Recent Activity */}
        <section>
          <h2 className="text-xl font-bold text-[#111] mb-6">Recent Activity</h2>
          <div className="rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  {['Dog', 'Rescue', 'Status', 'Date'].map(h => (
                    <th key={h} className="text-left px-4 py-3 font-semibold text-[#6b7280] uppercase tracking-wider text-xs">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentAlerts && recentAlerts.length > 0 ? recentAlerts.map((alert: { id: string; dogs: { name: string; breed: string } | null; organizations: { name: string } | null; status: string; sent_at: string | null }, i: number) => (
                  <tr key={alert.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                    <td className="px-4 py-3 font-semibold text-[#111]">
                      {alert.dogs?.name ?? '—'}
                      <span className="text-[#9ca3af] font-normal"> · {alert.dogs?.breed ?? ''}</span>
                    </td>
                    <td className="px-4 py-3 text-[#6b7280]">{alert.organizations?.name ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${
                        alert.status === 'responded' ? 'bg-green-100 text-green-700' :
                        alert.status === 'declined' ? 'bg-gray-100 text-gray-500' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {alert.status === 'responded' ? 'Interested' : alert.status === 'declined' ? 'Passed' : 'Sent'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[#9ca3af]">
                      {alert.sent_at ? new Date(alert.sent_at).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-[#9ca3af]">No activity yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

      </main>
    </div>
  )
}
