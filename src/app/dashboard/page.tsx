import Link from 'next/link'
import Image from 'next/image'
import { redirect } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import StatusBadge from '@/components/status-badge'
import SignOutButton from './sign-out-button'
import ApprovalWall from '@/components/approval-wall'

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: org } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!org) redirect('/register')
  if (org.type === 'rescue') redirect('/dashboard/rescue')
  if (org.approval_status !== 'approved') return <ApprovalWall org={org} />

  const { data: admin } = await supabase
    .from('admins')
    .select('id')
    .eq('email', user.email)
    .maybeSingle()

  const isAdmin = !!admin

  const serviceClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const [{ count: total }, { count: available }, { count: urgent }, { count: placed }] = await Promise.all([
    serviceClient.from('dogs').select('*', { count: 'exact', head: true }).eq('shelter_id', org.id),
    serviceClient.from('dogs').select('*', { count: 'exact', head: true }).eq('shelter_id', org.id).in('status', ['available', null as unknown as string]),
    serviceClient.from('dogs').select('*', { count: 'exact', head: true }).eq('shelter_id', org.id).eq('status', 'urgent'),
    serviceClient.from('dogs').select('*', { count: 'exact', head: true }).eq('shelter_id', org.id).in('status', ['placed', 'adopted']),
  ])

  const { data: recentDogs } = await serviceClient
    .from('dogs')
    .select('*, alerts(status)')
    .eq('shelter_id', org.id)
    .order('created_at', { ascending: false })
    .limit(6)

  return (
    <div className="min-h-screen bg-[#f5f0e8] text-[#13241d]">
      {/* Sub-nav */}
      <div className="bg-[#13241d] border-b border-white/5 py-2 px-8">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex gap-6">
            <Link href="/dashboard" className="text-xs font-bold text-[#f4b942] uppercase tracking-widest">Dashboard</Link>
            <Link href="/dashboard/dogs" className="text-xs font-bold text-[#9ca3af] hover:text-white uppercase tracking-widest transition-colors">My Dogs</Link>
            <Link href="/dashboard/dogs/new" className="text-xs font-bold text-[#9ca3af] hover:text-white uppercase tracking-widest transition-colors">Add Dog</Link>
            {isAdmin && (
              <Link href="/dashboard/admin" className="text-xs font-bold text-[#f4b942]/60 hover:text-[#f4b942] uppercase tracking-widest transition-colors">Admin</Link>
            )}
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs font-bold text-[#9ca3af] uppercase tracking-widest">{org.name}</span>
            <SignOutButton />
          </div>
        </div>
      </div>

      {/* Header */}
      <header className="bg-[#13241d] px-5 py-14 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <h1 className="text-4xl font-black leading-tight tracking-tight text-[#f4b942] sm:text-5xl">{org.name}</h1>
          <p className="mt-2 text-[#c8d3ce]">Manage your dogs and track rescue interest.</p>
        </div>
      </header>

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
          <Link href="/dashboard/dogs" className="text-xs font-bold uppercase tracking-[0.18em] text-[#d95f4b] hover:underline">
            Manage all dogs →
          </Link>
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
              <Link href="/dashboard/dogs/new" className="text-sm font-black uppercase tracking-widest text-[#d95f4b] hover:underline">
                Add your first dog
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
