import AdminOrgTable from './org-table'
import AdminDogsTable from './dogs-table'
import AdminTabs from './admin-tabs'
import { supabaseAdmin } from '@/lib/supabase-server'

export default async function AdminPage() {
  // Head-only counts for the stats cards (dashboard style); tables paginate their own data.
  const [
    { count: totalOrgs },
    { count: pendingOrgs },
    { count: totalDogs },
    { count: totalAlerts },
    { count: totalInterested },
    { data: recentAlerts },
  ] = await Promise.all([
    supabaseAdmin.from('organizations').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('organizations').select('*', { count: 'exact', head: true }).eq('approval_status', 'pending'),
    supabaseAdmin.from('dogs').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('alerts').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('alerts').select('*', { count: 'exact', head: true }).eq('status', 'responded'),
    supabaseAdmin.from('alerts')
      .select('*, dogs(name, breed), organizations!alerts_rescue_id_fkey(name)')
      .order('sent_at', { ascending: false })
      .limit(20),
  ])

  const orgCount = totalOrgs ?? 0
  const pendingCount = pendingOrgs ?? 0
  const dogCount = totalDogs ?? 0
  const alertCount = totalAlerts ?? 0
  const interestedCount = totalInterested ?? 0
  const responseRate = alertCount > 0 ? Math.round((interestedCount / alertCount) * 100) : 0

  const stats = [
    { label: 'Pending approvals', value: pendingCount, tone: pendingCount > 0 ? 'text-[#c98a7a]' : 'text-[#f8f1e8]', sub: 'need a decision', hot: pendingCount > 0 },
    { label: 'Organizations', value: orgCount, tone: 'text-[#f8f1e8]', sub: 'in the network' },
    { label: 'Dogs listed', value: dogCount, tone: 'text-[#c08a3e]', sub: 'across shelters' },
    { label: 'Response rate', value: `${responseRate}%`, tone: 'text-[#7ddba3]', sub: `${interestedCount} interested` },
  ]

  return (
    <div className="min-h-screen bg-[#0b140e] text-[#f8f1e8]">
      {/* ── HEADER ── */}
      <header className="border-b border-white/10 px-5 pb-10 pt-12 sm:px-10 lg:px-16">
        <div className="mx-auto max-w-7xl">
          <p className="flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.3em] text-[#c08a3e]">
            <span className="animate-pulse-dot h-2.5 w-2.5 rounded-full bg-[#c08a3e]" />
            DOGSRUN · admin
          </p>
          <h1 className="mt-6 text-[clamp(2.5rem,6vw,5rem)] font-black uppercase leading-[0.88] tracking-tight">
            Command <span className="text-[#c08a3e]">center.</span>
          </h1>
          <p className="mt-4 text-sm font-bold uppercase tracking-[0.2em] text-[#f8f1e8]/50">
            Organizations, dogs, and network activity
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-10 px-5 py-10 sm:px-10 lg:px-16">
        {/* ── BIG NUMBER STAT BAND ── */}
        <section>
          <p className="mb-6 text-[11px] font-black uppercase tracking-[0.28em] text-[#f8f1e8]/45">Overview</p>
          <div className="grid grid-cols-2 gap-px bg-white/10 lg:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className={`bg-[#122016] p-7 sm:p-9 ${s.hot ? 'bg-[#a8583f]/15' : ''}`}>
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#f8f1e8]/45">{s.label}</p>
                <p className={`mt-3 text-6xl font-black tracking-tight sm:text-7xl ${s.tone}`}>
                  {s.value}
                </p>
                <p className="mt-2 text-xs font-bold uppercase tracking-[0.18em] text-[#f8f1e8]/40">{s.sub}</p>
              </div>
            ))}
          </div>
        </section>

        <AdminTabs
          tabs={[
            {
              id: 'organizations',
              label: 'Organizations',
              count: orgCount,
              content: <AdminOrgTable />,
            },
            {
              id: 'dogs',
              label: 'Dogs',
              count: dogCount,
              content: <AdminDogsTable />,
            },
            {
              id: 'activity',
              label: 'Activity',
              count: recentAlerts?.length ?? 0,
              content: (
                <div className="overflow-x-auto border border-white/10 bg-[#122016]">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/10">
                        {['Dog', 'Rescue', 'Status', 'Date'].map(h => (
                          <th key={h} className="whitespace-nowrap px-4 py-3 text-left text-xs font-black uppercase tracking-[0.24em] text-[#f8f1e8]/45">{h}</th>
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
                        <tr key={alert.id} className={`border-b border-white/5 ${i % 2 === 0 ? '' : 'bg-white/[0.02]'}`}>
                          <td className="px-4 py-3 font-bold text-[#f8f1e8]">
                            {alert.dogs?.name ?? '—'}
                            <span className="font-normal text-[#f8f1e8]/45"> · {alert.dogs?.breed ?? ''}</span>
                          </td>
                          <td className="px-4 py-3 text-[#f8f1e8]/60">{alert.organizations?.name ?? '—'}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-block border px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.14em] ${
                              alert.status === 'responded' ? 'border-[#7ddba3]/50 text-[#7ddba3]' :
                              alert.status === 'declined' ? 'border-white/15 text-[#f8f1e8]/40' :
                              'border-[#c08a3e]/40 text-[#c08a3e]'
                            }`}>
                              {alert.status === 'responded' ? 'Interested' : alert.status === 'declined' ? 'Passed' : 'Sent'}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-xs text-[#f8f1e8]/45">
                            {alert.sent_at ? new Date(alert.sent_at).toLocaleDateString() : '—'}
                          </td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan={4} className="px-4 py-12 text-center text-sm text-[#f8f1e8]/40">No activity yet</td>
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
