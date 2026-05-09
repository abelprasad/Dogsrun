import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'
import StatusBadge from '@/components/status-badge'

const serviceClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const PAGE_SIZE = 12

// TODO: Remove once admin orgs are separated from shelter/rescue orgs
const TEST_EMAILS = ['abelprasad5@gmail.com', 'amypitrra@gmail.com']

type Tab = 'dogs' | 'shelters' | 'rescues'

const TABS: { key: Tab; label: string }[] = [
  { key: 'dogs', label: 'Dogs' },
  { key: 'shelters', label: 'Shelters' },
  { key: 'rescues', label: 'Rescues' },
]

const HERO: Record<Tab, { heading: string; sub: string }> = {
  dogs: {
    heading: 'Dogs ready for a rescue commitment.',
    sub: 'A live view of available and urgent dogs in the DOGSRUN network. Open a profile to review the details shelters need rescues to see first.',
  },
  shelters: {
    heading: 'Shelter partners in the network.',
    sub: 'Approved shelters actively listing dogs for rescue. Each partner has been verified and onboarded through DOGSRUN.',
  },
  rescues: {
    heading: 'Rescues looking for their next dog.',
    sub: 'Active rescue organizations in the DOGSRUN network and the dogs they\'re ready to take.',
  },
}

export default async function BrowsePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; page?: string }>
}) {
  const { tab: tabParam, page: pageParam } = await searchParams
  const tab: Tab = (tabParam === 'shelters' || tabParam === 'rescues') ? tabParam : 'dogs'
  const page = Math.max(1, parseInt(pageParam || '1', 10))
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  // ── Dogs ──────────────────────────────────────────────────────────────────
  let dogs: any[] = []
  let dogCount = 0
  let totalPages = 1

  if (tab === 'dogs') {
    const { data, count } = await serviceClient
      .from('dogs')
      .select('*, organizations(name, city, state)', { count: 'exact' })
      .in('status', ['available', 'urgent'])
      .order('created_at', { ascending: false })
      .range(from, to)
    dogs = data || []
    dogCount = count || 0
    totalPages = Math.ceil(dogCount / PAGE_SIZE)
  }

  // ── Shelters ───────────────────────────────────────────────────────────────
  let shelters: any[] = []

  if (tab === 'shelters') {
    const { data } = await serviceClient
      .from('organizations')
      .select('id, name, city, state')
      .eq('type', 'shelter')
      .eq('approval_status', 'approved')
      .not('email', 'in', `(${TEST_EMAILS.join(',')})`)
      .order('name')
    shelters = data || []

    // Attach dog counts
    const counts = await Promise.all(
      shelters.map(s =>
        serviceClient
          .from('dogs')
          .select('id', { count: 'exact', head: true })
          .eq('shelter_id', s.id)
          .in('status', ['available', 'urgent'])
      )
    )
    shelters = shelters.map((s, i) => ({ ...s, dog_count: counts[i].count || 0 }))
  }

  // ── Rescues ────────────────────────────────────────────────────────────────
  let rescues: any[] = []

  if (tab === 'rescues') {
    const { data } = await serviceClient
      .from('organizations')
      .select('id, name, city, state')
      .eq('type', 'rescue')
      .eq('approval_status', 'approved')
      .not('email', 'in', `(${TEST_EMAILS.join(',')})`)
      .order('name')
    const orgs = data || []

    const criteria = await Promise.all(
      orgs.map(o =>
        serviceClient
          .from('rescue_criteria')
          .select('breeds, states_served')
          .eq('rescue_id', o.id)
          .eq('is_active', true)
          .maybeSingle()
      )
    )
    rescues = orgs.map((o, i) => ({ ...o, criteria: criteria[i].data }))
  }

  const hero = HERO[tab]

  return (
    <div className="min-h-screen bg-[#f5f0e8] text-[#13241d]">
      {/* Hero */}
      <header className="bg-[#13241d] px-5 pb-0 pt-16 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6 inline-flex items-center gap-3 border-y border-[#f4b942]/30 py-3 text-[11px] font-bold uppercase tracking-[0.28em] text-[#f4b942]">
            <span className="h-2 w-2 rounded-full bg-[#d95f4b]" />
            DOGSRUN Network
          </div>
          <h1 className="max-w-4xl text-5xl font-black leading-[0.9] tracking-tight text-[#f4b942] sm:text-6xl lg:text-7xl">
            {hero.heading}
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-[#c8d3ce]">
            {hero.sub}
          </p>

          {/* Tabs */}
          <div className="mt-10 flex gap-1">
            {TABS.map(t => (
              <Link
                key={t.key}
                href={`/dogs?tab=${t.key}`}
                className={`px-5 py-3 text-xs font-black uppercase tracking-[0.2em] transition-colors ${
                  tab === t.key
                    ? 'bg-[#f4b942] text-[#13241d]'
                    : 'bg-[#13241d] text-[#f5f0e8]/50 hover:text-[#f5f0e8] border border-white/10'
                }`}
              >
                {t.label}
              </Link>
            ))}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-10 sm:px-8 lg:px-12">

        {/* ── Dogs tab ── */}
        {tab === 'dogs' && (
          dogs.length > 0 ? (
            <>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {dogs.map((dog) => (
                  <Link
                    key={dog.id}
                    href={`/dogs/${dog.id}`}
                    className="group flex min-h-full flex-col overflow-hidden bg-[#fff9ef] outline outline-1 outline-[#13241d]/10 transition hover:-translate-y-1 hover:outline-[#d95f4b]"
                  >
                    <div className="relative aspect-[5/4] overflow-hidden bg-[#dce8dd]">
                      {dog.photo_url ? (
                        <Image
                          src={dog.photo_url}
                          alt={dog.name}
                          fill
                          className="object-cover saturate-[0.92] transition duration-700 group-hover:scale-105"
                          unoptimized
                          sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 90vw"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-[#dce8dd] text-7xl font-black text-[#436154]">
                          {dog.name?.[0] || 'D'}
                        </div>
                      )}
                      <div className="absolute left-4 top-4">
                        <StatusBadge status={dog.status} euthanasiaDate={dog.euthanasia_date} />
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#13241d]/75 to-transparent p-4 pt-16">
                        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#f8f1e8]/80">
                          {dog.organizations?.city}{dog.organizations?.state ? `, ${dog.organizations.state}` : ''}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-1 flex-col p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h2 className="text-2xl font-black tracking-tight text-[#13241d]">{dog.name}</h2>
                          <p className="mt-1 text-sm font-semibold text-[#617069]">
                            {dog.breed}{dog.mix ? ' mix' : ''}
                          </p>
                        </div>
                        <span className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#13241d] text-xs font-black text-[#f8f1e8]">
                          {dog.organizations?.name?.[0] || 'S'}
                        </span>
                      </div>

                      <div className="mt-6 grid grid-cols-3 gap-px bg-[#13241d]/10">
                        {[
                          { label: 'Age', value: dog.age_years ? `${dog.age_years}y` : '-' },
                          { label: 'Weight', value: dog.weight_lbs ? `${dog.weight_lbs} lb` : '-' },
                          { label: 'Sex', value: dog.sex || '-' },
                        ].map(({ label, value }) => (
                          <div key={label} className="bg-[#f5f0e8] p-3">
                            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#7a877f]">{label}</p>
                            <p className="mt-1 text-sm font-black capitalize text-[#13241d]">{value}</p>
                          </div>
                        ))}
                      </div>

                      <div className="mt-5 flex items-center justify-between gap-4 border-t border-[#13241d]/10 pt-4">
                        <p className="min-w-0 text-xs leading-5 text-[#617069]">
                          From <span className="font-black text-[#13241d]">{dog.organizations?.name || 'Shelter partner'}</span>
                        </p>
                        <span className="shrink-0 text-xs font-black uppercase tracking-[0.18em] text-[#d95f4b]">
                          Review
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="mt-12 flex items-center justify-between border-t border-[#13241d]/10 pt-8">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#7a877f]">
                    Page {page} of {totalPages} · {dogCount} dogs
                  </p>
                  <div className="flex gap-2">
                    {page > 1 && (
                      <Link href={`/dogs?tab=dogs&page=${page - 1}`}
                        className="border border-[#13241d]/20 bg-[#fff9ef] px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-[#13241d] transition hover:bg-[#13241d] hover:text-[#f4b942]">
                        ← Prev
                      </Link>
                    )}
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                      <Link key={p} href={`/dogs?tab=dogs&page=${p}`}
                        className={`px-4 py-2 text-xs font-black uppercase tracking-[0.16em] transition ${
                          p === page
                            ? 'bg-[#f4b942] text-[#13241d]'
                            : 'border border-[#13241d]/20 bg-[#fff9ef] text-[#13241d] hover:bg-[#13241d] hover:text-[#f4b942]'
                        }`}>
                        {p}
                      </Link>
                    ))}
                    {page < totalPages && (
                      <Link href={`/dogs?tab=dogs&page=${page + 1}`}
                        className="border border-[#13241d]/20 bg-[#fff9ef] px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-[#13241d] transition hover:bg-[#13241d] hover:text-[#f4b942]">
                        Next →
                      </Link>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="border border-dashed border-[#13241d]/20 bg-[#fff9ef] px-6 py-20 text-center">
              <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#436154]">No open cases</p>
              <p className="mx-auto mt-4 max-w-md text-base leading-7 text-[#617069]">
                There are no dogs currently available for rescue. New shelter cases will appear here as soon as they are published.
              </p>
            </div>
          )
        )}

        {/* ── Shelters tab ── */}
        {tab === 'shelters' && (
          shelters.length > 0 ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {shelters.map((shelter) => (
                <Link
                  key={shelter.id}
                  href={`/dogs?tab=dogs`}
                  className="group flex flex-col bg-[#fff9ef] outline outline-1 outline-[#13241d]/10 p-6 transition hover:-translate-y-1 hover:outline-[#f4b942]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center bg-[#13241d] text-xl font-black text-[#f4b942]">
                      {shelter.name?.[0] || 'S'}
                    </div>
                    <span className="mt-1 rounded-full bg-[#dce8dd] px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#436154]">
                      Verified Partner
                    </span>
                  </div>

                  <div className="mt-4">
                    <h2 className="text-lg font-black leading-tight text-[#13241d]">{shelter.name}</h2>
                    {(shelter.city || shelter.state) && (
                      <p className="mt-1 text-sm text-[#617069]">
                        {shelter.city}{shelter.city && shelter.state ? ', ' : ''}{shelter.state}
                      </p>
                    )}
                  </div>

                  <div className="mt-5 border-t border-[#13241d]/10 pt-4 flex items-center justify-between">
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#7a877f]">Available Dogs</p>
                      <p className="mt-0.5 text-2xl font-black text-[#13241d]">{shelter.dog_count}</p>
                    </div>
                    <span className="text-xs font-black uppercase tracking-[0.18em] text-[#f4b942] group-hover:underline">
                      View Dogs →
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="border border-dashed border-[#13241d]/20 bg-[#fff9ef] px-6 py-20 text-center">
              <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#436154]">No shelter partners yet</p>
              <p className="mx-auto mt-4 max-w-md text-base leading-7 text-[#617069]">
                Shelters will appear here once they've been approved by the DOGSRUN team.
              </p>
            </div>
          )
        )}

        {/* ── Rescues tab ── */}
        {tab === 'rescues' && (
          rescues.length > 0 ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {rescues.map((rescue) => {
                const breeds: string[] = rescue.criteria?.breeds || []
                const states: string[] = rescue.criteria?.states_served || []
                const visibleBreeds = breeds.slice(0, 3)
                const extraBreeds = breeds.length - 3

                return (
                  <div
                    key={rescue.id}
                    className="flex flex-col bg-[#fff9ef] outline outline-1 outline-[#13241d]/10 p-6"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center bg-[#f4b942] text-xl font-black text-[#13241d]">
                        {rescue.name?.[0] || 'R'}
                      </div>
                      <span className="mt-1 rounded-full bg-[#f4b942]/20 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#7a4f00]">
                        Active Rescue
                      </span>
                    </div>

                    <div className="mt-4">
                      <h2 className="text-lg font-black leading-tight text-[#13241d]">{rescue.name}</h2>
                      {(rescue.city || rescue.state) && (
                        <p className="mt-1 text-sm text-[#617069]">
                          {rescue.city}{rescue.city && rescue.state ? ', ' : ''}{rescue.state}
                        </p>
                      )}
                    </div>

                    {states.length > 0 && (
                      <div className="mt-4">
                        <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#7a877f] mb-2">States Served</p>
                        <div className="flex flex-wrap gap-1">
                          {states.slice(0, 6).map(s => (
                            <span key={s} className="bg-[#13241d] px-2 py-0.5 text-[10px] font-black text-[#f4b942]">{s}</span>
                          ))}
                          {states.length > 6 && (
                            <span className="bg-[#13241d]/10 px-2 py-0.5 text-[10px] font-black text-[#617069]">+{states.length - 6}</span>
                          )}
                        </div>
                      </div>
                    )}

                    {visibleBreeds.length > 0 && (
                      <div className="mt-4">
                        <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#7a877f] mb-2">Breed Preferences</p>
                        <div className="flex flex-wrap gap-1">
                          {visibleBreeds.map(b => (
                            <span key={b} className="bg-[#f5f0e8] px-2 py-0.5 text-[10px] font-semibold text-[#436154] outline outline-1 outline-[#13241d]/10">{b}</span>
                          ))}
                          {extraBreeds > 0 && (
                            <span className="bg-[#f5f0e8] px-2 py-0.5 text-[10px] font-semibold text-[#617069] outline outline-1 outline-[#13241d]/10">+{extraBreeds} more</span>
                          )}
                        </div>
                      </div>
                    )}

                    {!rescue.criteria && (
                      <p className="mt-4 text-xs text-[#617069] italic">No matching criteria set yet.</p>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="border border-dashed border-[#13241d]/20 bg-[#fff9ef] px-6 py-20 text-center">
              <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#436154]">No rescue partners yet</p>
              <p className="mx-auto mt-4 max-w-md text-base leading-7 text-[#617069]">
                Rescue organizations will appear here once they've been approved by the DOGSRUN team.
              </p>
            </div>
          )
        )}

      </main>
    </div>
  )
}
