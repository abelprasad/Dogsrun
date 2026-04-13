import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import StatusBadge from '@/components/status-badge'
import SignOutButton from './sign-out-button'

export default async function DashboardPage() {
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
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
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
    .eq('id', user.id)
    .single()

  if (!org) {
    // If user has no org profile, maybe they need to register it
    redirect('/register')
  }

  if (org.type === 'rescue') {
    redirect('/dashboard/rescue')
  }

  // Fetch dogs for this shelter
  const { data: dogs } = await supabase
    .from('dogs')
    .select('*')
    .eq('shelter_id', org.id)
    .order('created_at', { ascending: false })

  const stats = {
    total: dogs?.length || 0,
    urgent: dogs?.filter(d => d.status === 'urgent').length || 0,
    placed: dogs?.filter(d => ['placed', 'adopted'].includes(d.status)).length || 0,
  }

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans antialiased">
      {/* Navbar */}
      <nav className="border-b border-gray-100 bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="text-2xl font-bold text-[#f59e0b] tracking-tight">DOGSRUN</Link>
            <div className="hidden md:flex items-center gap-6">
              <Link href="/dashboard" className="text-sm font-bold text-gray-900 border-b-2 border-[#f59e0b] pb-1">Dashboard</Link>
              <Link href="/dashboard/dogs/new" className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">Add Dog</Link>
            </div>
          </div>
          <div className="flex items-center gap-4">
             <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-gray-900">{org.name}</p>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider">{org.type}</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-xs font-bold text-[#f59e0b]">
              {org.name[0]}
            </div>
            <SignOutButton />
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Shelter Dashboard</h1>
            <p className="text-gray-500 mt-1">Manage your dogs and track rescue interest.</p>
          </div>
          <Link href="/dashboard/dogs/new" className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-sm font-bold rounded-xl shadow-lg text-white bg-[#f59e0b] hover:bg-[#d97706] transition-all transform active:scale-95">
            + Add New Dog
          </Link>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
            <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Total Dogs</p>
            <p className="text-4xl font-black text-gray-900">{stats.total}</p>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
            <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Urgent Need</p>
            <p className="text-4xl font-black text-red-600">{stats.urgent}</p>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
            <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Saved / Placed</p>
            <p className="text-4xl font-black text-green-600">{stats.placed}</p>
          </div>
        </div>

        {/* Dogs Table */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Dog</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Details</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {dogs && dogs.length > 0 ? (
                  dogs.map((dog) => (
                    <tr key={dog.id} className="hover:bg-amber-50/30 transition-colors group">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-400 font-bold">
                            {dog.name?.[0] || 'D'}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 group-hover:text-[#f59e0b] transition-colors">{dog.name || 'Unnamed'}</p>
                            <p className="text-xs text-gray-500">{dog.breed || 'Unknown breed'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <p className="text-sm text-gray-600">{dog.age_years ? `${dog.age_years}y` : '—'} • {dog.sex || '—'} • {dog.weight_lbs ? `${dog.weight_lbs} lbs` : '—'}</p>
                      </td>
                      <td className="px-6 py-5">
                        <StatusBadge status={dog.status || 'available'} />
                      </td>
                      <td className="px-6 py-5 text-right">
                        <Link href={`/dashboard/dogs/${dog.id}`} className="inline-flex items-center justify-center px-4 py-2 border border-gray-200 text-xs font-bold rounded-xl text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm">
                          View Profile
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 mb-4">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                        </div>
                        <p className="text-gray-500 font-medium">No dogs added yet.</p>
                        <Link href="/dashboard/dogs/new" className="text-[#f59e0b] font-bold mt-2 hover:underline">Add your first dog</Link>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}
