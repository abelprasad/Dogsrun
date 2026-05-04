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
    <div className="min-h-screen bg-[#f5f0e8]">
      <div className="bg-[#13241d] py-2 px-8">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex gap-6">
            <Link href="/dashboard/rescue" className="text-xs font-bold text-[#f5f0e8]/40 hover:text-[#f4b942] uppercase tracking-[0.24em] transition-colors">Incoming Alerts</Link>
            <Link href="/dashboard/criteria" className="text-xs font-bold text-[#f4b942] uppercase tracking-[0.24em]">Matching Criteria</Link>
            {isAdmin && (
              <Link href="/dashboard/admin" className="text-xs font-bold text-[#f5f0e8]/40 hover:text-[#f4b942] uppercase tracking-[0.24em] transition-colors">Admin</Link>
            )}
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs font-bold text-[#f5f0e8]/40 uppercase tracking-[0.24em]">{org.name}</span>
            <SignOutButton />
          </div>
        </div>
      </div>

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
          </p>
        )}
      </main>
    </div>
  )
}
