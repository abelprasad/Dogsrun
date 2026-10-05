import Link from 'next/link'
import { redirect } from 'next/navigation'
import { requireAuthContext } from '@/lib/auth-context'
import CriteriaForm from './criteria-form'
import PageHeader from '@/components/ui/page-header'

export default async function CriteriaPage() {
  const { supabase, org } = await requireAuthContext()

  if (!org || org.type !== 'rescue') redirect('/dashboard')

  const { data: criteria } = await supabase
    .from('rescue_criteria')
    .select('*')
    .eq('rescue_id', org.id)
    .maybeSingle()

  return (
    <div className="min-h-screen bg-[#f5f0e8]">
      {/* Header */}
      <PageHeader
        eyebrow="Rescue Portal"
        title="Matching Criteria"
        sub="Define which dogs your rescue organization can support."
      />

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
