import Image from 'next/image'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { requireAuthContext } from '@/lib/auth-context'
import { supabaseAdmin } from '@/lib/supabase-server'
import ApprovalWall from '@/components/approval-wall'
import { daysUntilEuthanasia, daysLeftLabel, isDogUrgent } from '@/lib/urgency'

export default async function DashboardPage() {
  const { org, isAdmin } = await requireAuthContext()

  if (!org) {
    if (isAdmin) redirect('/admin')
    redirect('/register')
  }
  if (org.type === 'rescue') redirect('/dashboard/rescue')
  if (org.approval_status !== 'approved') return <ApprovalWall org={org} />

  const [{ count: total }, { count: available }, { count: urgent }, { count: placed }] = await Promise.all([
    supabaseAdmin.from('dogs').select('*', { count: 'exact', head: true }).eq('shelter_id', org.id),
    supabaseAdmin.from('dogs').select('*', { count: 'exact', head: true }).eq('shelter_id', org.id).in('status', ['available', null as unknown as string]),
    supabaseAdmin.from('dogs').select('*', { count: 'exact', head: true }).eq('shelter_id', org.id).eq('status', 'urgent'),
    supabaseAdmin.from('dogs').select('*', { count: 'exact', head: true }).eq('shelter_id', org.id).in('status', ['placed', 'adopted']),
  ])

  const { data: recentDogs } = await supabaseAdmin
    .from('dogs')
    .select('*, alerts(status)')
    .eq('shelter_id', org.id)
    .order('created_at', { ascending: false })
    .limit(6)

  const stats = [
    { label: 'Total dogs', value: total ?? 0, tone: 'text-white', sub: 'in your care' },
    { label: 'Available', value: available ?? 0, tone: 'text-[#c08a3e]', sub: 'waiting for matches' },
    { label: 'Urgent', value: urgent ?? 0, tone: 'text-[#c98a7a]', sub: 'need action now', hot: true },
    { label: 'Placed', value: placed ?? 0, tone: 'text-[#7ddba3]', sub: 'second runs started' },
  ]

  return (
    <div className="min-h-screen bg-[#0b140e] text-[#f8f1e8]">
      {/* ── MISSION CONTROL HEADER ── */}
      <header className="border-b border-white/10 px-5 pb-10 pt-12 sm:px-10 lg:px-16">
        <div className="mx-auto max-w-7xl">
          <p className="flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.3em] text-[#c08a3e]">
            <span className="animate-pulse-dot h-2.5 w-2.5 rounded-full bg-[#7ddba3]" />
            Mission control · {org.name}
          </p>
          <div className="mt-6 flex flex-wrap items-end justify-between gap-8">
            <h1 className="max-w-3xl text-[clamp(2.5rem,6vw,5rem)] font-black uppercase leading-[0.88] tracking-tight">
              Move dogs.<br /><span className="text-[#c08a3e]">Beat the clock.</span>
            </h1>
            {/* Quick actions: bold, obvious */}
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/dashboard/dogs/new"
                className="inline-flex items-center justify-center gap-2 bg-[#c08a3e] px-8 py-4 text-sm font-black uppercase tracking-[0.18em] text-[#140a08] transition hover:bg-[#d4a050]"
              >
                <span className="text-lg leading-none">+</span> List a dog
              </Link>
              <Link
                href="/dashboard/dogs"
                className="inline-flex items-center justify-center border-2 border-white/20 px-8 py-4 text-sm font-black uppercase tracking-[0.18em] text-white transition hover:border-[#c08a3e] hover:text-[#c08a3e]"
              >
                Manage dogs
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-10 sm:px-10 lg:px-16">
        {/* ── BIG NUMBER STAT BAND ── */}
        <div className="grid grid-cols-2 gap-px bg-white/10 lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className={`card-craft p-7 sm:p-9 ${s.hot && s.value > 0 ? 'bg-[#a8583f]/15' : ''}`}>
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#f8f1e8]/45">{s.label}</p>
              <p className={`mt-3 text-6xl font-black tracking-tight sm:text-7xl ${s.tone}`}>
                {s.value}
              </p>
              <p className="mt-2 text-xs font-bold uppercase tracking-[0.18em] text-[#f8f1e8]/40">{s.sub}</p>
            </div>
          ))}
        </div>

        {(urgent ?? 0) > 0 && (
          <Link
            href="/dashboard/dogs"
            className="mt-6 flex items-center gap-4 border-2 border-[#a8583f] bg-[#a8583f]/10 px-6 py-5 transition hover:bg-[#a8583f]/20"
          >
            <span className="animate-pulse-dot h-3 w-3 shrink-0 rounded-full bg-[#a8583f]" />
            <p className="text-sm font-black uppercase tracking-[0.18em] text-[#c98a7a]">
              {urgent} urgent dog{urgent === 1 ? '' : 's'} need{urgent === 1 ? 's' : ''} attention — review cases →
            </p>
          </Link>
        )}

        {/* ── DOG ROSTER: photo-forward with status overlays ── */}
        <div className="mb-8 mt-14 flex items-center justify-between border-b border-white/10 pb-4">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-[#f8f1e8]/50">Latest cases</p>
          <Link href="/dashboard/dogs" className="text-xs font-black uppercase tracking-[0.2em] text-[#c08a3e] hover:underline">
            All dogs →
          </Link>
        </div>

        {recentDogs && recentDogs.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {recentDogs.map((dog) => {
              const dogUrgent = isDogUrgent(dog.status, dog.euthanasia_date)
              const daysLeft = daysUntilEuthanasia(dog.euthanasia_date)
              const interested = ((dog.alerts || []) as { status: string }[]).filter((a) => a.status === 'responded').length
              return (
                <Link
                  key={dog.id}
                  href={`/dashboard/dogs/${dog.id}`}
                  className={`group relative block overflow-hidden border bg-[#122016] transition hover:-translate-y-1 ${
                    dogUrgent ? 'border border-[#a8583f]/60' : 'border-white/10 hover:border-[#c08a3e]/60'
                  }`}
                >
                  <div className="relative aspect-[16/10] overflow-hidden">
                    {dog.photo_url ? (
                      <Image src={dog.photo_url} alt={dog.name} fill className="object-cover transition duration-700 group-hover:scale-105" unoptimized />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-[#1a2e1a] text-6xl font-black text-[#c08a3e]">
                        {dog.name?.[0]}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    {/* Status overlay ribbon */}
                    <div className="absolute left-0 top-4">
                      {dogUrgent ? (
                        <span className="flex items-center gap-2 bg-[#a8583f] px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.18em] text-white">
                          <span className="animate-pulse-dot h-2 w-2 rounded-full bg-white" />
                          {daysLeftLabel(daysLeft) || 'Urgent'}
                        </span>
                      ) : (
                        <span className="bg-[#c08a3e] px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.18em] text-[#140a08]">
                          {dog.status || 'Available'}
                        </span>
                      )}
                    </div>
                    {interested > 0 && (
                      <div className="absolute right-4 top-4 bg-[#7ddba3] px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.18em] text-[#0b140e]">
                        {interested} interested
                      </div>
                    )}
                    <div className="absolute inset-x-0 bottom-0 p-5">
                      <h2 className="text-3xl font-black uppercase tracking-tight text-white">{dog.name}</h2>
                      <p className="mt-1 text-xs font-bold uppercase tracking-[0.2em] text-[#c08a3e]">
                        {dog.breed || 'Unknown breed'}{dog.age_years ? ` · ${dog.age_years}y` : ''}
                      </p>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        ) : (
          <div className="border border-dashed border-white/20 bg-[#122016] px-6 py-20 text-center">
            <p className="text-4xl font-black uppercase tracking-tight">No dogs yet.</p>
            <p className="mx-auto mt-3 max-w-sm text-sm leading-7 text-[#f8f1e8]/55">
              List your first case and it starts matching against rescue criteria immediately.
            </p>
            <Link
              href="/dashboard/dogs/new"
              className="mt-8 inline-flex bg-[#c08a3e] px-8 py-4 text-sm font-black uppercase tracking-[0.18em] text-[#140a08] transition hover:bg-[#d4a050]"
            >
              + List your first dog
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}
