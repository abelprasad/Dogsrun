import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import SignOutButton from '../sign-out-button'
import WelcomeChecklist from './welcome-checklist'

export default async function WelcomePage() {
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

  const { data: org } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!org) redirect('/register')

  // Shelter: check if they have any dogs
  let hasDogs = false
  if (org.type === 'shelter') {
    const { count } = await supabase
      .from('dogs')
      .select('id', { count: 'exact', head: true })
      .eq('shelter_id', org.id)
    hasDogs = (count ?? 0) > 0
  }

  // Rescue: check if they have criteria set
  let hasCriteria = false
  if (org.type === 'rescue') {
    const { count } = await supabase
      .from('rescue_criteria')
      .select('id', { count: 'exact', head: true })
      .eq('rescue_id', org.id)
    hasCriteria = (count ?? 0) > 0
  }

  const dashboardHref = org.type === 'rescue' ? '/dashboard/rescue' : '/dashboard'

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
          <p className="text-xs font-bold text-[#f59e0b] uppercase tracking-widest mb-3">Getting started</p>
          <h1 className="text-4xl md:text-5xl font-[900] tracking-tight text-[#111] mb-2">
            Welcome to DOGSRUN
          </h1>
          <p className="text-[#6b7280]">Follow the steps below to get your organization set up.</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-12 px-8">
        <WelcomeChecklist
          orgType={org.type}
          orgId={org.id}
          approvalStatus={org.approval_status ?? 'approved'}
          hasDogs={hasDogs}
          hasCriteria={hasCriteria}
          dashboardHref={dashboardHref}
        />
      </main>
    </div>
  )
}
