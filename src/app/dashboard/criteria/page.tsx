import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import SignOutButton from '../sign-out-button'

export default async function CriteriaPage() {
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
    .eq('id', user.id)
    .single()

  if (!org || org.type !== 'rescue') {
    redirect('/dashboard')
  }

  // Fetch rescue criteria
  const { data: criteria } = await supabase
    .from('rescue_criteria')
    .select('*')
    .eq('organization_id', org.id)
    .single()

  const backLink = '/dashboard/rescue'

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans antialiased">
      {/* Navbar */}
      <nav className="border-b border-gray-100 bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="text-2xl font-bold text-[#f59e0b] tracking-tight">DOGSRUN</Link>
            <div className="hidden md:flex items-center gap-6">
              <Link href={backLink} className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">Incoming Alerts</Link>
              <span className="text-sm font-bold text-gray-900 border-b-2 border-[#f59e0b] pb-1">Matching Criteria</span>
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
            <SignOutButton />
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900">Matching Criteria</h1>
            <p className="text-gray-600 mt-2">Define which dogs your rescue organization can support.</p>
          </div>
          <Link href="/dashboard/criteria/edit" className="inline-flex items-center justify-center px-6 py-3 border border-gray-200 text-sm font-bold rounded-xl text-gray-700 bg-white hover:bg-gray-50 transition-all shadow-sm">
            Edit Criteria
          </Link>
        </div>

        {criteria ? (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden">
            <div className="p-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Target Breeds</h3>
                  <div className="flex flex-wrap gap-2">
                    {criteria.breeds && criteria.breeds.length > 0 ? (
                      criteria.breeds.map((breed: string) => (
                        <span key={breed} className="px-3 py-1 bg-amber-50 text-[#f59e0b] text-sm font-bold rounded-lg border border-amber-100">
                          {breed}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-500 text-sm italic">All breeds accepted</span>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Location Focus</h3>
                  <div className="flex flex-wrap gap-2">
                    {criteria.states_served && criteria.states_served.length > 0 ? (
                      criteria.states_served.map((state: string) => (
                        <span key={state} className="px-3 py-1 bg-gray-50 text-gray-700 text-sm font-bold rounded-lg border border-gray-100">
                          {state}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-500 text-sm italic">No specific states set</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8 border-t border-gray-50">
                <div>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Max Age</h3>
                  <p className="text-xl font-bold text-gray-900">{criteria.max_age_years ? `${criteria.max_age_years} years` : 'Any age'}</p>
                </div>
                <div>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Max Weight</h3>
                  <p className="text-xl font-bold text-gray-900">{criteria.max_weight_lbs ? `${criteria.max_weight_lbs} lbs` : 'Any weight'}</p>
                </div>
                <div>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Sex Preference</h3>
                  <p className="text-xl font-bold text-gray-900 capitalize">{criteria.sex_preference || 'Any'}</p>
                </div>
              </div>

              <div className="pt-8 border-t border-gray-50">
                 <div className="flex items-center gap-3">
                  <div className={`w-10 h-6 rounded-full transition-colors relative ${criteria.accepts_mixes ? 'bg-green-500' : 'bg-gray-200'}`}>
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${criteria.accepts_mixes ? 'left-5' : 'left-1'}`}></div>
                  </div>
                  <span className="font-bold text-gray-700">Accepts Mixed Breeds</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white py-24 rounded-3xl border border-gray-100 text-center shadow-xl">
             <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center text-[#f59e0b] mx-auto mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No criteria set up</h3>
            <p className="text-gray-500 max-w-sm mx-auto mb-8">Please contact DOGSRUN support to initialize your rescue organization's matching criteria.</p>
            <Link href="mailto:support@dogsrun.org" className="inline-flex items-center px-8 py-4 bg-[#f59e0b] text-white font-black rounded-xl shadow-lg hover:bg-[#d97706] transition-all transform active:scale-95">
              Contact Support
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}
