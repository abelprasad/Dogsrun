import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import SignOutButton from '../sign-out-button'
import CriteriaForm from './criteria-form'

export default async function CriteriaPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: org } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!org || org.type !== 'rescue') redirect('/dashboard')

  const { data: criteria } = await supabase
    .from('rescue_criteria')
    .select('*')
    .eq('rescue_id', org.id)
    .maybeSingle()

  return (
    <div className="min-h-screen bg-[#f5f0e8] text-[#13241d]">
      <div className="bg-[#13241d] border-b border-white/5 py-2 px-8">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex gap-6">
            <Link href="/dashboard/rescue" className="text-xs font-bold text-[#9ca3af] hover:text-white uppercase tracking-widest transition-colors">Incoming Alerts</Link>
            <Link href="/dashboard/criteria" className="text-xs font-bold text-[#f4b942] uppercase tracking-widest">Matching Criteria</Link>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs font-bold text-[#9ca3af] uppercase tracking-widest">{org.name}</span>
            <SignOutButton />
          </div>
        </div>
      </div>

      <header className="bg-[#13241d] px-5 py-14 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <h1 className="text-4xl font-black leading-tight tracking-tight text-[#f4b942] sm:text-5xl">Matching Criteria</h1>
          <p className="mt-2 text-[#c8d3ce]">Define which dogs your rescue organization can support.</p>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-5 py-10 sm:px-8 lg:px-12">
        <CriteriaForm rescueId={org.id} initialCriteria={criteria} />
        {!criteria && (
          <p className="mt-8 text-center text-xs font-bold uppercase tracking-widest text-[#7a877f]">
            Need help? Contact <Link href="mailto:admin@dogsrun.org" className="text-[#d95f4b] hover:underline">admin@dogsrun.org</Link>
          </p>
        )}
      </main>
    </div>
  )
}
