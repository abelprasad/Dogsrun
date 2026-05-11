import { createClient } from '@supabase/supabase-js'
import AdminOrgTable from './org-table'
import AdminDogsTable from './dogs-table'
import AdminTabs from './admin-tabs'

export default async function AdminPage() {
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
  const totalDogs = dogs?.length ?? 0
  const totalAlerts = alerts?.length ?? 0
  const totalInterested = alerts?.filter(a => a.status === 'responded').length ?? 0
  const responseRate = totalAlerts > 0 ? Math.round((totalInterested / totalAlerts) * 100) : 0
  const pendingOrgs = orgs?.filter(o => o.approval_status === 'pending').length ?? 0

  const alertsByOrg: Record<string, { sent: number; responded: number }> = {}
  for (const alert of alerts ?? []) {
    if (!alertsByOrg[alert.rescue_id]) alertsByOrg[alert.rescue_id] = { sent: 0, responded: 0 }
    alertsByOrg[alert.rescue_id].sent++
    if (alert.status === 'responded') alertsByOrg[alert.rescue_id].responded++
  }

  const stats = [
    { label: 'Pending', value: pendingOrgs, warn: pendingOrgs > 0 },
    { label: 'Organizations', value: totalOrgs },
    { label: 'Dogs Listed', value: totalDogs },
    { label: 'Response Rate', value: `${responseRate}%`, accent: totalInterested > 0 },
  ]

  return (
    <div className="min-h-screen bg-[#f5f0e8]">
      <header className="bg-[#13241d] pb-12 px-8 pt-8 border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <p className="text-xs uppercase tracking-[0.24em] text-[#f4b942]/70 mb-3 font-bold">DOGSRUN</p>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-[#f4b942]">Admin Panel</h1>
          <p className="text-[#f5f0e8]/50 mt-2 text-sm">Manage organizations, dogs, and network activity.</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-10 px-8 space-y-10">
        {/* Stats */}
        <section>
          <p className="text-xs uppercase tracking-[0.24em] font-bold text-[#5d6a64] mb-6">Overview</p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {stats.map(({ label, value, accent, warn }: { label: string; value: string | number; accent?: boolean; warn?: boolean }) => (
              <div key={label} className="bg-[#fff9ef] outline outline-1 outline-[#13241d]/10 p-4 text-center">
                <div className={`text-2xl font-black mb-1 ${warn ? 'text-[#d95f4b]' : accent ? 'text-green-700' : 'text-[#13241d]'}`}>
                  {value}
                </div>
                <div className="text-[10px] font-bold text-[#5d6a64] uppercase tracking-[0.24em] leading-tight">{label}</div>
              </div>
            ))}
          </div>
        </section>

        <AdminTabs
          tabs={[
            {
              id: 'organizations',
              label: 'Organizations',
              count: totalOrgs,
              content: <AdminOrgTable orgs={orgs ?? []} alertsByOrg={alertsByOrg} />,
            },
            {
              id: 'dogs',
              label: 'Dogs',
              count: totalDogs,
              content: <AdminDogsTable dogs={dogs ?? []} />,
            },
            {
              id: 'activity',
              label: 'Activity',
              count: recentAlerts?.length ?? 0,
              content: (
                <div className="bg-[#fff9ef] outline outline-1 outline-[#13241d]/10 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-[#13241d]">
                        {['Dog', 'Rescue', 'Status', 'Date'].map(h => (
                          <th key={h} className="text-left px-4 py-3 font-bold text-[#f4b942]/70 uppercase tracking-[0.24em] text-xs">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {recentAlerts && recentAlerts.length > 0 ? recentAlerts.map((
                        alert: {
                          id: string
                          dogs: { name: string; breed: string } | null
                          organizations: { name: string } | null
                          status: string
                          sent_at: string | null
                        },
                        i: number
                      ) => (
                        <tr key={alert.id} className={i % 2 === 0 ? 'bg-[#fff9ef]' : 'bg-[#f5f0e8]/60'}>
                          <td className="px-4 py-3 font-semibold text-[#13241d]">
                            {alert.dogs?.name ?? '—'}
                            <span className="text-[#5d6a64] font-normal"> · {alert.dogs?.breed ?? ''}</span>
                          </td>
                          <td className="px-4 py-3 text-[#5d6a64]">{alert.organizations?.name ?? '—'}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-block px-2 py-0.5 text-xs font-bold uppercase tracking-[0.1em] ${
                              alert.status === 'responded' ? 'bg-green-100 text-green-700' :
                              alert.status === 'declined' ? 'bg-[#f5f0e8] text-[#5d6a64]' :
                              'bg-[#13241d]/10 text-[#13241d]'
                            }`}>
                              {alert.status === 'responded' ? 'Interested' : alert.status === 'declined' ? 'Passed' : 'Sent'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-[#5d6a64] text-xs">
                            {alert.sent_at ? new Date(alert.sent_at).toLocaleDateString() : '—'}
                          </td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan={4} className="px-4 py-12 text-center text-[#5d6a64] text-sm">No activity yet</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              ),
            },
          ]}
        />
      </main>
    </div>
  )
}
