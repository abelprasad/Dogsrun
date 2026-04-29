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

  if (!org || org.type !== 'rescue') {
    redirect('/dashboard')
  }

  const { data: criteria } = await supabase
    .from('rescue_criteria')
    .select('*')
    .eq('rescue_id', org.id)
    .maybeSingle()

  return (
    <div className="min-h-screen bg-white">
      {/* Dashboard Sub-nav */}
      <div className="bg-[#111] border-t border-white/5 py-2 px-8">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex gap-6">
            <Link href="/dashboard/rescue" className="text-xs font-bold text-[#9ca3af] hover:text-white uppercase tracking-widest transition-colors">Incoming Alerts</Link>
            <Link href="/dashboard/criteria" className="text-xs font-bold text-[#f59e0b] uppercase tracking-widest">Matching Criteria</Link>
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
            Matching criteria
          </h1>
          <p className="text-[#6b7280]">Define which dogs your rescue organization can support.</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto py-8 px-8">
        <CriteriaForm rescueId={org.id} initialCriteria={criteria} />
        
        {!criteria && (
          <p className="mt-8 text-center text-xs text-[#9ca3af] uppercase tracking-widest font-bold">
            Need help? Contact <Link href="mailto:admin@dogsrun.org" className="text-[#f59e0b] hover:underline transition-colors">admin@dogsrun.org</Link>
          </p>
        )}
      </main>
    </div>
  )
}
