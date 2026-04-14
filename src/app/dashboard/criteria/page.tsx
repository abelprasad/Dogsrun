import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import SignOutButton from '../sign-out-button'
import CriteriaForm from './criteria-form'

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

  // Fetch organization by email as requested
  const { data: org } = await supabase
    .from('organizations')
    .select('*')
    .eq('email', user.email)
    .single()

  if (!org || org.type !== 'rescue') {
    redirect('/dashboard')
  }

  // Fetch rescue criteria
  const { data: criteria } = await supabase
    .from('rescue_criteria')
    .select('*')
    .eq('organization_id', org.id)
    .maybeSingle()

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
        </div>

        <CriteriaForm organizationId={org.id} initialCriteria={criteria} />
        
        {!criteria && (
          <p className="mt-8 text-center text-sm text-gray-400">
            If you need help setting up your criteria, please contact <Link href="mailto:support@dogsrun.org" className="text-[#f59e0b] hover:underline">support@dogsrun.org</Link>.
          </p>
        )}
      </main>
    </div>
  )
}
