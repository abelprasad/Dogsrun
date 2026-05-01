import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
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

  // Check if user is admin
  const serviceClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const { data: adminRow } = await serviceClient
    .from('admins')
    .select('id')
    .eq('email', user.email)
    .maybeSingle()
  const isAdmin = !!adminRow

  const { data: criteria } = await supabase
    .from('rescue_criteria')
    .select('*')
    .eq('rescue_id', org.id)
    .maybeSingle()

  return (
<<<<<<< HEAD
    <div className="min-h-screen bg-[#f5f0e8] text-[#13241d]">
      <div className="bg-[#13241d] border-b border-white/5 py-2 px-8">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex gap-6">
            <Link href="/dashboard/rescue" className="text-xs font-bold text-[#9ca3af] hover:text-white uppercase tracking-widest transition-colors">Incoming Alerts</Link>
            <Link href="/dashboard/criteria" className="text-xs font-bold text-[#f4b942] uppercase tracking-widest">Matching Criteria</Link>
=======
    <div className="min-h-screen bg-[#f5f0e8]">
      {/* Subnav */}
      <div className="bg-[#13241d] py-2 px-8">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex gap-6">
            <Link href="/dashboard/rescue" className="text-xs font-bold text-[#f5f0e8]/40 hover:text-[#f4b942] uppercase tracking-[0.24em] transition-colors">Incoming Alerts</Link>
            <Link href="/dashboard/criteria" className="text-xs font-bold text-[#f4b942] uppercase tracking-[0.24em]">Matching Criteria</Link>
            {isAdmin && (
              <Link href="/dashboard/admin" className="text-xs font-bold text-[#f5f0e8]/40 hover:text-[#f4b942] uppercase tracking-[0.24em] transition-colors">Admin</Link>
            )}
>>>>>>> 0032f87 (fix: admin link on all shelter pages, my dogs + add dog restyled to dark green/cream)
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs font-bold text-[#f5f0e8]/40 uppercase tracking-[0.24em]">{org.name}</span>
            <SignOutButton />
          </div>
        </div>
      </div>

<<<<<<< HEAD
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
=======
      {/* Header */}
      <header className="bg-[#13241d] pb-12 px-8 pt-8 border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <p className="text-xs uppercase tracking-[0.24em] text-[#f4b942]/70 mb-3 font-bold">Rescue Portal</p>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-[#f4b942]">Matching Criteria</h1>
          <p className="text-[#f5f0e8]/50 mt-2 text-sm">Define which dogs your rescue organization can support.</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto py-10 px-8">
        <CriteriaForm rescueId={org.id} initialCriteria={criteria} />
        {!criteria && (
          <p className="mt-8 text-center text-xs text-[#5d6a64] uppercase tracking-[0.24em] font-bold">
            Need help? Contact <Link href="mailto:admin@dogsrun.org" className="text-[#13241d] hover:text-[#f4b942] transition-colors">admin@dogsrun.org</Link>
>>>>>>> 0032f87 (fix: admin link on all shelter pages, my dogs + add dog restyled to dark green/cream)
          </p>
        )}
      </main>
    </div>
  )
}
