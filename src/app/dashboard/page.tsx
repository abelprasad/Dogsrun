import Image from 'next/image'
import { redirect } from 'next/navigation'
import { requireAuthContext } from '@/lib/auth-context'
import StatusBadge from '@/components/status-badge'
import ApprovalWall from '@/components/approval-wall'
import { supabaseAdmin } from '@/lib/supabase-server'
import PageHeader from '@/components/ui/page-header'
import Button from '@/components/ui/button'

export default async function DashboardPage() {
  const { org, isAdmin } = await requireAuthContext()

  if (!org) {
    if (isAdmin) redirect('/admin')
    redirect('/register')
  }
  if (org.type === 'rescue') redirect('/dashboard/rescue')
  if (org.approval_status !== 'approved') return <ApprovalWall org={org} />


  // Single query counted in JS (was 4 separate count queries).
  // L-9: NULL status counts as 'available' to match the page's rendering logic.
  const { data: statusRows } = await supabaseAdmin
    .from('dogs')
    .select('status')
    .eq('shelter_id', org.id)

  const total = statusRows?.length ?? 0
  const available = statusRows?.filter((d) => d.status === 'available' || d.status === null).length ?? 0
  const urgent = statusRows?.filter((d) => d.status === 'urgent').length ?? 0
  const placed = statusRows?.filter((d) => d.status === 'placed' || d.status === 'adopted').length ?? 0
  const { data: recentDogs } = await supabaseAdmin
    .from('dogs')
    .select('*, alerts(status)')
    .eq('shelter_id', org.id)
    .order('created_at', { ascending: false })
    .limit(6)

  return (
    <div className="min-h-screen bg-[#f5f0e8] text-[#13241d]">
      <PageHeader
        title={org.name}
        sub="Manage your dogs and track rescue interest."
        className="bg-[#13241d] px-5 py-14 sm:px-8 lg:px-12"
        titleClassName="text-4xl font-black leading-tight tracking-tight text-[#f4b942] sm:text-5xl"
        subClassName="mt-2 text-[#c8d3ce]"
      />

      <main className="mx-auto max-w-7xl px-5 py-10 sm:px-8 lg:px-12">
        {/* Stat cards */}
        <div className="mb-10 grid grid-cols-2 gap-px bg-[#13241d]/15 md:grid-cols-4">
          {[
            { label: 'Total Dogs', value: total ?? 0, color: 'bg-[#fff9ef]', textColor: 'text-[#13241d]', labelColor: 'text-[#7a877f]' },
            { label: 'Available', value: available ?? 0, color: 'bg-[#fff9ef]', textColor: 'text-[#13241d]', labelColor: 'text-[#7a877f]' },
            { label: 'Urgent', value: urgent ?? 0, color: 'bg-red-50', textColor: 'text-red-600', labelColor: 'text-red-400' },
            { label: 'Placed / Adopted', value: placed ?? 0, color: 'bg-[#dcfce7]', textColor: 'text-green-700', labelColor: 'text-green-600' },
          ].map(({ label, value, color, textColor, labelColor }) => (
            <div key={label} className={`${color} p-6`}>
              <p className={`text-[10px] font-bold uppercase tracking-[0.22em] mb-2 ${labelColor}`}>{label}</p>
              <p className={`text-3xl font-black ${textColor}`}>{value}</p>
            </div>
          ))}
        </div>

        {/* Recent dogs */}
        <div className="mb-6 flex items-center justify-between border-y border-[#13241d]/10 py-4">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#436154]">Recent Dogs</p>
          <Button variant="ghost" href="/dashboard/dogs" className="text-xs font-bold uppercase tracking-[0.18em]">
            Manage all dogs →
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {recentDogs && recentDogs.length > 0 ? (
            recentDogs.map((dog) => (
              <div key={dog.id} className="flex flex-col overflow-hidden bg-[#fff9ef] outline outline-1 outline-[#13241d]/10">
                <div className="relative h-36 bg-[#dce8dd] overflow-hidden">
                  {dog.photo_url ? (
                    <Image src={dog.photo_url} alt={dog.name} fill className="object-cover" unoptimized />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-3xl font-black text-[#f4b942]">
                      {dog.name?.[0]}
                    </div>
                  )}
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <div className="flex items-start justify-between mb-1">
                    <h2 className="text-base font-black text-[#13241d]">{dog.name}</h2>
                    <StatusBadge status={dog.status || 'available'} euthanasiaDate={dog.euthanasia_date} />
                  </div>
                  <p className="text-xs text-[#5d6a64] mb-2">{dog.breed || 'Unknown breed'}{dog.age_years ? ` · ${dog.age_years}y` : ''}</p>
                  {(() => {
                    const interested = (dog.alerts || []).filter((a: { status: string }) => a.status === 'responded').length
                    return interested > 0 ? (
                      <p className="text-xs font-black text-green-600">{interested} rescue{interested !== 1 ? 's' : ''} interested</p>
                    ) : null
                  })()}
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full border border-dashed border-[#13241d]/20 bg-[#fff9ef] px-6 py-20 text-center">
              <p className="text-[#5d6a64] mb-4">No dogs listed yet.</p>
              <Button variant="ghost" href="/dashboard/dogs/new" className="text-sm font-black uppercase tracking-widest">
                Add your first dog
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
