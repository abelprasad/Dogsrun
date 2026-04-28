import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import SignOutButton from '../sign-out-button'
import AdminOrgTable from './org-table'

export default async function AdminPage() {
  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options))
          } catch {}
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: admin } = await supabase
    .from('admins')
    .select('id')
    .eq('email', user.email)
    .maybeSingle()

  if (!admin) redirect('/dashboard')

  const serviceClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: orgs } = await serviceClient
    .from('organizations')
    .select('*')
    .order('created_at', { ascending: false })

  const { data: dogs } = await serviceClient
    .from('dogs')
    .select('*, organizations(name)')
    .order('created_at', { ascending: false })

  const { data: alerts } = await serviceClient
    .from('alerts')
    .select('rescue_id, status')

  const totalOrgs = orgs?.length ?? 0
  const totalShelters = orgs?.filter(o => o.type === 'shelter').length ?? 0
  const totalRescues = orgs?.filter(o => o.type === 'rescue').length ?? 0
  const totalDogs = dogs?.length ?? 0
  const totalAlerts = alerts?.length ?? 0
  const totalInterested = alerts?.filter(a => a.status === 'responded').length ?? 0

  const alertsByOrg: Record<string, { sent: number; responded: number }> = {}
  for (const alert of alerts ?? []) {
    if (!alertsByOrg[alert.rescue_id]) alertsByOrg[alert.rescue_id] = { sent: 0, responded: 0 }
    alertsByOrg[alert.rescue_id].sent++
    if (alert.status === 'responded') alertsByOrg[alert.rescue_id].responded++
  }

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

        <section>
          <h2 className="text-xl font-bold text-[#111] mb-6">Overview</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { label: 'Total Orgs', value: totalOrgs },
              { label: 'Shelters', value: totalShelters },
              { label: 'Rescues', value: totalRescues },
              { label: 'Dogs Listed', value: totalDogs },
              { label: 'Alerts Sent', value: totalAlerts },
              { label: 'Interested', value: totalInterested },
            ].map(({ label, value }) => (
              <div key={label} className="bg-[#fffbeb] rounded-xl border border-gray-200 p-5 text-center">
                <div className="text-3xl font-[900] text-[#111] mb-1">{value}</div>
                <div className="text-xs font-semibold text-[#6b7280] uppercase tracking-widest">{label}</div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold text-[#111] mb-6">Organizations</h2>
          <AdminOrgTable orgs={orgs ?? []} alertsByOrg={alertsByOrg} />
        </section>

        <section>
          <h2 className="text-xl font-bold text-[#111] mb-6">All Dogs</h2>
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-semibold text-[#6b7280] uppercase tracking-wider text-xs">Name</th>
                  <th className="text-left px-4 py-3 font-semibold text-[#6b7280] uppercase tracking-wider text-xs">Breed</th>
                  <th className="text-left px-4 py-3 font-semibold text-[#6b7280] uppercase tracking-wider text-xs">Shelter</th>
                  <th className="text-left px-4 py-3 font-semibold text-[#6b7280] uppercase tracking-wider text-xs">Status</th>
                  <th className="text-left px-4 py-3 font-semibold text-[#6b7280] uppercase tracking-wider text-xs">Added</th>
                </tr>
              </thead>
              <tbody>
                {dogs && dogs.length > 0 ? dogs.map((dog, i) => (
                  <tr key={dog.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                    <td className="px-4 py-3 font-semibold text-[#111]">{dog.name ?? '—'}</td>
                    <td className="px-4 py-3 text-[#6b7280]">{dog.breed ?? '—'}{dog.mix ? ' mix' : ''}</td>
                    <td className="px-4 py-3 text-[#6b7280]">{(dog.organizations as {name: string} | null)?.name ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${
                        dog.status === 'available' ? 'bg-green-100 text-green-700' :
                        dog.status === 'adopted' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {dog.status ?? 'available'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[#9ca3af]">
                      {dog.created_at ? new Date(dog.created_at).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-[#9ca3af]">No dogs found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

      </main>
    </div>
  )
}
