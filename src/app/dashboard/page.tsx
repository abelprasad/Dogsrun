import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import Link from 'next/link'
import Image from 'next/image'
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

  // Approval wall for shelters
  if (org.approval_status !== 'approved') {
    const isRejected = org.approval_status === 'rejected'
    return (
      <div className="min-h-screen bg-white">
        <div className="bg-[#111] border-t border-white/5 py-2 px-8">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <span className="text-xs font-bold text-[#9ca3af] uppercase tracking-widest">{org.name}</span>
            <SignOutButton />
          </div>
        </div>
        <header className="bg-[#fffbeb] border-b border-gray-200 py-12 px-8">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-[900] tracking-tight text-[#111] mb-2">{org.name}</h1>
            <p className="text-[#6b7280]">Shelter Portal</p>
          </div>
        </header>
        <main className="max-w-7xl mx-auto py-16 px-8 flex justify-center">
          <div className="max-w-md w-full text-center">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 ${isRejected ? 'bg-red-50' : 'bg-[#fffbeb]'}`}>
              {isRejected ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-[#f59e0b]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </div>
            <h2 className="text-2xl font-bold text-[#111] mb-3">
              {isRejected ? 'Application Not Approved' : 'Application Under Review'}
            </h2>
            <p className="text-[#6b7280] mb-6">
              {isRejected
                ? "We weren't able to verify your 501(c)(3) status. Please contact us to resubmit your documentation."
                : 'Your 501(c)(3) documentation is being reviewed by our team. You\'ll receive an email once you\'re approved.'}
            </p>
            {isRejected && (
              <a href="mailto:admin@dogsrun.org" className="inline-block bg-[#111] text-white font-semibold rounded-lg px-5 py-2.5 hover:bg-black transition-colors">
                Contact Us
              </a>
            )}
          </div>
        </main>
      </div>
    )
  }

  // Check if user is admin
  const { data: admin } = await supabase
    .from('admins')
    .select('id')
    .eq('email', user.email)
    .maybeSingle()

  const isAdmin = !!admin

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
            <Link href="/dashboard/dogs" className="text-xs font-bold text-[#9ca3af] hover:text-white uppercase tracking-widest transition-colors">My Dogs</Link>
            <Link href="/dashboard/dogs/new" className="text-xs font-bold text-[#9ca3af] hover:text-white uppercase tracking-widest transition-colors">Add Dog</Link>
            {isAdmin && (
              <Link href="/dashboard/admin" className="text-xs font-bold text-[#f59e0b]/60 hover:text-[#f59e0b] uppercase tracking-widest transition-colors">Admin</Link>
            )}
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
            {org.name}
          </h1>
          <p className="text-[#6b7280]">Manage your dogs and track rescue interest.</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-8 px-8">
        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <div className="bg-[#fffbeb] rounded-xl border border-gray-100 p-5">
            <p className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-widest mb-1">Total Dogs</p>
            <p className="text-3xl font-[900] text-[#111]">{dogs?.length || 0}</p>
          </div>
          <div className="bg-[#fffbeb] rounded-xl border border-gray-100 p-5">
            <p className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-widest mb-1">Available</p>
            <p className="text-3xl font-[900] text-[#111]">{dogs?.filter(d => d.status === 'available' || !d.status).length || 0}</p>
          </div>
          <div className="bg-red-50 rounded-xl border border-red-100 p-5">
            <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest mb-1">Urgent</p>
            <p className="text-3xl font-[900] text-red-600">{dogs?.filter(d => d.status === 'urgent').length || 0}</p>
          </div>
          <div className="bg-[#dcfce7] rounded-xl border border-green-100 p-5">
            <p className="text-[10px] font-bold text-green-600 uppercase tracking-widest mb-1">Placed / Adopted</p>
            <p className="text-3xl font-[900] text-green-700">{dogs?.filter(d => d.status === 'placed' || d.status === 'adopted').length || 0}</p>
          </div>
        </div>

        {/* My Dogs section */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-[900] text-[#111] uppercase tracking-widest">Recent Dogs</h2>
          <Link href="/dashboard/dogs" className="text-sm font-bold text-[#f59e0b] hover:underline">Manage all dogs →</Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {dogs && dogs.length > 0 ? (
            dogs.slice(0, 6).map((dog) => (
              <div key={dog.id} className="bg-white border border-gray-100 rounded-xl overflow-hidden flex flex-col shadow-sm">
                <div className="w-full h-32 bg-gray-100 overflow-hidden relative">
                  {dog.photo_url ? (
                    <Image src={dog.photo_url} alt={dog.name} fill className="object-cover" unoptimized />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl font-[900] text-[#f59e0b]">
                      {dog.name?.[0]}
                    </div>
                  )}
                </div>
                <div className="p-4 flex flex-col flex-1">
                  <div className="flex justify-between items-start mb-1">
                    <h2 className="text-base font-[900] text-[#111]">{dog.name}</h2>
                    <StatusBadge status={dog.status || 'available'} />
                  </div>
                  <p className="text-xs text-[#6b7280]">{dog.breed || 'Unknown breed'}{dog.age_years ? ` · ${dog.age_years}y` : ''}</p>
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
