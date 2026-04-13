import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import StatusBadge from '@/components/status-badge'
import AlertActions from './alert-actions'

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
            // Ignored.
          }
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Fetch organization
  const { data: org } = await supabase
    .from('organizations')
    .select('*')
    .eq('email', user.email)
    .single()

  if (!org || org.type !== 'rescue') {
    redirect('/dashboard')
  }

  // Fetch incoming alerts with dog info
  const { data: alerts } = await supabase
    .from('alerts')
    .select('*, dogs(*, organizations(name, city, state))')
    .eq('rescue_id', org.id)
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans antialiased">
      {/* Navbar */}
      <nav className="border-b border-gray-100 bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="text-2xl font-bold text-[#f59e0b] tracking-tight">DOGSRUN</Link>
            <div className="hidden md:flex items-center gap-6">
              <Link href="/dashboard/rescue" className="text-sm font-bold text-gray-900 border-b-2 border-[#f59e0b] pb-1">Incoming Alerts</Link>
              <Link href="/dashboard/criteria" className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">Matching Criteria</Link>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-gray-900">{org.name}</p>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider">Rescue Portal</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-xs font-bold text-[#f59e0b]">
              {org.name[0]}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-10">
          <h1 className="text-3xl font-extrabold text-gray-900">Rescue Dashboard</h1>
          <p className="text-gray-600 mt-2">New dog matches based on your organization's criteria.</p>
        </div>

        <div className="space-y-6">
          {alerts && alerts.length > 0 ? (
            alerts.map((alert: any) => (
              <div key={alert.id} className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden hover:border-amber-200 transition-all group">
                <div className="p-8">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-start gap-6">
                      <div className="w-20 h-20 rounded-3xl bg-amber-50 flex items-center justify-center text-3xl font-black text-[#f59e0b] flex-shrink-0">
                        {alert.dogs?.name?.[0] || 'D'}
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h2 className="text-2xl font-black text-gray-900">{alert.dogs?.name || 'Unnamed Dog'}</h2>
                          <StatusBadge status={alert.dogs?.status || 'available'} />
                          {alert.dogs?.status === 'urgent' && (
                            <span className="animate-pulse bg-red-100 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Urgent</span>
                          )}
                        </div>
                        <p className="text-gray-500 font-medium mb-3">
                          {alert.dogs?.breed || 'Unknown breed'} • {alert.dogs?.age_years ? `${alert.dogs?.age_years}y` : '—'} • {alert.dogs?.sex || '—'}
                        </p>
                        <p className="text-xs text-gray-400">
                          Listed by <span className="font-bold text-gray-700">{alert.dogs?.organizations?.name}</span> • {alert.dogs?.organizations?.city}, {alert.dogs?.organizations?.state}
                        </p>
                      </div>
                    </div>

                    <div className="flex-shrink-0">
                      <AlertActions alertId={alert.id} currentStatus={alert.status} />
                    </div>
                  </div>

                  {alert.dogs?.description && (
                    <div className="mt-8 pt-6 border-t border-gray-100">
                      <p className="text-sm text-gray-600 leading-relaxed italic">
                        "{alert.dogs.description.substring(0, 180)}{alert.dogs.description.length > 180 ? '...' : ''}"
                      </p>
                    </div>
                  )}
                </div>
                
                <div className="bg-gray-50/50 px-8 py-3 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Received {new Date(alert.created_at).toLocaleDateString()}</span>
                  <Link href={`/dashboard/dogs/${alert.dog_id}`} className="text-xs font-bold text-[#f59e0b] hover:underline">View Full Profile →</Link>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white py-32 rounded-3xl border border-gray-100 text-center shadow-inner">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 mx-auto mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No alerts yet</h3>
              <p className="text-gray-500 max-w-sm mx-auto">Make sure your matching criteria are set up to start receiving dog matches.</p>
              <Link href="/dashboard/criteria" className="inline-flex items-center px-6 py-3 mt-8 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-all shadow-sm">
                Manage Criteria
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}