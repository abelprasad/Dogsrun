import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import StatusBadge from '@/components/status-badge'
import StatusUpdater from './status-updater'

export default async function DogProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
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
            // Can be ignored if you have middleware refreshing user sessions.
          }
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Fetch current user's organization
  const { data: userOrg } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', user.id)
    .single()

  // Fetch dog details
  const { data: dog } = await supabase
    .from('dogs')
    .select('*, organizations(*)')
    .eq('id', id)
    .single()

  if (!dog) {
    notFound()
  }

  // Fetch alert history for this dog
  const { data: alerts } = await supabase
    .from('alerts')
    .select('*, organizations!alerts_rescue_id_fkey(name, city, state)')
    .eq('dog_id', id)
    .order('created_at', { ascending: false })

  const isShelter = userOrg?.type === 'shelter'
  const isDogShelter = isShelter && userOrg.id === dog.shelter_id
  const backLink = userOrg?.type === 'rescue' ? '/dashboard/rescue' : '/dashboard'

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans antialiased">
      {/* Navbar */}
      <nav className="border-b border-gray-100 bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="text-2xl font-bold text-[#f59e0b] tracking-tight">DOGSRUN</Link>
            <div className="hidden md:flex items-center gap-6">
              <Link href={backLink} className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">Dashboard</Link>
              <span className="text-sm font-bold text-gray-900 border-b-2 border-[#f59e0b] pb-1">Dog Profile</span>
            </div>
          </div>
          <Link href={backLink} className="text-sm font-bold text-gray-500 hover:text-[#f59e0b] transition-colors">
            ← Back to Dashboard
          </Link>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Main Info */}
          <div className="md:col-span-2 space-y-8">
            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-xl overflow-hidden relative">
               <div className="absolute top-0 right-0 p-8">
                <StatusBadge status={dog.status || 'available'} />
              </div>
              <div className="flex flex-col gap-6">
                <div className="w-24 h-24 rounded-3xl bg-amber-50 flex items-center justify-center text-4xl font-black text-[#f59e0b]">
                  {dog.name?.[0] || 'D'}
                </div>
                <div>
                  <h1 className="text-4xl font-black text-gray-900 mb-2">{dog.name || 'Unnamed Dog'}</h1>
                  <p className="text-xl text-gray-500 font-medium">{dog.breed || 'Unknown breed'}{dog.mix ? ' mix' : ''}</p>
                </div>
                
                <div className="grid grid-cols-3 gap-4 py-6 border-y border-gray-100">
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Age</p>
                    <p className="text-lg font-bold text-gray-900">{dog.age_years ? `${dog.age_years} years` : '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Sex</p>
                    <p className="text-lg font-bold text-gray-900">{dog.sex || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Weight</p>
                    <p className="text-lg font-bold text-gray-900">{dog.weight_lbs ? `${dog.weight_lbs} lbs` : '—'}</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Description / Notes</h3>
                  <p className="text-gray-700 leading-relaxed bg-gray-50 p-6 rounded-2xl border border-gray-100">
                    {dog.description || 'No additional notes provided for this dog.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Alert History (Only for the shelter that owns the dog) */}
            {isDogShelter && (
              <div className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden">
                <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="text-lg font-bold text-gray-900">Rescue Outreach</h3>
                  <span className="text-xs font-bold bg-gray-100 text-gray-600 px-2 py-1 rounded-full">{alerts?.length || 0} alerts sent</span>
                </div>
                <div className="divide-y divide-gray-100">
                  {alerts && alerts.length > 0 ? (
                    alerts.map((alert: any) => (
                      <div key={alert.id} className="px-8 py-5 flex items-center justify-between hover:bg-gray-50 transition-colors">
                        <div>
                          <p className="font-bold text-gray-900">{alert.organizations?.name}</p>
                          <p className="text-xs text-gray-500">{alert.organizations?.city}, {alert.organizations?.state}</p>
                        </div>
                        <div className="text-right">
                          <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md border ${
                            alert.status === 'sent' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                            alert.status === 'responded' ? 'bg-green-50 text-green-700 border-green-100' :
                            'bg-gray-50 text-gray-700 border-gray-100'
                          }`}>
                            {alert.status}
                          </span>
                          <p className="text-[10px] text-gray-400 mt-1">{new Date(alert.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="px-8 py-10 text-center text-gray-500">
                      No rescue alerts have been sent for this dog yet.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {isDogShelter && (
              <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xl">
                <StatusUpdater dogId={dog.id} currentStatus={dog.status || 'available'} />
              </div>
            )}

            <div className="bg-amber-50 p-6 rounded-3xl border border-amber-100">
              <h3 className="text-xs font-bold text-[#b45309] uppercase tracking-widest mb-4">Shelter Information</h3>
              <p className="font-bold text-gray-900 mb-1">{dog.organizations?.name}</p>
              <p className="text-sm text-gray-600 mb-4">{dog.organizations?.city}, {dog.organizations?.state}</p>
              <p className="text-xs text-gray-500 leading-tight">
                {isDogShelter ? 'This dog is currently listed by your shelter.' : 'Contact this shelter to inquire about this dog.'}
              </p>
            </div>

            {isDogShelter && (
              <div className="bg-gray-900 p-6 rounded-3xl border border-gray-800 text-white shadow-xl">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <button className="w-full py-3 bg-gray-800 hover:bg-gray-700 rounded-xl text-xs font-bold transition-colors">Edit Details</button>
                  <button className="w-full py-3 bg-gray-800 hover:bg-gray-700 rounded-xl text-xs font-bold transition-colors">Share Profile</button>
                  <button className="w-full py-3 bg-red-900/50 hover:bg-red-900/80 text-red-200 rounded-xl text-xs font-bold transition-colors">Mark as Urgent</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
