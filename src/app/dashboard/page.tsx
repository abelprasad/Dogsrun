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
    .eq('id', user.id)
    .single()

  if (!org) {
    redirect('/register')
  }

  if (org.type === 'rescue') {
    redirect('/dashboard/rescue')
  }

  const { data: dogs } = await supabase
    .from('dogs')
    .select('*')
    .eq('shelter_id', org.id)
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-white">
      {/* Dashboard Sub-nav */}
      <div className="bg-[#111] border-t border-white/5 py-2 px-8">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex gap-6">
            <Link href="/dashboard" className="text-xs font-bold text-[#f59e0b] uppercase tracking-widest">Dashboard</Link>
            <Link href="/dashboard/dogs/new" className="text-xs font-bold text-[#9ca3af] hover:text-white uppercase tracking-widest transition-colors">Add Dog</Link>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs font-bold text-[#9ca3af] uppercase tracking-widest">{org.name}</span>
            <SignOutButton />
          </div>
        </div>
      </div>

      {/* Hero band */}
      <header className="bg-[#fffbeb] border-b border-gray-200 py-12 px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-[900] tracking-tight text-[#111] mb-2">
              {org.name}
            </h1>
            <p className="text-[#6b7280]">Manage your dogs and track rescue interest.</p>
          </div>
          <Link href="/dashboard/dogs/new" className="inline-block bg-[#f59e0b] text-[#451a03] font-semibold rounded-lg px-5 py-2.5 hover:bg-[#d97706] transition-colors">
            + Add a dog
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-8 px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {dogs && dogs.length > 0 ? (
            dogs.map((dog) => (
              <div key={dog.id} className="bg-white border border-gray-100 rounded-xl overflow-hidden flex flex-col shadow-sm">
                <div className="w-full h-36 bg-gray-100 overflow-hidden">
                  {dog.photo_url ? (
                    <img src={dog.photo_url} alt={dog.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="p-6 flex flex-col flex-1 justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <h2 className="text-xl font-bold text-[#111]">{dog.name}</h2>
                      <StatusBadge status={dog.status || 'available'} />
                    </div>
                    <p className="text-sm text-[#6b7280] mb-4">{dog.breed || 'Unknown breed'}</p>
                    <div className="flex gap-4 text-xs font-semibold text-[#9ca3af] mb-6">
                      <span>{dog.age_years ? `${dog.age_years}y` : '—'}</span>
                      <span>{dog.sex || '—'}</span>
                      <span>{dog.weight_lbs ? `${dog.weight_lbs} lbs` : '—'}</span>
                    </div>
                  </div>
                  <Link 
                    href={`/dashboard/dogs/${dog.id}`} 
                    className="block w-full text-center border border-[#d1d5db] text-[#374151] bg-transparent font-semibold rounded-lg px-4 py-2 hover:bg-gray-50 transition-colors text-sm"
                  >
                    Manage Dog
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-20 bg-[#fffbeb] rounded-xl border border-dashed border-gray-200 text-center">
              <p className="text-[#6b7280] mb-4">No dogs listed yet.</p>
              <Link href="/dashboard/dogs/new" className="text-[#f59e0b] font-bold hover:underline">Add your first dog</Link>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
