import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import StatusBadge from '@/components/status-badge'
import AlertActions from './alert-actions'
import SignOutButton from '../sign-out-button'

export default async function RescuePortalPage() {
  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
          }
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const { data: org } = await supabase
    .from('organizations')
    .select('*')
    .eq('email', user.email)
    .single()

  if (!org || org.type !== 'rescue') {
    redirect('/dashboard')
  }

  const { data: alerts } = await supabase
    .from('alerts')
    .select('*, dogs(*, organizations(name, city, state))')
    .eq('rescue_id', org.id)
    .order('sent_at', { ascending: false, nullsFirst: false })

  return (
    <div className="min-h-screen bg-white">
      {/* Dashboard Sub-nav */}
      <div className="bg-[#111] border-t border-white/5 py-2 px-8">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex gap-6">
            <Link href="/dashboard/rescue" className="text-xs font-bold text-[#f59e0b] uppercase tracking-widest">Incoming Alerts</Link>
            <Link href="/dashboard/criteria" className="text-xs font-bold text-[#9ca3af] hover:text-white uppercase tracking-widest transition-colors">Matching Criteria</Link>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs font-bold text-[#9ca3af] uppercase tracking-widest">{org.name}</span>
            <SignOutButton />
          </div>
        </div>
      </div>

      {/* Hero band */}
      <header className="bg-[#fffbeb] border-b border-gray-200 py-12 px-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-[900] tracking-tight text-[#111] mb-2">
            {org.name || 'Rescue Portal'}
          </h1>
          <p className="text-[#6b7280]">New dog matches based on your organization&apos;s criteria.</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-8 px-8">
        <div className="space-y-6">
          {alerts && alerts.length > 0 ? (
            alerts.map((alert: any) => (
              <div key={alert.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-none hover:border-[#f59e0b]/30 transition-all">
                <div className="p-8">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-start gap-6">
                      <div className="w-16 h-16 rounded-lg bg-[#fffbeb] flex items-center justify-center text-2xl font-[900] text-[#f59e0b] flex-shrink-0 overflow-hidden">
                        {alert.dogs?.photo_url ? (
                          <img src={alert.dogs.photo_url} alt={alert.dogs.name} className="w-full h-full object-cover" />
                        ) : (
                          alert.dogs?.name?.[0] || 'D'
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <h2 className="text-xl font-bold text-[#111]">{alert.dogs?.name || 'Unnamed Dog'}</h2>
                          <StatusBadge status={alert.dogs?.status || 'available'} />
                        </div>
                        <p className="text-sm text-[#6b7280] mb-2">
                          {alert.dogs?.breed || 'Unknown breed'} • {alert.dogs?.age_years ? `${alert.dogs?.age_years}y` : '—'} • {alert.dogs?.sex || '—'}
                        </p>
                        <p className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-widest">
                          Listed by <span className="text-[#111]">{alert.dogs?.organizations?.name}</span> • {alert.dogs?.organizations?.city}, {alert.dogs?.organizations?.state}
                        </p>
                      </div>
                    </div>

                    <div className="flex-shrink-0">
                      <AlertActions alertId={alert.id} currentStatus={alert.status} />
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50/50 px-8 py-3 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-widest">Received {new Date(alert.sent_at).toLocaleDateString()}</span>
                  <Link href={`/dashboard/dogs/${alert.dog_id}`} className="text-xs font-bold text-[#f59e0b] hover:underline">View Full Profile →</Link>
                </div>
              </div>
            ))
          ) : (
            <div className="py-20 bg-[#fffbeb] rounded-xl border border-dashed border-gray-200 text-center">
              <h3 className="text-lg font-bold text-[#111] mb-2">No alerts yet</h3>
              <p className="text-[#6b7280] max-w-sm mx-auto mb-8">Make sure your matching criteria are set up to start receiving dog matches.</p>
              <Link href="/dashboard/criteria" className="inline-block bg-[#111] text-white font-semibold rounded-lg px-5 py-2.5 hover:bg-black transition-colors">
                Manage Criteria
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
